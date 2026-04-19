
import { useEffect, useState } from "react";
import "./EeshaWalkComponent.css";

/**
 * Eesha's walking session component.
 * Props:
 *   cadence — "slow" | "medium" | "fast"
 *   onStop  — callback to return to normal view
 *
 * Replace the body of this component with Eesha's implementation.
 * The cadence prop and onStop callback are the only contract.
 */
export default function EeshaWalkComponent({ cadence, onStop }) {
  const [seconds, setSeconds] = useState(0);
  const [steps,   setSteps]   = useState(0);

  // Simulate step cadence until Eesha's real implementation is wired in
  const bpm = cadence === "slow" ? 80 : cadence === "fast" ? 120 : 100;

  useEffect(() => {
    const tick = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    const ms  = Math.round(60000 / bpm);
    const step = setInterval(() => setSteps(s => s + 1), ms);
    return () => clearInterval(step);
  }, [bpm]);

  const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="eesha-walk">
      <div className="eesha-cadence-badge">{cadence.toUpperCase()}</div>

      <div className="eesha-stat-row">
        <div className="eesha-stat">
          <div className="eesha-stat-value">{fmt(seconds)}</div>
          <div className="eesha-stat-label">Time</div>
        </div>
        <div className="eesha-stat">
          <div className="eesha-stat-value">{steps}</div>
          <div className="eesha-stat-label">Steps</div>
        </div>
        <div className="eesha-stat">
          <div className="eesha-stat-value">{bpm}</div>
          <div className="eesha-stat-label">BPM</div>
        </div>
      </div>

      {/* Metronome pulse ring — replace with Eesha's visual */}
      <div className="eesha-pulse" style={{ animationDuration: `${60000 / bpm}ms` }} />

      <button className="eesha-stop-btn" onClick={onStop}>
        Stop
      </button>
    </div>
  );
}
