import { useState } from "react";
import { usePatient } from "../context/PatientContext";
import DwellButton from "../components/DwellButton";
import NavBar from "../components/NavBar";
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
  const { name, medOn, setMedOn, theme, toggleTheme } = usePatient();
  const [spoken, setSpoken] = useState("");
  const [expanded, setExpanded] = useState(false);

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
          <div className="greeting">{name ? `Hi, ${name}` : "Welcome"}</div>
        </div>

        <div className="top-bar-right">
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? (
              /* Sun icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5" fill="var(--accent)" stroke="none"/>
                <line x1="12" y1="2"  x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22"/>
                <line x1="2"  y1="12" x2="5"  y2="12"/>
                <line x1="19" y1="12" x2="22" y2="12"/>
                <line x1="4.22"  y1="4.22"  x2="6.34"  y2="6.34" />
                <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
                <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66"/>
                <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22" />
              </svg>
            ) : (
              /* Moon icon */
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
          <div className="med-toggle-row">
            <span className="med-label">{medOn ? "Med on" : "Med off"}</span>
            <div
              onClick={() => setMedOn(!medOn)}
              className={`med-track ${medOn ? "med-track--on" : "med-track--off"}`}
            >
              <div className="med-thumb" style={{ left: medOn ? 23 : 3 }} />
            </div>
          </div>
        </div>
      </div>

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

        <div className={`expand-toggle-row ${expanded ? "expand-toggle-row--expanded" : "expand-toggle-row--normal"}`}>
          <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Collapse" : "Expand"}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {expanded ? (
                <>
                  <path d="M6 1H1V6" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 15H15V10" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </>
              ) : (
                <>
                  <path d="M1 6V1H6" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 10V15H10" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {!expanded && <NavBar />}

    </div>
  );
}
