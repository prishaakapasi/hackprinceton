import { useRef, useState, useCallback } from "react";
import "./DwellButton.css";

const DWELL_MS = 600;
const MOVE_THRESHOLD = 10;

export default function DwellButton({ label, onFire, className = "" }) {
  const [progress, setProgress] = useState(0); // 0–100
  const [fired, setFired] = useState(false);

  const timerRef      = useRef(null);
  const rafRef        = useRef(null);
  const startTimeRef  = useRef(null);
  const startPosRef   = useRef(null);
  const activeRef     = useRef(false);

  const cancel = useCallback(() => {
    activeRef.current = false;
    clearTimeout(timerRef.current);
    cancelAnimationFrame(rafRef.current);
    startTimeRef.current = null;
    startPosRef.current  = null;
    setProgress(0);
    setFired(false);
  }, []);

  const tick = useCallback(() => {
    if (!activeRef.current || !startTimeRef.current) return;
    const elapsed = Date.now() - startTimeRef.current;
    const pct = Math.min((elapsed / DWELL_MS) * 100, 100);
    setProgress(pct);
    if (pct < 100) {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []);

  const handlePointerDown = useCallback((e) => {
    e.preventDefault();
    cancel();

    activeRef.current   = true;
    startTimeRef.current = Date.now();
    startPosRef.current  = { x: e.clientX, y: e.clientY };

    rafRef.current = requestAnimationFrame(tick);

    timerRef.current = setTimeout(() => {
      if (!activeRef.current) return;
      setProgress(100);
      setFired(true);
      activeRef.current = false;
      onFire();
      // Reset after brief flash
      setTimeout(() => {
        setProgress(0);
        setFired(false);
      }, 300);
    }, DWELL_MS);
  }, [cancel, tick, onFire]);

  const handlePointerMove = useCallback((e) => {
    if (!activeRef.current || !startPosRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    if (Math.sqrt(dx * dx + dy * dy) > MOVE_THRESHOLD) {
      cancel();
    }
  }, [cancel]);

  const handlePointerUp = useCallback(() => {
    cancel();
  }, [cancel]);

  const ringStyle = {
    background: `conic-gradient(
      rgba(178, 240, 232, 0.9) ${progress * 3.6}deg,
      transparent ${progress * 3.6}deg
    )`,
  };

  return (
    <button
      className={`dwell-btn ${fired ? "dwell-btn--fired" : ""} ${className}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Progress ring */}
      <span className="dwell-ring" style={ringStyle} aria-hidden="true">
        <span className="dwell-ring-inner" />
      </span>

      {/* Label */}
      <span className="dwell-label">{label}</span>
    </button>
  );
}
