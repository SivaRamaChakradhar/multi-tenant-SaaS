import { useState } from "react";
import axiosClient from "../api/axiosClient";
import { Link, useNavigate } from "react-router-dom";

import './Register.css'

export default function Register() {
  const navigate = useNavigate();
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

    if (!form.terms) return setError("Accept terms & conditions");

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
    <form onSubmit={submit}>
      <h2>Register Tenant</h2>

      <input name="organizationName" placeholder="Organization Name" onChange={handleChange} />
      <input name="subdomain" placeholder="Subdomain" onChange={handleChange} />
      <input name="adminEmail" placeholder="Admin Email" onChange={handleChange} />
      <input name="adminFullName" placeholder="Admin Full Name" onChange={handleChange} />
      <input type="password" name="password" placeholder="Password" onChange={handleChange} />
      <input type="password" name="confirmPassword" placeholder="Confirm Password" onChange={handleChange} />

      <label>
        <input type="checkbox" name="terms" onChange={handleChange} /> Accept Terms
      </label>

      {error && <p className="error">{error}</p>}


      <button disabled={loading}>{loading ? "Registering..." : "Register"}</button>

      <p>Already have an account? <Link to="/login">Login</Link></p>
    </form>
  );
}
