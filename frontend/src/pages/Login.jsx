import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import { Link, useNavigate } from "react-router-dom";
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

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

      console.log('Sending login request with payload:', payload);
      const res = await axiosClient.post("/auth/login", payload);
      console.log('Full login response:', JSON.stringify(res.data, null, 2));
      console.log('Response structure check:', {
        hasData: !!res.data,
        hasDataData: !!res.data?.data,
        hasToken: !!res.data?.data?.token,
        hasUser: !!res.data?.data?.user
      });

      if (res.data && res.data.data) {
        const token = res.data.data.token;
        const user = res.data.data.user;
        
        console.log('Token extracted:', token);
        console.log('User extracted:', user);
        
        try {
          console.log('About to call login function...');
          login({ user, token });
          console.log('Login function called successfully');
        } catch (loginErr) {
          console.error('Error calling login function:', loginErr);
          throw loginErr;
        }
        
        try {
          console.log('Navigating to dashboard...');
          navigate("/dashboard");
          console.log('Navigate called successfully');
        } catch (navErr) {
          console.error('Error navigating:', navErr);
          throw navErr;
        }
      } else {
        console.error('Response structure invalid:', res.data);
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.error('Login error:', err);
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
