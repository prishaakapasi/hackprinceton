#!/usr/bin/env python3
"""
ParkiStep — Parkinson's Gait Rehabilitation Tool
=================================================
Three input modes:
  [1] Live      — receive UDP packets from phone (port 5555)
  [2] Demo      — built-in walking simulation, no phone needed
  [3] Keyboard  — press Enter to tap each step manually

Step detection: dual moving-average peak detector
  • Slow average (30 samples) tracks the noise floor
  • Fast average (5 samples) tracks local peaks
  • Step fires when fast/slow ratio exceeds sensitivity threshold
  • Hysteresis + anti-bounce prevent double-counts

Metronome: adaptive BPM × 1.10 lead, L/R stereo alternation,
           early-reflection reverb → "in front" headphone sensation
Freeze detection: no step for 2.5 s → louder, faster rescue beat

Requirements:  pip install pygame numpy
"""

import json
import os
import socket
import sys
import threading
import time
from collections import deque
from typing import Optional

import numpy as np
import pygame

# ── Configuration ──────────────────────────────────────────────────────────────
UDP_PORT         = 5555
SAMPLE_RATE      = 44100
FREEZE_THRESHOLD = 2.5         # seconds without step → FOG
STEP_LEAD        = 1.10        # metronome 10% ahead of detected cadence
RESCUE_LEAD      = 1.30        # rescue beat 30% faster to cue restart
NORMAL_VOL       = 0.90
RESCUE_VOL       = 1.00
DEFAULT_BPM      = 80
MIN_BPM          = 40
MAX_BPM          = 160
STEP_HISTORY     = 5           # steps averaged for BPM
FAST_WIN         = 5           # fast moving-average window (peak tracking)
SLOW_WIN         = 30          # slow moving-average window (noise floor)
MIN_STEP_SEC     = 0.30        # anti-bounce
STEP_PAN         = 0.30        # L/R pan per beat (0=mono, 1=full side)
DEFAULT_SENS     = 1.8         # fast/slow ratio to fire a step (tunable)

THEMES = {
    "1": ("Metronome Click", "click"),
    "2": ("Woodblock",       "wood"),
    "3": ("Soft Bell",       "bell"),
    "4": ("Bass Drum",       "bass"),
}


# ── Audio Synthesis ────────────────────────────────────────────────────────────

def _adsr(n, sr, atk, dec, sus, rel):
    env   = np.ones(n, dtype=np.float32)
    a, d  = min(int(atk * sr), n), min(int(dec * sr), n)
    r     = min(int(rel * sr), n)
    s_end = n - r
    if a:             env[:a]         = np.linspace(0, 1, a, dtype=np.float32)
    if d:             env[a:a+d]      = np.linspace(1, sus, d, dtype=np.float32)
    if a+d < s_end:   env[a+d:s_end]  = sus
    if r:             env[s_end:]     = np.linspace(sus, 0, r, dtype=np.float32)
    return env

def _synth_click(sr=SAMPLE_RATE):
    dur = 0.04;  t = np.linspace(0, dur, int(sr*dur), dtype=np.float32)
    s = np.sin(2*np.pi*1200*t) + np.random.randn(len(t)).astype(np.float32)*0.35
    s *= _adsr(len(t), sr, 0.001, dur*0.6, 0, dur*0.4)
    return s / (np.max(np.abs(s)) + 1e-9)

def _synth_wood(sr=SAMPLE_RATE):
    dur = 0.07;  t = np.linspace(0, dur, int(sr*dur), dtype=np.float32)
    s = (np.sin(2*np.pi*900*t)*0.5 + np.sin(2*np.pi*2484*t)*0.3
         + np.sin(2*np.pi*4860*t)*0.2).astype(np.float32)
    s *= _adsr(len(t), sr, 0.001, dur*0.35, 0, dur*0.65)
    return s / (np.max(np.abs(s)) + 1e-9)

