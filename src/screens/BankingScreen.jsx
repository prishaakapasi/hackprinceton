import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { usePatient } from "../context/PatientContext";
import { savePhrase } from "../api";
import "../styles/circles.css";
import "./BankingScreen.css";

const NAV = [
  { label: "Talk",  icon: "/icons/nav-talk.png",  path: "/"        },
  { label: "Speak", icon: "/icons/nav-speak.png", path: "/speak"   },
  { label: "Walk",  icon: "/icons/nav-walk.png",  path: "/walk"    },
  { label: "Voice", icon: "/icons/nav-voice.png", path: "/banking" },
];

export default function BankingScreen() {
  const navigate = useNavigate();
  const { phrases } = usePatient();

  // recordingFor = phrase text currently being recorded, null if idle
  const [recordingFor, setRecordingFor]   = useState(null);
  const [savingFor,    setSavingFor]      = useState(null);
  const [savedFor,     setSavedFor]       = useState({}); // phrase → blobURL
  const [playingFor,   setPlayingFor]     = useState(null);
  const [errorMsg,     setErrorMsg]       = useState("");

  const recorderRef  = useRef(null);
  const chunksRef    = useRef([]);
  const audioRef     = useRef(null);

  // ── Recording ───────────────────────────────────────────────────
  const startRecording = useCallback(async (phrase) => {
    setErrorMsg("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const blobURL = URL.createObjectURL(blob);

        setSavingFor(phrase);
        try {
          await savePhrase(phrase, blob);
          setSavedFor(prev => ({ ...prev, [phrase]: blobURL }));
        } catch {
          setErrorMsg(`Could not save "${phrase}". Try again.`);
        } finally {
          setSavingFor(null);
        }
      };

      recorder.start();
      setRecordingFor(phrase);
    } catch {
      setErrorMsg("Microphone access denied.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
    setRecordingFor(null);
  }, []);

  // ── Playback ─────────────────────────────────────────────────────
  const playRecording = useCallback((phrase, blobURL) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingFor === phrase) {
      setPlayingFor(null);
      return;
    }
    const audio = new Audio(blobURL);
    audioRef.current = audio;
    audio.onended = () => setPlayingFor(null);
    audio.play();
    setPlayingFor(phrase);
  }, [playingFor]);

  const speakPhrase = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="banking-screen">

      {/* Background circles */}
      <div className="circle circle-a" />
      <div className="circle circle-b" />
      <div className="circle circle-c" />
      <div className="circle circle-d" />

      {/* Header */}
      <div className="banking-header">
        <div className="logo">synova</div>
        <div className="banking-title">Voice</div>
      </div>

      <div className="banking-subtitle">
        Record your own voice for each phrase.
      </div>

      {errorMsg && (
        <div className="banking-error">{errorMsg}</div>
      )}

      {/* Phrase list */}
      <div className="phrase-list">
        {phrases.map((phrase) => {
          const isRecording = recordingFor === phrase;
          const isSaving    = savingFor    === phrase;
          const isPlaying   = playingFor   === phrase;
          const blobURL     = savedFor[phrase];

          return (
            <div key={phrase} className="phrase-row">

              {/* Phrase text + TTS preview */}
              <button className="phrase-text-btn" onClick={() => speakPhrase(phrase)}>
                <span className="phrase-text">{phrase}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="phrase-speak-icon">
                  <path d="M11 5L6 9H2v6h4l5 4V5Z" fill="#b2f0e8" opacity="0.6"/>
                  <path d="M15.5 8.5a5 5 0 0 1 0 7" stroke="#b2f0e8" strokeWidth="1.8" strokeLinecap="round" opacity="0.6"/>
                </svg>
              </button>

              {/* Action buttons */}
              <div className="phrase-actions">

                {/* Play saved recording */}
                {blobURL && (
                  <button
                    className={`action-btn ${isPlaying ? "action-btn--active" : ""}`}
                    onClick={() => playRecording(phrase, blobURL)}
                    title="Play recording"
                  >
                    {isPlaying ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#b2f0e8">
                        <rect x="6" y="5" width="4" height="14" rx="1"/>
                        <rect x="14" y="5" width="4" height="14" rx="1"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#b2f0e8">
                        <path d="M6 4l14 8-14 8V4Z"/>
                      </svg>
                    )}
                  </button>
                )}

                {/* Record button */}
                <button
                  className={`action-btn record-btn ${isRecording ? "record-btn--active" : ""} ${isSaving ? "record-btn--saving" : ""}`}
                  onPointerDown={() => !isSaving && startRecording(phrase)}
                  onPointerUp={stopRecording}
                  onPointerLeave={stopRecording}
                  onPointerCancel={stopRecording}
                  disabled={isSaving}
                  title={isRecording ? "Release to save" : blobURL ? "Re-record" : "Hold to record"}
                >
                  {isSaving ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ animation: "spin 1s linear infinite" }}>
                      <circle cx="12" cy="12" r="9" stroke="rgba(178,240,232,0.25)" strokeWidth="2.5"/>
                      <path d="M12 3 A9 9 0 0 1 21 12" stroke="#b2f0e8" strokeWidth="2.5" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <rect x="9" y="2" width="6" height="11" rx="3" fill={isRecording ? "#ff6b6b" : "#b2f0e8"}/>
                      <path d="M5 11a7 7 0 0 0 14 0" stroke={isRecording ? "#ff6b6b" : "#b2f0e8"} strokeWidth="2" strokeLinecap="round"/>
                      <line x1="12" y1="18" x2="12" y2="21" stroke={isRecording ? "#ff6b6b" : "#b2f0e8"} strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                  )}
                </button>

              </div>

              {/* Saved indicator */}
              {blobURL && (
                <div className="saved-badge">Saved</div>
              )}

            </div>
          );
        })}
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
