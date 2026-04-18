import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePatient } from "../context/PatientContext";
import "../styles/circles.css";
import "./SignUpScreen.css";

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
    navigate("/");
  };

  return (
    <div className="signup-screen">

      {/* Background circles */}
      <div className="circle circle-a" />
      <div className="circle circle-b" />
      <div className="circle circle-c" />
      <div className="circle circle-d" />

      {/* Back button */}
      <button className="back-btn" onClick={() => navigate("/")}>
        ← Back
      </button>

      {/* Logo */}
      <div className="signup-logo-wrap">
        <div className="signup-logo">synova</div>
        <div className="signup-subheading">Let's get you set up</div>
      </div>

      {/* Form */}
      <div className="signup-form">
        <div className="form-field">
          <label className="form-label">Your name</label>
          <input
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleContinue()}
            placeholder="e.g. Margaret"
            className={`form-input ${error ? "form-input--error" : "form-input--normal"}`}
          />
          {error && <div className="form-error">{error}</div>}
        </div>

        <button className="signup-btn" onClick={handleContinue}>
          Continue
        </button>

        <div className="signup-login-link">
          Already have an account?{" "}
          <span onClick={() => navigate("/login-form")}>Log in</span>
        </div>
      </div>

    </div>
  );
}