def _synth_bell(sr=SAMPLE_RATE):
    dur = 0.22;  t = np.linspace(0, dur, int(sr*dur), dtype=np.float32)
    s = sum(a * np.sin(2*np.pi*523*r*t)
            for r, a in [(1.0,1.0),(2.756,0.45),(5.404,0.2),(8.933,0.08)])
    s = s.astype(np.float32)
    s *= _adsr(len(t), sr, 0.002, dur*0.12, 0.28, dur*0.55)
    return s / (np.max(np.abs(s)) + 1e-9)

def _synth_bass(sr=SAMPLE_RATE):
    dur = 0.14;  t = np.linspace(0, dur, int(sr*dur), dtype=np.float32)
    fenv = (100 * np.exp(-12*t)).astype(np.float32)
    s = np.sin(2*np.pi*np.cumsum(fenv)/sr).astype(np.float32)
    s += np.random.randn(len(t)).astype(np.float32) * 0.12
    s *= _adsr(len(t), sr, 0.001, dur*0.45, 0, dur*0.55)
    return s / (np.max(np.abs(s)) + 1e-9)

_GEN = {"click": _synth_click, "wood": _synth_wood,
        "bell": _synth_bell,   "bass": _synth_bass}


# ── Spatial Audio ──────────────────────────────────────────────────────────────

def _forward_reverb(mono, sr=SAMPLE_RATE):
    """Early reflections → sound externalises to 'in front' through headphones."""
    out = mono.copy().astype(np.float64)
    for ms, g in [(1.3, 0.12), (2.9, 0.06), (4.6, 0.03)]:
        d = int(ms * sr / 1000)
        if d < len(mono):
            ref = np.zeros_like(out);  ref[d:] = mono[:-d] * g;  out += ref
    return out.astype(np.float32)

def _to_sound(mono, pan=0.0, vol=1.0, sr=SAMPLE_RATE):
    """Equal-power stereo pan. pan=0 → centred/forward, ±1 → full side."""
    sig   = _forward_reverb(mono, sr).astype(np.float64)
    angle = (pan + 1.0) * np.pi / 4
    stereo = np.column_stack([sig * np.cos(angle) * vol,
                               sig * np.sin(angle) * vol])
    stereo = np.clip(stereo, -1.0, 1.0)
    return pygame.sndarray.make_sound(
        np.ascontiguousarray((stereo * 32767).astype(np.int16)))

def build_sounds(theme_key):
    """Return (left_beat, right_beat, rescue_beat)."""
    _, tag = THEMES[theme_key]
    mono   = _GEN[tag]()
    left   = _to_sound(mono, pan=-STEP_PAN, vol=NORMAL_VOL)
    right  = _to_sound(mono, pan=+STEP_PAN, vol=NORMAL_VOL)
    rescue = _to_sound(_synth_click(), pan=0.0, vol=RESCUE_VOL)
    return left, right, rescue


# ── Step Detection ─────────────────────────────────────────────────────────────

