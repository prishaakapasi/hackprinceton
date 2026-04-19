import { useEffect, useRef, useState } from "react";
import "./EeshaWalkComponent.css";

// ── Constants ─────────────────────────────────────────────────────────────────
const SENSITIVITY      = 2.0;   // slightly tighter than index.html's 1.8
const STEP_LEAD        = 1.10;
const FREEZE_THRESHOLD = 2500;
const FAST_WIN_SIZE    = 5;
const SLOW_WIN_MIN     = 10;    // stable baseline before first detection (~1 s)
const SLOW_WIN_MAX     = 30;
const MIN_STEP_MS      = 400;   // same as index.html (350) + small margin
const BPM_HISTORY      = 5;

// ── RAS-validated sound synthesis ────────────────────────────────────────────
//
// Rhythmic Auditory Stimulation (Thaut et al. 1996, 2019) requires:
//   1. Sharp attack (< 10 ms)  – for precise neural entrainment onset
//   2. Clear frequency range   – 300–1500 Hz (audible with age-related hearing loss)
//   3. L/R alternation         – reinforces gait symmetry (Hausdorff et al.)
//   4. 10% tempo lead          – shown to increase stride length and velocity
//
// "Tick"   – wooden metronome click, closest to original RAS research
// "Marimba"– warm mallet tone, used in music-therapy RAS trials
// "Groove" – kick + hi-hat, bass-frequency entrainment, best for headphone use
// "Piano"  – short piano-like tone, pleasant for long sessions

// Shared: build an output gain + stereo panner, return {out, pnr, connect}
function makeChain(ctx, pan) {
  const out = ctx.createGain();
  const pnr = ctx.createStereoPanner();
  pnr.pan.value = pan;
  out.connect(pnr);
  pnr.connect(ctx.destination);
  return out;
}

// ── Tick (wooden metronome) ───────────────────────────────────────────────────
// Bandpass noise burst + short sine — ~50 ms, very sharp attack
// Most closely matches original Thaut RAS metronome studies
function playTick(ctx, pan, isLeft) {
  const now  = ctx.currentTime;
  const out  = makeChain(ctx, pan);
  const freq = isLeft ? 900 : 1100;   // two pitches aid L/R distinction

  // Tonal component
  const osc  = ctx.createOscillator();
  const ogain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  ogain.gain.setValueAtTime(0, now);
  ogain.gain.linearRampToValueAtTime(0.55, now + 0.003); // 3 ms attack
  ogain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
  osc.connect(ogain); ogain.connect(out);
  osc.start(now); osc.stop(now + 0.07);

  // Noise transient for click "body"
  const sr  = ctx.sampleRate;
  const len = Math.round(sr * 0.04);
  const buf = ctx.createBuffer(1, len, sr);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.1));
  const src  = ctx.createBufferSource();
  const bp   = ctx.createBiquadFilter();
  const ngain = ctx.createGain();
  src.buffer = buf;
  bp.type = "bandpass"; bp.frequency.value = freq; bp.Q.value = 2;
  ngain.gain.setValueAtTime(0.5, now);
  ngain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
  src.connect(bp); bp.connect(ngain); ngain.connect(out);
  src.start(now);

  out.gain.value = 1;
}

// ── Marimba ───────────────────────────────────────────────────────────────────
// Fundamental + inharmonic 4th partial. Used in music-therapy RAS (Spiro 2010).
// L step = C5 (523 Hz), R step = G5 (784 Hz) — a perfect fifth, always consonant.
function playMarimba(ctx, pan, isLeft) {
  const now  = ctx.currentTime;
  const out  = makeChain(ctx, pan);
  const freq = isLeft ? 523.25 : 784.0;

  out.gain.setValueAtTime(0, now);
  out.gain.linearRampToValueAtTime(0.75, now + 0.004);
  out.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  [[1, 1.0], [4.07, 0.22]].forEach(([r, a]) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = "sine"; osc.frequency.value = freq * r; g.gain.value = a;
    osc.connect(g); g.connect(out);
    osc.start(now); osc.stop(now + 0.5);
  });
}

