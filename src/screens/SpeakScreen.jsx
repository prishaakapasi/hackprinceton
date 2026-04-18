import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { transcribe, suggest } from "../api";
import "../styles/circles.css";
import "./SpeakScreen.css";

const NAV = [
  { label: "Talk",  icon: "/icons/nav-talk.png",  path: "/"        },
  { label: "Speak", icon: "/icons/nav-speak.png", path: "/speak"   },
  { label: "Walk",  icon: "/icons/nav-walk.png",  path: "/walk"    },
  { label: "Voice", icon: "/icons/nav-voice.png", path: "/banking" },
];

const NUM_BARS  = 48;
const BAR_GAP   = 0.35; // fraction of slot that is gap

export default function SpeakScreen() {
  const navigate = useNavigate();

  const [status, setStatus]           = useState("idle"); // idle | recording | processing | done | error
  const [transcript, setTranscript]   = useState("");
  const [chips, setChips]             = useState([]);
  const [errorMsg, setErrorMsg]       = useState("");

  // Refs — none of these trigger re-renders
  const canvasRef       = useRef(null);
  const streamRef       = useRef(null);
  const recorderRef     = useRef(null);
  const chunksRef       = useRef([]);
  const audioCtxRef     = useRef(null);
  const analyserRef     = useRef(null);
  const sourceRef       = useRef(null);
  const rafRef          = useRef(null);

  // ── Waveform drawing ────────────────────────────────────────────
  const drawWaveform = useCallback(() => {
    const canvas   = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;

    const ctx = canvas.getContext("2d");
    const W   = canvas.width;
    const H   = canvas.height;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);

    ctx.clearRect(0, 0, W, H);

    const slotW  = W / NUM_BARS;
    const barW   = slotW * (1 - BAR_GAP);
    const cx     = H / 2;

    for (let i = 0; i < NUM_BARS; i++) {
      // Map bar index to a spread across the lower frequency range
      const dataIdx  = Math.floor((i / NUM_BARS) * (data.length * 0.6));
      const amp      = data[dataIdx] / 255;
      const halfH    = Math.max(3, amp * cx * 0.92);
      const x        = i * slotW + (slotW - barW) / 2;
      const alpha    = 0.35 + amp * 0.65;

      ctx.fillStyle = `rgba(178, 240, 232, ${alpha})`;
      // Draw bar mirrored up and down from center
      ctx.beginPath();
      ctx.roundRect(x, cx - halfH, barW, halfH * 2, barW / 2);
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(drawWaveform);
  }, []);

  const startWaveform = useCallback((stream) => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 128;
    analyser.smoothingTimeConstant = 0.8;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    audioCtxRef.current  = ctx;
    analyserRef.current  = analyser;
    sourceRef.current    = source;

    rafRef.current = requestAnimationFrame(drawWaveform);
  }, [drawWaveform]);

  const stopWaveform = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    sourceRef.current?.disconnect();
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    sourceRef.current   = null;

    // Clear canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  // Resize canvas to match display size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // ── Recording ───────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setErrorMsg("");
    setTranscript("");
    setChips([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current  = stream;
      chunksRef.current  = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stopWaveform();
        stream.getTracks().forEach(t => t.stop());

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setStatus("processing");

        try {
          const { transcript: text } = await transcribe(blob);
          setTranscript(text);
          setStatus("done");

          // Speak the transcript back
          if (text && "speechSynthesis" in window) {
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 0.9;
            window.speechSynthesis.speak(u);
          }

          // Fetch suggestions
          try {
            const { suggestions } = await suggest(text);
            setChips(suggestions.slice(0, 5));
          } catch (_) {
            // Suggestions are non-critical — fail silently
          }
        } catch (err) {
          setErrorMsg("Could not transcribe. Please try again.");
          setStatus("error");
        }
      };

      recorder.start();
      startWaveform(stream);
      setStatus("recording");
    } catch (err) {
      setErrorMsg("Microphone access denied.");
      setStatus("error");
    }
  }, [startWaveform, stopWaveform]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopWaveform();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [stopWaveform]);

  const speakChip = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  const isRecording  = status === "recording";
  const isProcessing = status === "processing";

  return (
    <div className="speak-screen">

      {/* Background circles */}
      <div className="circle circle-a" />
      <div className="circle circle-b" />
      <div className="circle circle-c" />
      <div className="circle circle-d" />

      {/* Header */}
      <div className="speak-header">
        <div className="logo">synova</div>
        <div className="speak-title">Speak</div>
      </div>

      {/* Waveform canvas */}
      <div className={`waveform-wrap ${isRecording ? "waveform-wrap--active" : ""}`}>
        <canvas ref={canvasRef} className="waveform-canvas" />
        {!isRecording && (
          <div className="waveform-placeholder">
            {isProcessing ? "Processing…" : "Hold the mic to speak"}
          </div>
        )}
      </div>

      {/* Transcript */}
      <div className="transcript-box">
        {errorMsg ? (
          <span className="transcript-error">{errorMsg}</span>
        ) : (
          <span className={transcript ? "transcript-text" : "transcript-empty"}>
            {transcript || (isProcessing ? "Transcribing…" : "Your words will appear here")}
          </span>
        )}
      </div>

      {/* Suggestion chips */}
      {chips.length > 0 && (
        <div className="chips-wrap">
          {chips.map((chip) => (
            <button key={chip} className="chip" onClick={() => speakChip(chip)}>
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Mic button */}
      <div className="mic-area">
        <button
          className={`mic-btn ${isRecording ? "mic-btn--recording" : ""} ${isProcessing ? "mic-btn--processing" : ""}`}
          onPointerDown={startRecording}
          onPointerUp={stopRecording}
          onPointerLeave={stopRecording}
          onPointerCancel={stopRecording}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <svg className="mic-spinner" width="36" height="36" viewBox="0 0 36 36" fill="none">
              <circle cx="18" cy="18" r="14" stroke="rgba(178,240,232,0.2)" strokeWidth="3"/>
              <path d="M18 4 A14 14 0 0 1 32 18" stroke="#b2f0e8" strokeWidth="3" strokeLinecap="round"/>
            </svg>
          ) : (
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
              <rect x="9" y="2" width="6" height="12" rx="3" fill="#b2f0e8"/>
              <path d="M5 10a7 7 0 0 0 14 0" stroke="#b2f0e8" strokeWidth="2" strokeLinecap="round"/>
              <line x1="12" y1="19" x2="12" y2="22" stroke="#b2f0e8" strokeWidth="2" strokeLinecap="round"/>
              <line x1="9"  y1="22" x2="15" y2="22" stroke="#b2f0e8" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          )}
        </button>
        <div className="mic-hint">
          {isRecording ? "Release to send" : isProcessing ? "Processing…" : "Hold to record"}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="bottom-nav">
        {NAV.map(({ label, icon, path }) => {
          const active = window.location.pathname === path;
          return (
            <button
              key={label}
              onClick={() => navigate(path)}
              className={`nav-btn ${active ? "nav-btn--active" : "nav-btn--inactive"}`}
            >
              <img src={icon} alt={label} className="nav-icon" />
              <span className="nav-label">{label}</span>
              {active && <div className="nav-dot" />}
            </button>
          );
        })}
      </div>

    </div>
  );
}
