import { useState, useContext, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import './Register.css';

export default function Register() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const [form, setForm] = useState({
    organizationName: "",
    subdomain: "",
    adminEmail: "",
    adminFullName: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword)
      return setError("Passwords do not match");

    if (!form.terms) return setError("Please accept terms & conditions");

    if (form.password.length < 8)
      return setError("Password must be at least 8 characters");

    try {
      setLoading(true);
      await axiosClient.post("/auth/register-tenant", {
        tenantName: form.organizationName,
        subdomain: form.subdomain,
        adminEmail: form.adminEmail,
        adminPassword: form.password,
        adminFullName: form.adminFullName,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Create Your Workspace</h2>
        <p className="subtitle">Start managing your projects in minutes</p>
        
        <form className="register-form" onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="organizationName">Organization Name *</label>
            <input
              id="organizationName"
              name="organizationName"
              type="text"
              placeholder="e.g., Acme Corporation"
              value={form.organizationName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subdomain">Subdomain *</label>
            <input
              id="subdomain"
              name="subdomain"
              type="text"
              placeholder="e.g., acme"
              value={form.subdomain}
              onChange={handleChange}
              required
            />
            {form.subdomain && (
              <div className="subdomain-preview">
                Your workspace: {form.subdomain}.yourapp.com
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="adminFullName">Your Full Name *</label>
            <input
              id="adminFullName"
              name="adminFullName"
              type="text"
              placeholder="e.g., John Doe"
              value={form.adminFullName}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="adminEmail">Email Address *</label>
            <input
              id="adminEmail"
              name="adminEmail"
              type="email"
              placeholder="e.g., john@acme.com"
              value={form.adminEmail}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={form.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>

          <div className="checkbox-group">
            <input
              id="terms"
              type="checkbox"
              name="terms"
              checked={form.terms}
              onChange={handleChange}
            />
            <label htmlFor="terms">
              I agree to the Terms of Service and Privacy Policy
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? "Creating Workspace..." : "Create Workspace"}
          </button>

          <p className="login-link">
            Already have an account? <Link to="/login">Sign In</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
