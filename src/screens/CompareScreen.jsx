import { useState, useRef } from "react";
import NavBar from "../components/NavBar";
import { usePatient } from "../context/PatientContext";
import "../styles/circles.css";
import "./SpeakScreen.css";

const BASE_URL = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

// Real transcript for the TORGO F01_Session1_0002.wav demo clip (TIMIT SA1)
const TORGO_TRANSCRIPT = "She had your dark suit in greasy wash water all year.";

export default function CompareScreen() {
  const { phrases } = usePatient();
  const [mode, setMode]         = useState("demo"); // "demo" | "live"
  const [status, setStatus]     = useState("idle");
  const [standard, setStandard] = useState("");
  const [improved, setImproved] = useState("");
  const [error, setError]       = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying]     = useState(false);

  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const audioRef    = useRef(null);

  const reset = () => {
    setStatus("idle");
    setStandard("");
    setImproved("");
    setError("");
    setIsRecording(false);
  };

  // ── Demo mode: run TORGO clip through /compare ──────────────────
  const runDemoCompare = async () => {
    setStatus("loading");
    setStandard("");
    setImproved("");
    setError("");
    try {
      const audioRes = await fetch("/torgo_demo.wav");
      if (!audioRes.ok) throw new Error("Demo clip not found — check public/torgo_demo.wav");
      const audioBlob = await audioRes.blob();
      const form = new FormData();
      form.append("file", audioBlob, "torgo_demo.wav");
      form.append("expected_text", TORGO_TRANSCRIPT);
      const res = await fetch(`${BASE_URL}/compare`, { method: "POST", body: form });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = await res.json();
      setStandard(data.standard);
      setImproved(data.improved);
      setStatus("done");
    } catch (e) {
      setError(e.message || "Could not run comparison. Is the backend running?");
      setStatus("error");
    }
  };

  const playDemoClip = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setIsPlaying(false);
      return;
    }
    const audio = new Audio("/torgo_demo.wav");
    audioRef.current = audio;
    audio.onended = () => { setIsPlaying(false); audioRef.current = null; };
    audio.play();
    setIsPlaying(true);
  };

  // ── Live mode: transcribe → suggest best saved phrase ──────────
  const startRecording = async () => {
    setError("");
    setStandard("");
    setImproved("");
    setStatus("idle");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setStatus("loading");
        try {
          const form = new FormData();
          form.append("file", blob, "recording.webm");
          const transcribeRes = await fetch(`${BASE_URL}/transcribe`, { method: "POST", body: form });
          if (!transcribeRes.ok) throw new Error("Transcription failed");
          const { transcript: badTranscript } = await transcribeRes.json();
          setStandard(badTranscript || "(silence)");

          const allPhrases = phrases?.length > 0 ? phrases : [
            "I need water", "I need help", "I am okay", "Please wait", "Call my daughter",
          ];
          const suggestRes = await fetch(`${BASE_URL}/suggest`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transcript: badTranscript, partial: badTranscript, phrases: allPhrases }),
          });
          const { suggestions } = await suggestRes.json();
          setImproved(suggestions?.[0] || badTranscript);
          setStatus("done");
        } catch {
          setError("Could not run comparison. Is the backend running?");
          setStatus("error");
        }
      };
      recorder.start();
      setIsRecording(true);
    } catch {
      setError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    setIsRecording(false);
  };

  const isLoading = status === "loading";

  return (
    <div className="speak-screen">
      <div className="circle circle-a" />
      <div className="circle circle-b" />
      <div className="circle circle-c" />
      <div className="circle circle-d" />

      <div className="speak-header">
        <div className="logo">synova</div>
      </div>

      <div style={{ padding: "0 24px", marginTop: "12px", overflowY: "auto", paddingBottom: "88px" }}>
        <div style={{ color: "var(--accent)", fontSize: "11px", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "6px" }}>
          AI Comparison
        </div>
        <div style={{ color: "rgba(255,255,255,0.55)", fontSize: "14px", marginBottom: "20px" }}>
          Same audio. Two results. This is why Synova exists.
        </div>

        {/* Mode toggle */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
          {[
            { key: "demo", label: "Dysarthric Voice" },
            { key: "live", label: "Live Mic" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setMode(key); reset(); }}
              style={{
                flex: 1, padding: "10px 0", borderRadius: "12px",
                border: mode === key ? "2px solid var(--accent)" : "1.5px solid rgba(255,255,255,0.18)",
                background: mode === key ? "rgba(126,240,220,0.1)" : "transparent",
                color: mode === key ? "var(--accent)" : "rgba(255,255,255,0.55)",
                fontSize: "13px", fontWeight: "600", cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Demo mode controls */}
        {mode === "demo" && (
          <>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", marginBottom: "16px" }}>
              Real recording from a dysarthric speaker — TORGO dataset (F01, Session 1)
            </div>
            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <button
                onClick={playDemoClip}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: "14px",
                  border: "1.5px solid rgba(126,240,220,0.4)", background: "transparent",
                  color: "var(--accent)", fontSize: "14px", fontWeight: "600", cursor: "pointer",
                }}
              >
                {isPlaying ? "⏹ Stop" : "▶ Play Clip"}
              </button>
              <button
                onClick={runDemoCompare}
                disabled={isLoading}
                style={{
                  flex: 2, padding: "14px 0", borderRadius: "14px", border: "none",
                  background: "var(--accent)", color: "#0a1628", fontSize: "14px", fontWeight: "700",
                  cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.7 : 1,
                }}
              >
                {isLoading ? "Processing…" : "Run Comparison"}
              </button>
            </div>
          </>
        )}

        {/* Live mic controls */}
        {mode === "live" && (
          <>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px", marginBottom: "16px" }}>
              Speak a phrase — Synova matches it to your saved phrases
            </div>
            <button
              onPointerDown={startRecording}
              onPointerUp={stopRecording}
              onPointerLeave={stopRecording}
              disabled={isLoading}
              style={{
                width: "100%", padding: "16px", borderRadius: "16px", border: "none",
                background: isRecording ? "#ff6b6b" : "var(--accent)", color: "#0a1628",
                fontSize: "15px", fontWeight: "700", cursor: isLoading ? "not-allowed" : "pointer",
                marginBottom: "20px", opacity: isLoading ? 0.7 : 1, transition: "background 0.2s",
              }}
            >
              {isLoading ? "Processing…" : isRecording ? "🔴 Release to compare" : "🎤 Hold to Record"}
            </button>
          </>
        )}

        {error && (
          <div style={{
            color: "#ff6b6b", fontSize: "13px", marginBottom: "16px",
            padding: "12px", borderRadius: "10px", background: "rgba(255,107,107,0.1)",
          }}>
            {error}
          </div>
        )}

        {status === "done" && (
          <div style={{ display: "flex", gap: "12px" }}>
            <div style={{
              flex: 1, padding: "18px", borderRadius: "16px",
              background: "rgba(255,100,100,0.1)", border: "1.5px solid rgba(255,100,100,0.4)",
            }}>
              <div style={{ color: "#ff6b6b", fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>
                ✗ Standard Whisper
              </div>
              <div style={{ color: "rgba(255,255,255,0.85)", fontSize: "16px", fontWeight: "500", fontStyle: "italic", lineHeight: 1.5 }}>
                "{standard || "…"}"
              </div>
            </div>

            <div style={{
              flex: 1, padding: "18px", borderRadius: "16px",
              background: "rgba(100,255,180,0.1)", border: "1.5px solid rgba(100,255,180,0.4)",
            }}>
              <div style={{ color: "#64ffb4", fontSize: "10px", fontWeight: "700", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "10px" }}>
                ✓ Synova
              </div>
              <div style={{ color: "rgba(255,255,255,0.95)", fontSize: "16px", fontWeight: "600", lineHeight: 1.5 }}>
                "{improved || "…"}"
              </div>
            </div>
          </div>
        )}
      </div>

      <NavBar />
    </div>
  );
}
