import { useState } from "react";
import { usePatient } from "../context/PatientContext";
import DwellButton from "../components/DwellButton";
import NavBar from "../components/NavBar";
import SettingsSheet from "../components/SettingsSheet";
import "../styles/circles.css";
import "./HomeScreen.css";

const PHRASES = [
  { label: "I need water" },
  { label: "I'm in pain" },
  { label: "Call daughter" },
  { label: "I'm tired" },
  { label: "Thank you" },
  { label: "Yes" },
];

export default function HomeScreen() {
  const { name, medOn } = usePatient();
  const [spoken,   setSpoken]   = useState("");
  const [expanded, setExpanded] = useState(false);
  const [settings, setSettings] = useState(false);

  const speak = (phrase) => {
    setSpoken(phrase);
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(phrase);
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="home-screen">

      <div className="circle circle-a" />
      <div className="circle circle-b" />
      <div className="circle circle-c" />
      <div className="circle circle-d" />

      {/* Top bar */}
      <div className="top-bar">
        <div>
          <div className="logo">synova</div>
        </div>

        <div className="top-bar-right">
          {/* Expand / collapse */}
          <button className="top-icon-btn" onClick={() => setExpanded(!expanded)} aria-label={expanded ? "Collapse" : "Expand"}>
            <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
              {expanded ? (
                <>
                  <path d="M6 1H1V6"   stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 15H15V10" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </>
              ) : (
                <>
                  <path d="M1 6V1H6"   stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 10V15H10" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </>
              )}
            </svg>
          </button>

          {/* Settings */}
          <button className="top-icon-btn" onClick={() => setSettings(true)} aria-label="Settings">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Welcome heading */}
      <div className="welcome-heading">{name ? `welcome ${name.toLowerCase()}` : "welcome"}</div>

      {/* Output box */}
      <div className="output-box-wrap">
        <div className="output-box">
          <span className={`output-text${spoken ? "" : " output-text--empty"}`}>
            {spoken || "Hold a phrase to speak"}
          </span>
          {spoken && (
            <button className="again-btn" onClick={() => speak(spoken)}>
              Again
            </button>
          )}
        </div>
      </div>

      {/* Phrase grid */}
      <div className={`phrase-grid-wrap ${expanded ? "phrase-grid-wrap--expanded" : "phrase-grid-wrap--normal"}`}>
        <div className={`phrase-grid ${expanded ? "phrase-grid--expanded" : "phrase-grid--normal"}`}>
          {PHRASES.map(({ label }) => (
            <DwellButton
              key={label}
              label={label}
              onFire={() => speak(label)}
              className={
                expanded
                  ? (medOn ? "dwell-btn--med-exp" : "dwell-btn--full-exp")
                  : (medOn ? "dwell-btn--med"     : "dwell-btn--full")
              }
            />
          ))}
        </div>
      </div>

      <NavBar />

      {settings && <SettingsSheet onClose={() => setSettings(false)} />}

    </div>
  );
}