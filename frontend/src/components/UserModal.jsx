import { useState } from "react";
import axiosClient from "../api/axiosClient";

export default function UserModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    email: user?.email || "",
    fullName: user?.full_name || "",
    password: "",
    role: user?.role || "user",
    isActive: user?.is_active ?? true,
  });

  const submit = async () => {
    if (!form.email || !form.fullName) return alert("Required fields");

    if (user) {
      await axiosClient.put(`/users/${user.id}`, form);
    } else {
      await axiosClient.post("/tenants/me/users", form);
    }

    onSaved();
    onClose();
  };

  return (
    <div className="modal">
      <h3>{user ? "Edit User" : "Add User"}</h3>

      <input placeholder="Email" value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })} />

      <input placeholder="Full Name" value={form.fullName}
        onChange={(e) => setForm({ ...form, fullName: e.target.value })} />

      {!user && (
        <input type="password" placeholder="Password"
          onChange={(e) => setForm({ ...form, password: e.target.value })} />
      )}

      <select value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}>
        <option value="user">User</option>
        <option value="tenant_admin">Tenant Admin</option>
      </select>

      <label>
        <input type="checkbox" checked={form.isActive}
          onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
        Active
      </label>

      <button onClick={submit}>Save</button>
      <button onClick={onClose}>Cancel</button>
    </div>
  );
}
