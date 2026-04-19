import React, { useState } from "react";
import EeshaWalkComponent from "../components/EeshaWalkComponent";
import NavBar from "../components/NavBar";
import SettingsSheet from "../components/SettingsSheet";1
import "../styles/circles.css";
import "./WalkScreen.css";

export default function WalkScreen() {
  const [walking,   setWalking]   = useState(false);
  const [audioCtx,  setAudioCtx]  = useState(null);
  const [soundType, setSoundType] = useState("tick");
  const [expanded, setExpanded]   = useState(false);
  const [settings, setSettings]   = useState(false);

  // AudioContext MUST be created synchronously inside a click handler —
  // browsers auto-suspend it if created anywhere else (e.g. useEffect).
  const handleStart = async () => {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    await ctx.resume();   // unlocks audio on iOS / Chrome autoplay policy
    setAudioCtx(ctx);
    setWalking(true);
  };

  const handleStop = () => {
    if (audioCtx) {
      audioCtx.close();
      setAudioCtx(null);
    }
    setWalking(false);
  };

  const SOUNDS = [
    { key: "tick",    label: "Metronome" },
    { key: "marimba", label: "Marimba"   },
    { key: "groove",  label: "Groove"    },
    { key: "piano",   label: "Piano"     },
  ];

  return (
    <div className="walk-screen">
      <div className="circle circle-a" />
      <div className="circle circle-b" />

      <div className="walk-header">
        <div className="logo">synova</div>

        <div className="top-bar-right">
          <button className="top-icon-btn" onClick={() => setExpanded(!expanded)} aria-label={expanded ? "Collapse" : "Expand"}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              {expanded ? (
                <>
                  <path d="M6 1H1V6"    stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 15H15V10" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </>
              ) : (
                <>
                  <path d="M1 6V1H6"    stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 10V15H10" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </>
              )}
            </svg>
          </button>

          <button className="top-icon-btn" onClick={() => setSettings(true)} aria-label="Settings">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      {walking && audioCtx ? (
        <EeshaWalkComponent
          audioCtx={audioCtx}
          soundType={soundType}
          onStop={handleStop}
        />
      ) : (
        <div className={`walk-setup ${expanded ? "walk-setup--expanded" : ""}`}>
          <div className="walk-icon-wrap">
            <div className="pulse-ring" />
          </div>

          <div className="walk-cue">Select sound, then start sensors.</div>

          <div className="cadence-wrap">
            <div className="cadence-label">Sound Profile</div>
            <div className="cadence-picker">
              {SOUNDS.map(({ key, label }) => (
                <button
                  key={key}
                  className={`cadence-btn ${soundType === key ? "cadence-btn--active" : ""}`}
                  onClick={() => setSoundType(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <button className="walk-start-btn" onClick={handleStart}>
            START SENSORS
          </button>
        </div>
      )}

      {!walking && <NavBar />}

      {settings && <SettingsSheet onClose={() => setSettings(false)} />}

    </div>
  );
}
