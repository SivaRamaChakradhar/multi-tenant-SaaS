import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import './Navbar.css';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <b>Multi-Tenant SaaS</b>
      </div>

      {/* Hamburger Menu Icon */}
      <div className="nav-toggle" onClick={() => setIsOpen(!isOpen)}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>

      <div className={`nav-links ${isOpen ? "open" : ""}`}>
        <Link to="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
        <Link to="/projects" onClick={() => setIsOpen(false)}>Projects</Link>
        {user.role === "tenant_admin" && (
          <Link to="/users" onClick={() => setIsOpen(false)}>Users</Link>
        )}

        <div className="nav-user">
          <span className="user-info">{user.fullName} <small>({user.role})</small></span>
          <button className="logout-btn" onClick={logout}>Logout</button>
        </div>
      </div>
    </nav>
  );
}