class StepDetector:
    """
    Dual moving-average peak detector.

    Signal path:  raw |z|  →  fast_avg (5 samples)
                            →  slow_avg (30 samples)   ← noise floor
    Step fires when:  fast_avg / slow_avg  > sensitivity
                  AND signal falling (peak has passed)
                  AND min interval since last step

    The dual-average approach adapts automatically to the user's
    walking intensity — no manual calibration needed.
    """

    def __init__(self, sensitivity: float = DEFAULT_SENS) -> None:
        self._fast    : deque = deque(maxlen=FAST_WIN)
        self._slow    : deque = deque(maxlen=SLOW_WIN)
        self._step_ts : deque = deque(maxlen=STEP_HISTORY)
        self._last_t  : Optional[float] = None
        self._sens    = sensitivity
        self._above   = False      # hysteresis: are we above threshold?
        self._peak_r  = 0.0       # tracked ratio at last peak
        self._lock    = threading.Lock()
        # observable for UI
        self.last_ratio  = 0.0
        self.step_count  = 0

    # ── tuning ────────────────────────────────────────────────────────────────
    def set_sensitivity(self, s: float) -> None:
        with self._lock:
            self._sens = max(1.1, min(4.0, s))

    def sensitivity(self) -> float:
        with self._lock:
            return self._sens

    # ── main feed ─────────────────────────────────────────────────────────────
    def feed(self, z: float) -> bool:
        """Feed one Z-axis sample. Returns True if a step fired."""
        val = abs(float(z))
        with self._lock:
            self._fast.append(val)
            self._slow.append(val)
            if len(self._slow) < SLOW_WIN:
                return False

            fast_avg = float(np.mean(self._fast))
            slow_avg = float(np.mean(self._slow))
            if slow_avg < 1e-6:
                return False

            ratio = fast_avg / slow_avg
            self.last_ratio = ratio

            now = time.perf_counter()

            # Rising edge: mark that we're above threshold
            if not self._above and ratio >= self._sens:
                self._above   = True
                self._peak_r  = ratio

            # Falling edge: fire the step as signal comes back down
            elif self._above and ratio < self._sens * 0.75:
                self._above = False
                since = (now - self._last_t) if self._last_t else 99.0
                if since >= MIN_STEP_SEC:
                    self._last_t = now
                    self._step_ts.append(now)
                    self.step_count += 1
                    return True

        return False

    def force_step(self) -> None:
        """Manually inject a step (keyboard simulation)."""
        with self._lock:
            now = time.perf_counter()
            since = (now - self._last_t) if self._last_t else 99.0
            if since >= MIN_STEP_SEC:
                self._last_t = now
                self._step_ts.append(now)
                self.step_count += 1

    def bpm(self) -> float:
        with self._lock:
            ts = list(self._step_ts)
        if len(ts) < 2:
            return DEFAULT_BPM
        ivs = [b - a for a, b in zip(ts[:-1], ts[1:])]
        return float(np.clip(60.0 / np.mean(ivs), MIN_BPM, MAX_BPM))

    def gap(self) -> float:
        with self._lock:
            return (time.perf_counter() - self._last_t) if self._last_t else 0.0

    def has_started(self) -> bool:
        with self._lock:
            return self._last_t is not None


# ── Demo Walker ────────────────────────────────────────────────────────────────

class DemoWalker(threading.Thread):
    """
    Generates synthetic accelerometer data to simulate walking.
    Each 'step' is a Gaussian pulse on top of background gait oscillation.
    Lets you test everything — metronome, freeze detection, BPM display —
    without a phone.
    """

    def __init__(self, detector: StepDetector, bpm: float = 80.0) -> None:
        super().__init__(daemon=True, name="DemoWalker")
        self._det     = detector
        self._bpm     = bpm
        self._running = True
        self.sim_bpm  = bpm     # readable by UI

    def set_bpm(self, bpm: float) -> None:
        self._bpm = float(np.clip(bpm, MIN_BPM, MAX_BPM))
        self.sim_bpm = self._bpm

    def run(self) -> None:
        RATE = 50          # simulate phone at 50 Hz
        dt   = 1.0 / RATE
        t    = 0.0

        while self._running:
            period = 60.0 / self._bpm
            phase  = (t % period) / period          # 0→1 within one step

            # Gaussian step impulse centred at 15% of cycle
            impulse = 3.5 * np.exp(-((phase - 0.15)**2) / (2 * 0.025**2))
            # Background walking sway (lower amplitude)
            sway    = 0.4 * np.sin(2 * np.pi * t / period)
            noise   = np.random.randn() * 0.15

            z = impulse + sway + noise
            self._det.feed(z)

            t += dt
            time.sleep(dt)

    def pause(self) -> None:
        """Simulate freeze: stop feeding samples for FREEZE_THRESHOLD + 0.5 s."""
        time.sleep(FREEZE_THRESHOLD + 0.5)

    def stop(self) -> None:
        self._running = False


# ── Adaptive Metronome ─────────────────────────────────────────────────────────

