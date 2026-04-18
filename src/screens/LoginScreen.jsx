import { useNavigate } from "react-router-dom";

const circleStyles = `
  @keyframes floatA {
    0%   { transform: translate(0px, 0px) scale(1); }
    33%  { transform: translate(18px, -22px) scale(1.06); }
    66%  { transform: translate(-12px, 14px) scale(0.96); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  @keyframes floatB {
    0%   { transform: translate(0px, 0px) scale(1); }
    40%  { transform: translate(-20px, 16px) scale(1.08); }
    75%  { transform: translate(14px, -10px) scale(0.94); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  @keyframes floatC {
    0%   { transform: translate(0px, 0px) scale(1); }
    30%  { transform: translate(16px, 20px) scale(1.05); }
    70%  { transform: translate(-18px, -14px) scale(0.97); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  @keyframes floatD {
    0%   { transform: translate(0px, 0px) scale(1); }
    50%  { transform: translate(22px, -18px) scale(1.07); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
`;

export default function LoginScreen() {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a3d3d",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      position: "relative",
      overflow: "hidden",
      padding: "40px 32px",
    }}>
      <style>{circleStyles}</style>

      {/* Background circles */}
      <div style={{
        position: "absolute", top: -80, right: -80,
        width: 340, height: 340, borderRadius: "50%",
        background: "rgba(178, 240, 232, 0.09)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        border: "1px solid rgba(178, 240, 232, 0.2)",
        pointerEvents: "none",
        animation: "floatA 9s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", top: 80, right: 80,
        width: 180, height: 180, borderRadius: "50%",
        background: "rgba(178, 240, 232, 0.06)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        border: "1px solid rgba(178, 240, 232, 0.14)",
        pointerEvents: "none",
        animation: "floatB 12s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", bottom: -90, left: -90,
        width: 300, height: 300, borderRadius: "50%",
        background: "rgba(178, 240, 232, 0.07)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(178, 240, 232, 0.16)",
        pointerEvents: "none",
        animation: "floatC 11s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", top: "45%", left: "25%",
        width: 220, height: 220, borderRadius: "50%",
        background: "rgba(178, 240, 232, 0.04)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(178, 240, 232, 0.1)",
        pointerEvents: "none",
        animation: "floatD 14s ease-in-out infinite",
      }} />

      {/* Logo + tagline */}
      <div style={{ textAlign: "center", marginBottom: 52, zIndex: 1 }}>
        <div style={{
          fontFamily: "'Lemon', cursive",
          fontSize: 58,
          color: "#b2f0e8",
          marginBottom: 12,
          letterSpacing: -1,
        }}>
          synova
        </div>
        <div style={{
          color: "#b2f0e8",
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: 2,
          textTransform: "uppercase",
          opacity: 0.85,
        }}>
          Every word, every step.
        </div>
      </div>

      {/* Buttons */}
      <div style={{ width: "100%", maxWidth: 340, display: "flex", flexDirection: "column", gap: 16, zIndex: 1 }}>
        <button
          onClick={() => navigate("/signup")}
          style={{
            width: "100%",
            padding: "22px",
            borderRadius: 50,
            background: "#1a5c5c",
            border: "none",
            color: "#b2f0e8",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0,0,0,0.4), 0 1px 4px rgba(178,240,232,0.15)",
          }}
        >
          Sign Up
        </button>

        <button
          onClick={() => navigate("/login-form")}
          style={{
            width: "100%",
            padding: "22px",
            borderRadius: 50,
            background: "#154848",
            border: "none",
            color: "#b2f0e8",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 1.5,
            textTransform: "uppercase",
            cursor: "pointer",
            boxShadow: "0 6px 20px rgba(0,0,0,0.4), 0 1px 4px rgba(178,240,232,0.15)",
          }}
        >
          Log In
        </button>
      </div>

      {/* Adjust button size */}
      <div
        onClick={() => alert("Button size adjustment coming soon!")}
        style={{
          marginTop: 40,
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          zIndex: 1,
          opacity: 0.7,
        }}
      >
        <span style={{ color: "#b2f0e8", fontSize: 15, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase" }}>
          Adjust button size
        </span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M1 6V1H6" stroke="#b2f0e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 10V15H10" stroke="#b2f0e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

    </div>
  );
}
