import { useState } from "react";
import { useNavigate } from "react-router-dom";
import EeshaWalkComponent from "../components/EeshaWalkComponent";
import "../styles/circles.css";
import "./WalkScreen.css";

const NAV = [
  { label: "Talk",  icon: "/icons/nav-talk.png",  path: "/"        },
  { label: "Speak", icon: "/icons/nav-speak.png", path: "/speak"   },
  { label: "Walk",  icon: "/icons/nav-walk.png",  path: "/walk"    },
  { label: "Voice", icon: "/icons/nav-voice.png", path: "/banking" },
];

const CADENCES = ["slow", "medium", "fast"];

export default function WalkScreen() {
  const navigate  = useNavigate();
  const [walking, setWalking]   = useState(false);
  const [cadence, setCadence]   = useState("medium");

  return (
    <div className="walk-screen">

      {/* Background circles */}
      <div className="circle circle-a" />
      <div className="circle circle-b" />
      <div className="circle circle-c" />
      <div className="circle circle-d" />

      {/* Header */}
      <div className="walk-header">
        <div className="logo">synova</div>
        <div className="walk-title">Walk</div>
      </div>

      {walking ? (
        /* ── Active walking session ── */
        <EeshaWalkComponent cadence={cadence} onStop={() => setWalking(false)} />
      ) : (
        /* ── Pre-walk setup ── */
        <div className="walk-setup">

          <div className="walk-icon-wrap">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="4"  r="2"  fill="#b2f0e8" opacity="0.9"/>
              <path d="M9 9h6l1 5H8L9 9Z" fill="#b2f0e8" opacity="0.7"/>
              <path d="M8 14l-2 6" stroke="#b2f0e8" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M16 14l2 6"  stroke="#b2f0e8" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M10 14l-1 4" stroke="#b2f0e8" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M14 14l1 4"  stroke="#b2f0e8" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="walk-cue">Set your pace, then start walking.</div>

          {/* Cadence selector */}
          <div className="cadence-wrap">
            <div className="cadence-label">Cadence</div>
            <div className="cadence-picker">
              {CADENCES.map((c) => (
                <button
                  key={c}
                  className={`cadence-btn ${cadence === c ? "cadence-btn--active" : ""}`}
                  onClick={() => setCadence(c)}
                >
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Start button */}
          <button className="walk-start-btn" onClick={() => setWalking(true)}>
            Start Walking
          </button>

        </div>
      )}

      {/* Bottom nav — hidden during walking for full-screen feel */}
      {!walking && (
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