class Metronome(threading.Thread):
    def __init__(self, detector: StepDetector, theme: str = "1") -> None:
        super().__init__(daemon=True, name="Metronome")
        self._det       = detector
        self._theme     = theme
        self._sounds    = None
        self._side      = 0
        self._bpm       = float(DEFAULT_BPM)
        self._frozen    = False
        self._running   = True
        self._new_theme = None
        self._lock      = threading.Lock()

    def change_theme(self, key: str) -> None:
        with self._lock:
            self._new_theme = key

    @property
    def bpm(self) -> float:
        with self._lock: return self._bpm

    @property
    def frozen(self) -> bool:
        with self._lock: return self._frozen

    def _maybe_reload(self) -> None:
        with self._lock:
            key = self._new_theme
        if key is None:
            return
        sounds = build_sounds(key)
        with self._lock:
            self._theme = key;  self._new_theme = None;  self._sounds = sounds

    # beats_played is readable by UI to confirm sound is firing
    beats_played: int = 0

    def run(self) -> None:
        try:
            self._sounds = build_sounds(self._theme)
        except Exception as exc:
            print(f"\n  [Metronome] AUDIO BUILD FAILED: {exc}")
            return

        next_beat = time.perf_counter()

        while self._running:
            try:
                self._maybe_reload()
                now     = time.perf_counter()
                gap     = self._det.gap()
                started = self._det.has_started()
                frozen  = started and gap > FREEZE_THRESHOLD

                was_frozen = self._frozen
                with self._lock:
                    self._frozen = frozen

                if frozen and not was_frozen:
                    _notify("FREEZE DETECTED — rescue beat active")
                elif not frozen and was_frozen:
                    _notify("Step resumed — returning to normal cadence")
                    next_beat = now

                detected = self._det.bpm()
                play_bpm = min(MAX_BPM, detected * (RESCUE_LEAD if frozen else STEP_LEAD))
                with self._lock:
                    self._bpm = play_bpm

                if now >= next_beat:
                    l, r, rescue = self._sounds
                    if frozen:
                        rescue.play()
                    else:
                        (l if self._side % 2 == 0 else r).play()
                        self._side += 1
                    Metronome.beats_played += 1

                    interval  = 60.0 / play_bpm
                    next_beat += interval
                    if next_beat < now:
                        next_beat = now + interval

            except Exception as exc:
                print(f"\n  [Metronome] error: {exc}")

            time.sleep(0.003)

    def stop(self) -> None:
        self._running = False


# ── UDP Receiver ───────────────────────────────────────────────────────────────

def _parse_z(data: bytes) -> Optional[float]:
    text = data.decode("utf-8", errors="ignore").strip()
    if text.startswith("{"):
        try:
            obj = json.loads(text)
            for k in ("z","az","accZ","acc_z","linearAccelerationZ","lin_acc_z"):
                if k in obj:
                    return float(obj[k])
            if "linear_acceleration" in obj:
                return float(obj["linear_acceleration"].get("z", 0))
            if "values" in obj and len(obj["values"]) >= 3:
                return float(obj["values"][2])
        except Exception:
            pass
        return None
    parts = text.split(",")
    for idx in (3, 2, -1):
        try:
            return float(parts[idx])
        except (IndexError, ValueError):
            continue
    return None

def udp_listener(detector: StepDetector, port: int = UDP_PORT) -> None:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    sock.settimeout(1.0)
    sock.bind(("", port))
    _notify(f"UDP listening on port {port}")
    while True:
        try:
            data, _ = sock.recvfrom(2048)
            z = _parse_z(data)
            if z is not None:
                detector.feed(z)
        except socket.timeout:
            pass
        except Exception:
            pass


# ── Terminal UI ────────────────────────────────────────────────────────────────

_NOTIFY_LOCK = threading.Lock()
_PENDING: list = []

def _notify(msg: str) -> None:
    with _NOTIFY_LOCK:
        _PENDING.append(msg)

