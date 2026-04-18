import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePatient } from "../context/PatientContext";
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

const NAV = [
  { label: "Talk",  icon: "/icons/nav-talk.png",  path: "/"        },
  { label: "Speak", icon: "/icons/nav-speak.png", path: "/speak"   },
  { label: "Walk",  icon: "/icons/nav-walk.png",  path: "/walk"    },
  { label: "Voice", icon: "/icons/nav-voice.png", path: "/banking" },
];

export default function HomeScreen() {
  const navigate = useNavigate();
  const { name, medOn, setMedOn } = usePatient();
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

      {/* Background circles */}
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

        {/* Med toggle */}
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

      {/* Output box */}
      <div className="output-box-wrap">
        <div className="output-box">
          <span className={`output-text${spoken ? "" : " output-text--empty"}`}>
            {spoken || "Tap a phrase to speak"}
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
            <button
              key={label}
              onClick={() => speak(label)}
              className={`phrase-btn ${medOn ? "phrase-btn--med" : "phrase-btn--full"}`}
              onPointerDown={e => e.currentTarget.style.opacity = "0.7"}
              onPointerUp={e => e.currentTarget.style.opacity = "1"}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Expand toggle */}
        <div className={`expand-toggle-row ${expanded ? "expand-toggle-row--expanded" : "expand-toggle-row--normal"}`}>
          <button className="expand-btn" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Collapse" : "Expand"}
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              {expanded ? (
                <>
                  <path d="M6 1H1V6" stroke="#b2f0e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M10 15H15V10" stroke="#b2f0e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </>
              ) : (
                <>
                  <path d="M1 6V1H6" stroke="#b2f0e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 10V15H10" stroke="#b2f0e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Bottom nav */}
      {!expanded && (
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
      )}

    </div>
  );
}
