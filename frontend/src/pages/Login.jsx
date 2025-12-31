import { useContext, useState, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import { Link, useNavigate } from "react-router-dom";
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { user, login } = useContext(AuthContext);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const [form, setForm] = useState({
    email: "",
    password: "",
    tenantSubdomain: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const payload = {
        email: form.email,
        password: form.password,
      };

      // Only send tenantSubdomain if filled
      if (form.tenantSubdomain?.trim()) {
        payload.tenantSubdomain = form.tenantSubdomain.trim();
      }

      const res = await axiosClient.post("/auth/login", payload);

      if (res.data && res.data.data) {
        const token = res.data.data.token;
        const user = res.data.data.user;
        
        login({ user, token });
        navigate("/dashboard");
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-form-container">
        <div className="login-header">
          <h2>Welcome Back</h2>
          <p className="subtitle">Sign in to your workspace</p>
        </div>

        <form className="login-form" onSubmit={submit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="tenantSubdomain">Tenant Subdomain</label>
            <input
              id="tenantSubdomain"
              type="text"
              placeholder="e.g., demo (optional for super admin)"
              value={form.tenantSubdomain}
              onChange={(e) => setForm({ ...form, tenantSubdomain: e.target.value })}
            />
            <p className="tenant-hint">Leave blank if you're a super admin</p>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button className="btn-login" type="submit" disabled={loading}>
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <p className="register-link">
            Don't have an account? <Link to="/register">Create Workspace</Link>
          </p>
        </form>

        <div className="demo-credentials">
          <h4>Demo Credentials:</h4>
          <p><strong>Super Admin:</strong> superadmin@system.com / Admin@123</p>
          <p><strong>Tenant Admin:</strong> admin@demo.com / Demo@123 (subdomain: demo)</p>
          <p><strong>User:</strong> user1@demo.com / User@123 (subdomain: demo)</p>
        </div>
      </div>
    </div>
  );
}