def _signal_bar(ratio: float, threshold: float, width: int = 20) -> str:
    """ASCII bar showing current signal ratio vs threshold."""
    filled = int(min(ratio / (threshold * 1.5), 1.0) * width)
    bar    = "█" * filled + "░" * (width - filled)
    marker = min(int(threshold / (threshold * 1.5) * width), width - 1)
    bar    = bar[:marker] + "|" + bar[marker+1:]
    return bar

def _draw(metro: Metronome, det: StepDetector,
          mode: str, demo: Optional[DemoWalker]) -> None:
    with _NOTIFY_LOCK:
        msgs = list(_PENDING);  _PENDING.clear()
    for m in msgs:
        print(f"\n  >> {m}")

    detected = det.bpm()
    playing  = metro.bpm
    gap      = det.gap()
    frozen   = metro.frozen
    status   = "** FREEZING **" if frozen else "Walking       "
    gap_s    = f"{gap:4.1f}s" if det.has_started() else "  -- "
    steps    = det.step_count
    ratio    = det.last_ratio
    sens     = det.sensitivity()
    bar      = _signal_bar(ratio, sens)

    mode_s = ""
    if mode == "demo" and demo:
        mode_s = f"  SimBPM:{demo.sim_bpm:3.0f}"

    beats = Metronome.beats_played
    line = (f"\r  {status}  |  Det:{detected:5.1f}  Play:{playing:5.1f}  "
            f"Steps:{steps:4d}  Beats:{beats:4d}  Gap:{gap_s}  "
            f"Sig:[{bar}]{ratio:4.1f}/{sens:.1f}{mode_s}  ")
    print(line, end="", flush=True)


def _input_thread(metro: Metronome, det: StepDetector,
                  mode: str, demo: Optional[DemoWalker]) -> None:
    """
    Live keyboard commands (type + Enter):
      1-4        change audio theme
      s          simulate one step (live/keyboard modes)
      +/-        raise/lower detection sensitivity
      b+  b-     raise/lower demo walking BPM (demo mode only)
    """
    while True:
        try:
            cmd = input().strip().lower()
        except EOFError:
            break

        if cmd in THEMES:
            name, _ = THEMES[cmd]
            _notify(f"Theme → {name}")
            metro.change_theme(cmd)

        elif cmd == "s":
            det.force_step()
            _notify("Manual step injected")

        elif cmd in ("+", "="):
            det.set_sensitivity(det.sensitivity() + 0.1)
            _notify(f"Sensitivity → {det.sensitivity():.2f}  (higher = needs bigger peak)")

        elif cmd == "-":
            det.set_sensitivity(det.sensitivity() - 0.1)
            _notify(f"Sensitivity → {det.sensitivity():.2f}  (lower = fires more easily)")

        elif cmd in ("b+", "b =") and mode == "demo" and demo:
            demo.set_bpm(demo.sim_bpm + 5)
            _notify(f"Sim BPM → {demo.sim_bpm:.0f}")

        elif cmd == "b-" and mode == "demo" and demo:
            demo.set_bpm(demo.sim_bpm - 5)
            _notify(f"Sim BPM → {demo.sim_bpm:.0f}")

        elif cmd == "f" and mode == "demo" and demo:
            _notify("Simulating FREEZE — pausing data for 3 s …")
            pause_t = threading.Thread(target=demo.pause, daemon=True)
            pause_t.start()

        elif cmd:
            print("\n  Commands: 1-4=theme  s=step  +/-=sensitivity  "
                  "b+/b-=sim BPM  f=sim freeze")


# ── Entry Point ────────────────────────────────────────────────────────────────

def _test_beep() -> bool:
    """Play a short 440 Hz tone. Returns True if audio is working."""
    try:
        dur = 0.25
        t   = np.linspace(0, dur, int(SAMPLE_RATE * dur), dtype=np.float32)
        env = _adsr(len(t), SAMPLE_RATE, 0.01, 0.05, 0.6, 0.10)
        mono   = np.sin(2 * np.pi * 440 * t) * env
        stereo = np.column_stack([mono * 0.8, mono * 0.8])
        arr    = (stereo * 32767).astype(np.int16)
        sound  = pygame.sndarray.make_sound(np.ascontiguousarray(arr))
        sound.play()
        time.sleep(0.35)   # let it finish before continuing
        return True
    except Exception as exc:
        print(f"  [Audio test] FAILED: {exc}")
        return False


