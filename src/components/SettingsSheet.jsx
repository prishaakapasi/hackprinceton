import { useNavigate } from "react-router-dom";
import { usePatient } from "../context/PatientContext";
import "../screens/HomeScreen.css";

export default function SettingsSheet({ onClose }) {
  const navigate = useNavigate();
  const { medOn, setMedOn, theme, toggleTheme, logout } = usePatient();

  const handleLogout = () => {
    logout();
    onClose();
    navigate("/welcome");
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-sheet" onClick={e => e.stopPropagation()}>
        <div className="settings-handle" />
        <div className="settings-title">Settings</div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Medication Mode</span>
            <span className="settings-row-desc">
              {medOn ? "Larger buttons for tremor management" : "Standard button size"}
            </span>
          </div>
          <div
            onClick={() => setMedOn(!medOn)}
            className={`med-track ${medOn ? "med-track--on" : "med-track--off"}`}
          >
            <div className="med-thumb" style={{ left: medOn ? 23 : 3 }} />
          </div>
        </div>

        <div className="settings-divider" />

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">
              {theme === "dark" ? "Dark Mode" : "Light Mode"}
            </span>
            <span className="settings-row-desc">
              {theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            </span>
          </div>
          <button className="theme-toggle-btn" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="5" fill="var(--accent)" stroke="none"/>
                <line x1="12" y1="2"  x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22"/>
                <line x1="2"  y1="12" x2="5"  y2="12"/>
                <line x1="19" y1="12" x2="22" y2="12"/>
                <line x1="4.22"  y1="4.22"  x2="6.34"  y2="6.34" />
                <line x1="17.66" y1="17.66" x2="19.78" y2="19.78"/>
                <line x1="4.22"  y1="19.78" x2="6.34"  y2="17.66"/>
                <line x1="17.66" y1="6.34"  x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--accent)">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>

        <div className="settings-divider" />

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Account</span>
            <span className="settings-row-desc">Sign out of your account</span>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            Log out
          </button>
        </div>

        <button className="settings-close-btn" onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
