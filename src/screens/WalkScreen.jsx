import { useState } from "react";
import EeshaWalkComponent from "../components/EeshaWalkComponent";
import NavBar from "../components/NavBar";
import "../styles/circles.css";
import "./WalkScreen.css";

const CADENCES = ["slow", "medium", "fast"];

export default function WalkScreen() {
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
              <circle cx="12" cy="4"  r="2"  fill="var(--accent)" opacity="0.9"/>
              <path d="M9 9h6l1 5H8L9 9Z" fill="var(--accent)" opacity="0.7"/>
              <path d="M8 14l-2 6" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M16 14l2 6"  stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M10 14l-1 4" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/>
              <path d="M14 14l1 4"  stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round"/>
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

      {!walking && <NavBar />}

    </div>
  );
}
