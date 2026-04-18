import { useNavigate } from "react-router-dom";
import "./NavBar.css";

const NAV = [
  { label: "Talk",  icon: "/icons/nav-talk.png",  path: "/"      },
  { label: "Speak", icon: "/icons/nav-speak.png", path: "/speak" },
  { label: "Walk",  icon: "/icons/nav-walk.png",  path: "/walk"  },
];

export default function NavBar() {
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      {NAV.map(({ label, icon, path }) => {
        const active = window.location.pathname === path;
        return (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`navbar-btn ${active ? "navbar-btn--active" : ""}`}
          >
            <div className="navbar-icon-wrap">
              <img src={icon} alt={label} className="navbar-icon" />
            </div>
            <span className="navbar-label">{label}</span>
            {active && <div className="navbar-active-bar" />}
          </button>
        );
      })}
    </nav>
  );
}
