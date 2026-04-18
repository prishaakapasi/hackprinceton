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

const PHRASES = [
  { label: "I need water",    bg: "#0f4f4f", color: "#b2f0e8" },
  { label: "I'm in pain",     bg: "#0f4f4f", color: "#b2f0e8" },
  { label: "Call daughter",   bg: "#0f4f4f", color: "#b2f0e8" },
  { label: "I'm tired",       bg: "#0f4f4f", color: "#b2f0e8" },
  { label: "Thank you",       bg: "#0f4f4f", color: "#b2f0e8" },
  { label: "Yes",             bg: "#0f4f4f", color: "#b2f0e8" },
];

const NAV = [
  { label: "Talk",  icon: "/icons/nav-talk.png",  path: "/"         },
  { label: "Speak", icon: "/icons/nav-speak.png", path: "/speak"    },
  { label: "Walk",  icon: "/icons/nav-walk.png",  path: "/walk"     },
  { label: "Voice", icon: "/icons/nav-voice.png", path: "/banking"  },
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

  const btnPadding = medOn ? "20px 12px" : "30px 12px";
  const btnFontSize = medOn ? 18 : 22;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0a3d3d",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
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
        position: "absolute", bottom: 80, left: -90,
        width: 300, height: 300, borderRadius: "50%",
        background: "rgba(178, 240, 232, 0.07)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(178, 240, 232, 0.16)",
        pointerEvents: "none",
        animation: "floatC 11s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", top: "40%", left: "30%",
        width: 220, height: 220, borderRadius: "50%",
        background: "rgba(178, 240, 232, 0.04)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        border: "1px solid rgba(178, 240, 232, 0.1)",
        pointerEvents: "none",
        animation: "floatD 14s ease-in-out infinite",
      }} />

      {/* Top bar */}
      <div style={{
        display: "flex", alignItems: "center",
        justifyContent: "space-between",
        padding: "52px 24px 16px",
        zIndex: 1,
      }}>
        <div>
          <div style={{
            fontFamily: "'Lemon', cursive",
            fontSize: 28, color: "#b2f0e8",
          }}>
            synova
          </div>
          <div style={{ color: "#b2f0e8", fontSize: 15, opacity: 0.55, marginTop: 2 }}>
            {name ? `Hi, ${name}` : "Welcome"}
          </div>
        </div>

        {/* Med toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "#b2f0e8", fontSize: 14, opacity: 0.6 }}>
            {medOn ? "Med on" : "Med off"}
          </span>
          <div
            onClick={() => setMedOn(!medOn)}
            style={{
              width: 44, height: 24, borderRadius: 12,
              background: medOn ? "#2a8a6a" : "#2a5454",
              position: "relative", cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            <div style={{
              position: "absolute", top: 3,
              left: medOn ? 23 : 3,
              width: 18, height: 18, borderRadius: "50%",
              background: "#b2f0e8",
              transition: "left 0.2s",
            }} />
          </div>
        </div>
      </div>

      {/* Output box */}
      <div style={{ padding: "0 24px 16px", zIndex: 1 }}>
        <div style={{
          background: "#1a5454",
          borderRadius: 16,
          padding: "14px 18px",
          minHeight: 52,
          display: "flex", alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{
            color: spoken ? "#b2f0e8" : "#b2f0e8",
            fontSize: 18, opacity: spoken ? 1 : 0.4,
            fontStyle: spoken ? "normal" : "italic",
          }}>
            {spoken || "Tap a phrase to speak"}
          </span>
          {spoken && (
            <button
              onClick={() => speak(spoken)}
              style={{
                background: "#2a6e5e", border: "none",
                borderRadius: 20, padding: "8px 16px",
                color: "#b2f0e8", fontSize: 14,
                fontWeight: 600, cursor: "pointer",
                letterSpacing: 0.5,
                boxShadow: "0 4px 14px rgba(0,0,0,0.35), 0 1px 4px rgba(178,240,232,0.15)",
              }}
            >
              Again
            </button>
          )}
        </div>
      </div>

      {/* Phrase grid */}
      <div style={{
        flex: 1, padding: expanded ? "0" : "0 24px",
        zIndex: 1,
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: expanded ? "1fr 1fr" : "1fr 1fr",
          gap: expanded ? 8 : 10,
          padding: expanded ? 8 : 0,
        }}>
          {PHRASES.map(({ label, bg, color }) => (
            <button
              key={label}
              onClick={() => speak(label)}
              style={{
                background: bg,
                border: "1px solid #2a6464",
                borderRadius: 16,
                padding: btnPadding,
                color: color,
                fontSize: btnFontSize,
                fontWeight: 600,
                cursor: "pointer",
                textAlign: "center",
                transition: "opacity 0.1s, transform 0.1s",
                lineHeight: 1.3,
                boxShadow: "0 6px 20px rgba(0,0,0,0.4), 0 1px 4px rgba(178,240,232,0.12)",
              }}
              onPointerDown={e => e.currentTarget.style.opacity = "0.7"}
              onPointerUp={e => e.currentTarget.style.opacity = "1"}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Expand toggle */}
        <div style={{
          display: "flex", justifyContent: "flex-end",
          padding: expanded ? "8px 8px 0" : "10px 0 0",
        }}>
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none", border: "none",
              cursor: "pointer", opacity: 0.5,
              display: "flex", alignItems: "center", gap: 6,
              color: "#b2f0e8", fontSize: 14,
              fontWeight: 600, letterSpacing: 1,
              textTransform: "uppercase",
            }}
          >
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
        <div style={{
          display: "flex",
          background: "#0d4747",
          borderTop: "1px solid #1a5454",
          padding: "12px 0 28px",
          zIndex: 1,
        }}>
          {NAV.map(({ label, icon, path }) => {
            const active = window.location.pathname === path;
            return (
              <button
                key={label}
                onClick={() => navigate(path)}
                style={{
                  flex: 1, background: "none", border: "none",
                  cursor: "pointer",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: 4,
                  opacity: active ? 1 : 0.45,
                }}
              >
                <img src={icon} alt={label} style={{ width: 28, height: 28, objectFit: "contain", filter: "brightness(0) invert(1) sepia(1) saturate(2) hue-rotate(120deg)" }} />
                <span style={{
                  color: "#b2f0e8", fontSize: 13,
                  fontWeight: 600, letterSpacing: 0.5,
                  textTransform: "uppercase",
                }}>
                  {label}
                </span>
                {active && (
                  <div style={{
                    width: 4, height: 4, borderRadius: "50%",
                    background: "#b2f0e8",
                  }} />
                )}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
}
