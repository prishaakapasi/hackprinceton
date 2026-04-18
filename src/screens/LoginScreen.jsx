import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/circles.css";
import "./LoginScreen.css";

export default function LoginScreen() {
  const navigate = useNavigate();
  const [large, setLarge] = useState(false);

  const btnSizeClass = large ? "login-btn--size-3" : "login-btn--size-1";

  return (
    <div className="login-screen">

      {/* Background circles */}
      <div className="circle circle-a" />
      <div className="circle circle-b" />
      <div className="circle circle-c" />
      <div className="circle circle-d" />

      {/* Logo + tagline */}
      <div className="login-logo-wrap">
        <div className="login-logo">synova</div>
        <div className="login-tagline">Helping you with every word and step.</div>
      </div>

      {/* Buttons */}
      <div className="login-buttons">
        <button className={`login-btn login-btn--primary ${btnSizeClass}`} onClick={() => navigate("/signup")}>
          Sign Up
        </button>
        <button className={`login-btn login-btn--secondary ${btnSizeClass}`} onClick={() => navigate("/login-form")}>
          Log In
        </button>
      </div>

      {/* Expand toggle */}
      <button className="size-toggle" onClick={() => setLarge(p => !p)}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          {large ? (
            /* Collapse / shrink icon */
            <>
              <path d="M8 1V8H1"  stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 21V14H21" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 8H14V1"  stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M1 14H8V21"  stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </>
          ) : (
            /* Expand icon */
            <>
              <path d="M1 8V1H8"   stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 14V21H14" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M14 1H21V8"  stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8 21H1V14"  stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </>
          )}
        </svg>
        <span className="size-toggle-label">{large ? "Smaller" : "Larger"}</span>
      </button>

    </div>
  );
}
