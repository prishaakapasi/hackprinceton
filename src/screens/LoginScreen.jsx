import { useNavigate } from "react-router-dom";
import "../styles/circles.css";
import "./LoginScreen.css";

export default function LoginScreen() {
  const navigate = useNavigate();

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
        <button className="login-btn login-btn--primary" onClick={() => navigate("/signup")}>
          Sign Up
        </button>
        <button className="login-btn login-btn--secondary" onClick={() => navigate("/login-form")}>
          Log In
        </button>
      </div>

      {/* Adjust button size */}
      <div className="login-adjust" onClick={() => alert("Button size adjustment coming soon!")}>
        <span className="login-adjust-label">Adjust button size</span>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M1 6V1H6" stroke="#b2f0e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15 10V15H10" stroke="#b2f0e8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

    </div>
  );
}
