import { useContext, useState } from "react";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="app-header">
      <div className="nav-container">
        {/* BRAND */}
        <div className="nav-brand">
          <span className="logo-dot" />
          <span className="logo-text">Multi-Tenant SaaS</span>
        </div>

        {/* DESKTOP LINKS */}
        <nav className="nav-links desktop">
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/projects">Projects</NavLink>
          {user.role === "tenant_admin" && (
            <NavLink to="/users">Users</NavLink>
          )}
        </nav>

        {/* USER ACTIONS */}
        <div className="nav-actions desktop">
          <span className="nav-user">
            {user.fullName}
            <small>{user.role}</small>
          </span>
          <button className="logout-btn" onClick={logout}>
            Logout
          </button>
        </div>

        {/* MOBILE TOGGLE */}
        <button
          className="menu-toggle"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="mobile-menu">
          <NavLink to="/dashboard" onClick={() => setOpen(false)}>
            Dashboard
          </NavLink>
          <NavLink to="/projects" onClick={() => setOpen(false)}>
            Projects
          </NavLink>
          {user.role === "tenant_admin" && (
            <NavLink to="/users" onClick={() => setOpen(false)}>
              Users
            </NavLink>
          )}

          <div className="mobile-footer">
            <span>
              {user.fullName} <small>({user.role})</small>
            </span>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      )}
    </header>
  );
}