// ── Groove (kick + hi-hat) ────────────────────────────────────────────────────
// Bass frequencies 40–120 Hz penetrate background noise and are felt as well as heard.
// Particularly effective for patients with high-frequency hearing loss (Ghai et al. 2018).
function playGroove(ctx, pan, isLeft) {
  const now = ctx.currentTime;
  const pnr = ctx.createStereoPanner();
  pnr.pan.value = pan;
  pnr.connect(ctx.destination);

  if (isLeft) {
    // Kick: pitched sine sweep 110→45 Hz
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.1);
    gain.gain.setValueAtTime(0.9, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc.connect(gain); gain.connect(pnr);
    osc.start(now); osc.stop(now + 0.25);
  } else {
    // Hi-hat: bandpass noise burst
    const sr  = ctx.sampleRate;
    const len = Math.round(sr * 0.07);
    const buf = ctx.createBuffer(1, len, sr);
    const d   = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src  = ctx.createBufferSource();
    const bp   = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    src.buffer = buf;
    bp.type = "bandpass"; bp.frequency.value = 9000; bp.Q.value = 1.5;
    gain.gain.setValueAtTime(0.65, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    src.connect(bp); bp.connect(gain); gain.connect(pnr);
    src.start(now);
  }
}

// ── Piano ─────────────────────────────────────────────────────────────────────
// Short piano-like tone using harmonic series + fast decay.
// L step = E4 (330 Hz), R step = B4 (494 Hz) — a perfect fifth, warm interval.
// Gentle enough for long sessions, sharp enough for neural synchronisation.
function playPiano(ctx, pan, isLeft) {
  const now  = ctx.currentTime;
  const out  = makeChain(ctx, pan);
  const freq = isLeft ? 329.63 : 493.88;

  out.gain.setValueAtTime(0, now);
  out.gain.linearRampToValueAtTime(0.7, now + 0.005);
  out.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

  // Harmonic series approximating a piano string
  [[1, 1.0], [2, 0.5], [3, 0.25], [4, 0.12], [5, 0.06]].forEach(([r, a]) => {
    const osc = ctx.createOscillator();
    const g   = ctx.createGain();
    osc.type = "sine"; osc.frequency.value = freq * r; g.gain.value = a;
    osc.connect(g); g.connect(out);
    osc.start(now); osc.stop(now + 0.6);
  });
}

// ── Rescue (freeze alert) ─────────────────────────────────────────────────────
// Two urgent chirps — distinct enough to capture attention mid-freeze.
function playRescue(ctx) {
  const now = ctx.currentTime;
  [0, 0.13].forEach(offset => {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square"; osc.frequency.value = 1400;
    gain.gain.setValueAtTime(0, now + offset);
    gain.gain.linearRampToValueAtTime(0.8, now + offset + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(now + offset); osc.stop(now + offset + 0.09);
  });
}

const PLAY_FN = { tick: playTick, marimba: playMarimba, groove: playGroove, piano: playPiano };


// ── Component ─────────────────────────────────────────────────────────────────

export default function EeshaWalkComponent({ audioCtx, soundType, onStop }) {
  const [bpm,      setBpm]      = useState("--");
  const [isFrozen, setIsFrozen] = useState(false);
  const [steps,    setSteps]    = useState(0);

  const st = useRef({
    lastStepTime: 0,
    currentBPM:   80,
    stepHistory:  [],
    fastWin:      [],
    slowWin:      [],
    side:         0,
    isRunning:    false,
  });

  const motionRef = useRef(null);

  useEffect(() => {
    const s = st.current;
    s.isRunning = true;

    const init = async () => {
      if (typeof DeviceMotionEvent?.requestPermission === "function") {
        const res = await DeviceMotionEvent.requestPermission();
        if (res !== "granted") { onStop(); return; }
      }
      motionRef.current = handleMotion;
      window.addEventListener("devicemotion", motionRef.current);
      scheduleNextBeat();
    };

    init();
    return () => {
      s.isRunning = false;
      if (motionRef.current) {
        window.removeEventListener("devicemotion", motionRef.current);
        motionRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Step detection ────────────────────────────────────────────────────────
  function handleMotion(ev) {
    const acc = ev.acceleration;
    if (!acc) return;

    const mag = Math.sqrt((acc.x ?? 0) ** 2 + (acc.y ?? 0) ** 2 + (acc.z ?? 0) ** 2);
    const s   = st.current;

    s.fastWin.push(mag); if (s.fastWin.length > FAST_WIN_SIZE) s.fastWin.shift();
    s.slowWin.push(mag); if (s.slowWin.length > SLOW_WIN_MAX)  s.slowWin.shift();
    if (s.slowWin.length < SLOW_WIN_MIN) return;

    const fastAvg = s.fastWin.reduce((a, b) => a + b) / s.fastWin.length;
    const slowAvg = s.slowWin.reduce((a, b) => a + b) / s.slowWin.length;
    const ratio   = fastAvg / (slowAvg + 0.001);

    const now = Date.now();
    if (ratio > SENSITIVITY && now - s.lastStepTime > MIN_STEP_MS) {
      s.stepHistory.push(now);
      if (s.stepHistory.length > BPM_HISTORY + 1) s.stepHistory.shift();

      if (s.stepHistory.length >= 2) {
        const intervals = [];
        for (let i = 1; i < s.stepHistory.length; i++)
          intervals.push(s.stepHistory[i] - s.stepHistory[i - 1]);
        const avg    = intervals.reduce((a, b) => a + b) / intervals.length;
        const rawBPM = Math.min(Math.max(60000 / avg, 40), 160);
        s.currentBPM = rawBPM * STEP_LEAD;
        setBpm(Math.round(rawBPM));
      }

      s.lastStepTime = now;
      setSteps(n => n + 1);
    }
  }

  // ── Metronome ─────────────────────────────────────────────────────────────
  function scheduleNextBeat() {
    if (!st.current.isRunning) return;

    const s             = st.current;
    const now           = Date.now();
    const timeSinceLast = now - s.lastStepTime;
    let nextInterval;

    if (s.lastStepTime > 0 && timeSinceLast > FREEZE_THRESHOLD) {
      // ── FROZEN ──────────────────────────────────────────────────────────
      setIsFrozen(true);
      if (audioCtx) playRescue(audioCtx);
      nextInterval = 400;
    } else {
      // ── WALKING ─────────────────────────────────────────────────────────
      setIsFrozen(false);
      const isLeft = s.side === 0;
      if (audioCtx) (PLAY_FN[soundType] ?? playTick)(audioCtx, isLeft ? -0.6 : 0.6, isLeft);
      s.side       = 1 - s.side;
      nextInterval = 60000 / Math.min(Math.max(s.currentBPM, 40), 160);
    }

    setTimeout(scheduleNextBeat, nextInterval);
  }

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className={`eesha-walk ${isFrozen ? "eesha-frozen" : ""}`}>

      <div className="eesha-status">
        {isFrozen ? "FREEZE DETECTED" : "WALKING"}
      </div>

      <div className="eesha-bpm-display">
        <span className="eesha-bpm-number">{bpm}</span>
        <span className="eesha-bpm-unit">BPM</span>
      </div>

      <div className="eesha-stat-row">
        <div className="eesha-stat">
          <span className="eesha-stat-value">{steps}</span>
          <span className="eesha-stat-label">Steps</span>
        </div>
        <div className="eesha-stat-divider" />
        <div className="eesha-stat">
          <span className="eesha-stat-value">
            {bpm === "--" ? "--" : Math.round(Number(bpm) * STEP_LEAD)}
          </span>
          <span className="eesha-stat-label">Playing</span>
        </div>
      </div>

      <button className="eesha-stop-btn" onClick={onStop}>
        STOP
      </button>
    </div>
  );
}
