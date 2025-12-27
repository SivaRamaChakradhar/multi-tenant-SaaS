import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axiosClient from "../api/axiosClient";
import { Link, useNavigate } from "react-router-dom";

import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const [form, setForm] = useState({
    email: "",
    password: "",
    tenantSubdomain: "",
  });

  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await axiosClient.post("/auth/login", form);
      localStorage.setItem("token", res.data.data.token);
      setUser(res.data.data.user);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="login-wrapper">
      <form className="login-form" onSubmit={submit}>
        <h2>Login</h2>

        <input placeholder="Email" onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input type="password" placeholder="Password" onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <input placeholder="Tenant Subdomain" onChange={(e) => setForm({ ...form, tenantSubdomain: e.target.value })} />

        {error && <p style={{ color: "red" }}>{error}</p>}

        <button>Login</button>

        <p>No account? <Link to="/register">Register</Link></p>
      </form>
    </div>
  );
}