def main() -> None:
    if sys.platform == "win32":
        os.system("")   # enable ANSI on Windows Terminal

    # Larger buffer (1024) avoids underruns on slow Windows audio drivers
    pygame.mixer.pre_init(SAMPLE_RATE, -16, 2, 1024)
    pygame.init()
    pygame.mixer.set_num_channels(16)

    freq, size, chans = pygame.mixer.get_init()
    print(f"  Audio init: {freq} Hz  {size}-bit  {chans}ch")
    print("  Playing test beep…", end=" ", flush=True)
    ok = _test_beep()
    print("OK" if ok else "SILENT — check your audio output device")

    print("=" * 66)
    print("   ParkiStep  —  Parkinson's Gait Rehabilitation Tool")
    print("=" * 66)

    # ── mode selection ────────────────────────────────────────────────────────
    print("\n  Input mode:")
    print("    [1]  Live      — receive UDP from phone (port 5555)")
    print("    [2]  Demo      — built-in walking simulation (no phone needed)")
    print("    [3]  Keyboard  — press 's' + Enter for each step\n")
    mode_choice = input("  Choose mode [1-3, default 2]: ").strip() or "2"
    if mode_choice not in ("1", "2", "3"):
        mode_choice = "2"
    MODE = {"1": "live", "2": "demo", "3": "keyboard"}[mode_choice]

    # ── theme selection ───────────────────────────────────────────────────────
    print("\n  Audio Themes:")
    for k, (name, _) in THEMES.items():
        print(f"    [{k}]  {name}")
    theme = input("\n  Choose theme [1-4, default 1]: ").strip() or "1"
    if theme not in THEMES:
        theme = "1"
    print(f"\n  Using: {THEMES[theme][0]}")

    print(f"\n  Freeze threshold : {FREEZE_THRESHOLD} s")
    print(f"  Step lead        : ×{STEP_LEAD:.2f}")
    print(f"  Rescue lead      : ×{RESCUE_LEAD:.2f}")
    print(f"  Detection sens   : {DEFAULT_SENS:.1f}  (type +/- to adjust live)")

    det   = StepDetector(sensitivity=DEFAULT_SENS)
    metro = Metronome(det, theme=theme)
    demo  = None

    # ── start input source ────────────────────────────────────────────────────
    if MODE == "live":
        udp_t = threading.Thread(target=udp_listener, args=(det,), daemon=True)
        udp_t.start()
        print(f"\n  Waiting for UDP packets on port {UDP_PORT} …")
        print("  Phone: enable Linear Acceleration → UDP stream → this PC's IP:5555\n")

    elif MODE == "demo":
        demo = DemoWalker(det, bpm=80.0)
        demo.start()
        print("\n  Demo mode active — simulating 80 BPM walk.")
        print("  Commands: b+/b- change sim BPM,  f = simulate a freeze\n")

    else:  # keyboard
        print("\n  Keyboard mode — type 's' + Enter to register each step.\n")

    # ── start UI input thread ─────────────────────────────────────────────────
    inp_t = threading.Thread(
        target=_input_thread, args=(metro, det, MODE, demo), daemon=True)
    inp_t.start()

    metro.start()

    print("  Commands at any time:  1-4 theme  |  s step  |  +/- sensitivity")
    print("  Ctrl+C to quit\n")
    print("  " + "─" * 64)

    try:
        while True:
            _draw(metro, det, MODE, demo)
            time.sleep(0.15)
    except KeyboardInterrupt:
        print("\n\n  Stopping — goodbye.\n")
        metro.stop()
        if demo:
            demo.stop()
        pygame.mixer.quit()


if __name__ == "__main__":
    main()
