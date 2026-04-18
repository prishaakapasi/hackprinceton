import { useState, useRef, useCallback } from "react";
import { usePatient } from "../context/PatientContext";
import { savePhrase } from "../api";
import NavBar from "../components/NavBar";
import "../styles/circles.css";
import "./BankingScreen.css";

export default function BankingScreen() {
  const { phrases } = usePatient();

  const [recordingFor, setRecordingFor] = useState(null);
  const [savingFor,    setSavingFor]    = useState(null);
  const [savedFor,     setSavedFor]     = useState({}); // phrase → blobURL
  const [playingFor,   setPlayingFor]   = useState(null);
  const [errorMsg,     setErrorMsg]     = useState("");

  const recorderRef = useRef(null);
  const chunksRef   = useRef([]);
  const audioRef    = useRef(null);

  // ── Recording ────────────────────────────────────────────────────
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
        const blob    = new Blob(chunksRef.current, { type: "audio/webm" });
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
  const handlePlay = useCallback((phrase) => {
    const blobURL = savedFor[phrase];

    // Stop anything currently playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingFor === phrase) {
      setPlayingFor(null);
      return;
    }

    if (blobURL) {
      // Play saved voice recording
      const audio = new Audio(blobURL);
      audioRef.current = audio;
      audio.onended = () => setPlayingFor(null);
      audio.play();
      setPlayingFor(phrase);
    } else {
      // Fall back to TTS preview
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

  return (
    <div className="banking-screen">

      <div className="circle circle-a" />
      <div className="circle circle-b" />
      <div className="circle circle-c" />
      <div className="circle circle-d" />

      {/* Header */}
      <div className="banking-header">
        <div className="logo">synova</div>
        <div className="banking-title">Voice Banking</div>
      </div>
      <div className="banking-subtitle">
        Record your voice for each phrase — it will be used to speak for you.
      </div>

      {errorMsg && (
        <div className="banking-error" onClick={() => setErrorMsg("")}>
          {errorMsg} <span className="banking-error-dismiss">✕</span>
        </div>
      )}

      {/* Phrase cards */}
      <div className="phrase-list">
        {phrases.map((phrase) => {
          const isRecording = recordingFor === phrase;
          const isSaving    = savingFor    === phrase;
          const isPlaying   = playingFor   === phrase;
          const isSaved     = !!savedFor[phrase];

          return (
            <div key={phrase} className={`phrase-card ${isSaved ? "phrase-card--saved" : ""}`}>

              {/* Phrase label + saved badge */}
              <div className="phrase-card-header">
                <span className="phrase-card-text">{phrase}</span>
                {isSaved && <span className="saved-badge">✓ Recorded</span>}
              </div>

              {/* Two big action buttons */}
              <div className="phrase-card-actions">

                {/* Play / Stop */}
                <button
                  className={`card-action-btn card-action-btn--play ${isPlaying ? "card-action-btn--active" : ""}`}
                  onClick={() => handlePlay(phrase)}
                  disabled={isSaving}
                >
                  {isPlaying ? (
                    <>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#b2f0e8">
                        <rect x="5" y="4" width="5" height="16" rx="1.5"/>
                        <rect x="14" y="4" width="5" height="16" rx="1.5"/>
                      </svg>
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="#b2f0e8">
                        <path d="M5 3l14 9-14 9V3Z"/>
                      </svg>
                      <span>{isSaved ? "Play" : "Preview"}</span>
                    </>
                  )}
                </button>

                {/* Record */}
                <button
                  className={`card-action-btn card-action-btn--record ${isRecording ? "card-action-btn--recording" : ""} ${isSaving ? "card-action-btn--saving" : ""}`}
                  onPointerDown={() => !isSaving && !isPlaying && startRecording(phrase)}
                  onPointerUp={stopRecording}
                  onPointerLeave={stopRecording}
                  onPointerCancel={stopRecording}
                  disabled={isSaving || isPlaying}
                >
                  {isSaving ? (
                    <>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" className="saving-spin">
                        <circle cx="12" cy="12" r="9" stroke="rgba(178,240,232,0.2)" strokeWidth="2.5"/>
                        <path d="M12 3A9 9 0 0 1 21 12" stroke="#b2f0e8" strokeWidth="2.5" strokeLinecap="round"/>
                      </svg>
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <rect x="8" y="2" width="8" height="13" rx="4"
                          fill={isRecording ? "#ff6b6b" : "#b2f0e8"}/>
                        <path d="M5 11a7 7 0 0 0 14 0"
                          stroke={isRecording ? "#ff6b6b" : "#b2f0e8"}
                          strokeWidth="2" strokeLinecap="round"/>
                        <line x1="12" y1="18" x2="12" y2="21"
                          stroke={isRecording ? "#ff6b6b" : "#b2f0e8"}
                          strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>{isRecording ? "Recording…" : isSaved ? "Re-record" : "Hold to Record"}</span>
                    </>
                  )}
                </button>

              </div>
            </div>
          );
        })}
      </div>

      <NavBar />

    </div>
  );
}
