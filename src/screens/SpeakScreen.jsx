import { useState, useRef, useEffect, useCallback } from "react";
import { usePatient } from "../context/PatientContext";
import { transcribe, suggest, savePhrase } from "../api";
import NavBar from "../components/NavBar";
import "../styles/circles.css";
import "./SpeakScreen.css";

const NUM_BARS = 48;
const BAR_GAP  = 0.35;

export default function SpeakScreen() {
  const { phrases } = usePatient();
  const [tab, setTab] = useState("speak"); // "speak" | "bank"

  // ── Speak tab state ──────────────────────────────────────────────
  const [status,     setStatus]     = useState("idle");
  const [transcript, setTranscript] = useState("");
  const [chips,      setChips]      = useState([]);
  const [speakError, setSpeakError] = useState("");

  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef   = useRef(null);
  const rafRef      = useRef(null);

  // ── Bank tab state ───────────────────────────────────────────────
  const [recordingFor, setRecordingFor] = useState(null);
  const [savingFor,    setSavingFor]    = useState(null);
  const [savedFor,     setSavedFor]     = useState({});
  const [playingFor,   setPlayingFor]   = useState(null);
  const [bankError,    setBankError]    = useState("");

  const bankRecorderRef = useRef(null);
  const bankChunksRef   = useRef([]);
  const audioRef        = useRef(null);

  // ── Waveform ─────────────────────────────────────────────────────
  const drawWaveform = useCallback(() => {
    const canvas   = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx  = canvas.getContext("2d");
    const W    = canvas.width;
    const H    = canvas.height;
    const data = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(data);
    ctx.clearRect(0, 0, W, H);
    const slotW = W / NUM_BARS;
    const barW  = slotW * (1 - BAR_GAP);
    const cx    = H / 2;
    const accentRgb = getComputedStyle(document.documentElement).getPropertyValue("--accent-rgb").trim() || "126, 240, 220";
    for (let i = 0; i < NUM_BARS; i++) {
      const dataIdx = Math.floor((i / NUM_BARS) * (data.length * 0.6));
      const amp     = data[dataIdx] / 255;
      const halfH   = Math.max(3, amp * cx * 0.92);
      const x       = i * slotW + (slotW - barW) / 2;
      ctx.fillStyle = `rgba(${accentRgb}, ${0.35 + amp * 0.65})`;
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
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current   = source;
    rafRef.current = requestAnimationFrame(drawWaveform);
  }, [drawWaveform]);

  const stopWaveform = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    sourceRef.current?.disconnect();
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    sourceRef.current   = null;
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  }, []);

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

  useEffect(() => {
    return () => {
      stopWaveform();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [stopWaveform]);

  // ── Speak actions ─────────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setSpeakError("");
    setTranscript("");
    setChips([]);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stopWaveform();
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setStatus("processing");
        try {
          const { transcript: text } = await transcribe(blob);
          setTranscript(text);
          setStatus("done");
          if (text && "speechSynthesis" in window) {
            const u = new SpeechSynthesisUtterance(text);
            u.rate = 0.9;
            window.speechSynthesis.speak(u);
          }
          try {
            const { suggestions } = await suggest(text);
            setChips(suggestions.slice(0, 5));
          } catch (_) {}
        } catch {
          setSpeakError("Could not transcribe. Please try again.");
          setStatus("error");
        }
      };
      recorder.start();
      startWaveform(stream);
      setStatus("recording");
    } catch {
      setSpeakError("Microphone access denied.");
      setStatus("error");
    }
  }, [startWaveform, stopWaveform]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
  }, []);

  const speakChip = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  // ── Bank actions ──────────────────────────────────────────────────
  const startBankRecording = useCallback(async (phrase) => {
    setBankError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      bankChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      bankRecorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) bankChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob    = new Blob(bankChunksRef.current, { type: "audio/webm" });
        const blobURL = URL.createObjectURL(blob);
        setSavingFor(phrase);
        try {
          await savePhrase(phrase, blob);
          setSavedFor(prev => ({ ...prev, [phrase]: blobURL }));
        } catch {
          setBankError(`Could not save "${phrase}". Try again.`);
        } finally {
          setSavingFor(null);
        }
      };
      recorder.start();
      setRecordingFor(phrase);
    } catch {
      setBankError("Microphone access denied.");
    }
  }, []);

  const stopBankRecording = useCallback(() => {
    if (bankRecorderRef.current?.state === "recording") bankRecorderRef.current.stop();
    setRecordingFor(null);
  }, []);

  const handlePlay = useCallback((phrase) => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (playingFor === phrase) { setPlayingFor(null); return; }
    const blobURL = savedFor[phrase];
    if (blobURL) {
      const audio = new Audio(blobURL);
      audioRef.current = audio;
      audio.onended = () => setPlayingFor(null);
      audio.play();
      setPlayingFor(phrase);
    } else {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(phrase);
        u.rate = 0.9;
        u.onend = () => setPlayingFor(null);
        window.speechSynthesis.speak(u);
        setPlayingFor(phrase);
      }
    }
  }, [savedFor, playingFor]);

  const isRecording  = status === "recording";
  const isProcessing = status === "processing";

  return (
    <div className="speak-screen">

      <div className="circle circle-a" />
      <div className="circle circle-b" />
      <div className="circle circle-c" />
      <div className="circle circle-d" />

      {/* Header */}
      <div className="speak-header">
        <div className="logo">synova</div>

        {/* Tab toggle */}
        <div className="speak-tab-toggle">
          <button
            className={`speak-tab-btn ${tab === "speak" ? "speak-tab-btn--active" : ""}`}
            onClick={() => setTab("speak")}
          >
            Speak
          </button>
          <button
            className={`speak-tab-btn ${tab === "bank" ? "speak-tab-btn--active" : ""}`}
            onClick={() => setTab("bank")}
          >
            Voice Bank
          </button>
        </div>
      </div>

      {/* ── SPEAK TAB ─────────────────────────────────────────────── */}
      {tab === "speak" && (
        <>
          <div className={`waveform-wrap ${isRecording ? "waveform-wrap--active" : ""}`}>
            <canvas ref={canvasRef} className="waveform-canvas" />
            {!isRecording && (
              <div className="waveform-placeholder">
                {isProcessing ? "Processing…" : "Hold the mic to speak"}
              </div>
            )}
          </div>

          <div className="transcript-box">
            {speakError ? (
              <span className="transcript-error">{speakError}</span>
            ) : (
              <span className={transcript ? "transcript-text" : "transcript-empty"}>
                {transcript || (isProcessing ? "Transcribing…" : "Your words will appear here")}
              </span>
            )}
          </div>

          {chips.length > 0 && (
            <div className="chips-wrap">
              {chips.map((chip) => (
                <button key={chip} className="chip" onClick={() => speakChip(chip)}>
                  {chip}
                </button>
              ))}
            </div>
          )}

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
                  <circle cx="18" cy="18" r="14" stroke="rgba(var(--accent-rgb),0.2)" strokeWidth="3"/>
                  <path d="M18 4 A14 14 0 0 1 32 18" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                  <rect x="9" y="2" width="6" height="12" rx="3" fill="var(--accent)"/>
                  <path d="M5 10a7 7 0 0 0 14 0" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="12" y1="19" x2="12" y2="22" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
                  <line x1="9"  y1="22" x2="15" y2="22" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
            </button>
            <div className="mic-hint">
              {isRecording ? "Release to send" : isProcessing ? "Processing…" : "Hold to record"}
            </div>
          </div>
        </>
      )}

      {/* ── VOICE BANK TAB ────────────────────────────────────────── */}
      {tab === "bank" && (
        <>
          <div className="bank-subtitle">
            Record your voice for each phrase — it will be used to speak for you.
          </div>

          {bankError && (
            <div className="bank-error" onClick={() => setBankError("")}>
              {bankError} <span>✕</span>
            </div>
          )}

          <div className="bank-phrase-list">
            {/* Add voice memo */}
            <button className="bank-add-btn" onClick={() => setTab("speak")}>
              <span className="bank-add-icon">+</span>
              <span>Add a voice memo</span>
            </button>

            {phrases.map((phrase) => {
              const isRec    = recordingFor === phrase;
              const isSaving = savingFor    === phrase;
              const isPlay   = playingFor   === phrase;
              const isSaved  = !!savedFor[phrase];

              return (
                <div key={phrase} className={`bank-card ${isSaved ? "bank-card--saved" : ""}`}>
                  <div className="bank-card-header">
                    <span className="bank-card-text">{phrase}</span>
                    {isSaved && <span className="bank-saved-badge">✓ Recorded</span>}
                  </div>
                  <div className="bank-card-actions">
                    <button
                      className={`bank-action-btn bank-action-btn--play ${isPlay ? "bank-action-btn--active" : ""}`}
                      onClick={() => handlePlay(phrase)}
                      disabled={isSaving}
                    >
                      {isPlay ? (
                        <><svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)"><rect x="5" y="4" width="5" height="16" rx="1.5"/><rect x="14" y="4" width="5" height="16" rx="1.5"/></svg><span>Stop</span></>
                      ) : (
                        <><svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)"><path d="M5 3l14 9-14 9V3Z"/></svg><span>{isSaved ? "Play" : "Preview"}</span></>
                      )}
                    </button>
                    <button
                      className={`bank-action-btn bank-action-btn--record ${isRec ? "bank-action-btn--recording" : ""} ${isSaving ? "bank-action-btn--saving" : ""}`}
                      onPointerDown={() => !isSaving && !isPlay && startBankRecording(phrase)}
                      onPointerUp={stopBankRecording}
                      onPointerLeave={stopBankRecording}
                      onPointerCancel={stopBankRecording}
                      disabled={isSaving || isPlay}
                    >
                      {isSaving ? (
                        <><svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="saving-spin"><circle cx="12" cy="12" r="9" stroke="rgba(var(--accent-rgb),0.2)" strokeWidth="2.5"/><path d="M12 3A9 9 0 0 1 21 12" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/></svg><span>Saving…</span></>
                      ) : (
                        <><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="8" y="2" width="8" height="13" rx="4" fill={isRec ? "#ff6b6b" : "var(--accent)"}/><path d="M5 11a7 7 0 0 0 14 0" stroke={isRec ? "#ff6b6b" : "var(--accent)"} strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="18" x2="12" y2="21" stroke={isRec ? "#ff6b6b" : "var(--accent)"} strokeWidth="2" strokeLinecap="round"/></svg><span>{isRec ? "Recording…" : isSaved ? "Re-record" : "Hold to Record"}</span></>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <NavBar />

    </div>
  );
}
