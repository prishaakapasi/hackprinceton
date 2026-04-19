import { useNavigate } from "react-router-dom";
import "./NavBar.css";

const NAV = [
  { label: "Record", icon: "/icons/nav-voice.png", path: "/speak" },
  { label: "Walk", icon: "/icons/nav-walk.png", path: "/walk" },
];

export default function NavBar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      {NAV.map(({ label, icon, path }) => {
        const active = window.location.pathname === path;

        return (
          <button
            key={path}
            type="button"
            onClick={() => navigate(path)}
            className={`navbar-btn ${active ? "navbar-btn--active" : ""}`}
          >
            <img src={icon} alt="" className="navbar-icon" />
            <span>{label}</span>
            {active && <div className="navbar-indicator" />}
          </button>
        );
      })}
    </nav>
  );
}
