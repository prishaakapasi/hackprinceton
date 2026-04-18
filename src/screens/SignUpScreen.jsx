import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePatient } from "../context/PatientContext";

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

export default function SignUpScreen() {
  const navigate = useNavigate();
  const { setName } = usePatient();
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const handleContinue = () => {
    if (!input.trim()) {
      setError("Please enter your name");
      return;
    }
    setName(input.trim());
    localStorage.setItem("synova-name", input.trim());
    navigate("/onboarding");
  };

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

      {/* Back button */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute", top: 48, left: 32,
          background: "none", border: "none",
          color: "#b2f0e8", fontSize: 17, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6,
          opacity: 0.7, zIndex: 1,
        }}
      >
        ← Back
      </button>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 48, zIndex: 1 }}>
        <div style={{
          fontFamily: "'Lemon', cursive",
          fontSize: 48,
          color: "#b2f0e8",
          marginBottom: 10,
        }}>
          synova
        </div>
        <div style={{
          color: "#b2f0e8", fontSize: 18, opacity: 0.7,
        }}>
          Let's get you set up
        </div>
      </div>

      {/* Form */}
      <div style={{ width: "100%", maxWidth: 340, zIndex: 1 }}>

        <div style={{ marginBottom: 24 }}>
          <label style={{
            display: "block",
            color: "#b2f0e8", fontSize: 16, fontWeight: 600,
            letterSpacing: 1.5, textTransform: "uppercase",
            marginBottom: 10, opacity: 0.7,
          }}>
            Your name
          </label>
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleContinue()}
            placeholder="e.g. Margaret"
            style={{
              width: "100%",
              padding: "20px 22px",
              borderRadius: 16,
              background: "#1a5454",
              border: error ? "1.5px solid #ff6b6b" : "1.5px solid #2a6464",
              color: "#b2f0e8",
              fontSize: 20,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          {error && (
            <div style={{ color: "#ff8888", fontSize: 15, marginTop: 6, paddingLeft: 4 }}>
              {error}
            </div>
          )}
        </div>

        <button
          onClick={handleContinue}
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
          Continue
        </button>

        <div style={{
          textAlign: "center", marginTop: 22,
          color: "#b2f0e8", fontSize: 15, opacity: 0.5,
        }}>
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login-form")}
            style={{ opacity: 1, cursor: "pointer", textDecoration: "underline" }}
          >
            Log in
          </span>
        </div>

      </div>
    </div>
  );
}
