import { useState } from "react";
import axiosClient from "../api/axiosClient";
import "./UserModal.css";

export default function UserModal({
  tenantId,
  user,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    password: "",
    role: user?.role || "user",
    is_active: user?.is_active ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🛡️ Safety guard
  if (!tenantId) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      if (user) {
        // UPDATE
        await axiosClient.put(`/users/${user.id}`, form);
      } else {
        // CREATE
        await axiosClient.post(
          `/tenants/${tenantId}/users`,
          form
        );
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message || "Operation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{user ? "Edit User" : "Add User"}</h3>

        {error && <p className="error">{error}</p>}

        <form onSubmit={submit}>
          <input
            type="text"
            placeholder="Full Name"
            value={form.full_name}
            onChange={(e) =>
              setForm({ ...form, full_name: e.target.value })
            }
            required
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            required
          />

          {!user && (
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) =>
                setForm({ ...form, password: e.target.value })
              }
              required
            />
          )}

          <select
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value })
            }
          >
            <option value="user">User</option>
            <option value="tenant_admin">Tenant Admin</option>
          </select>

          <label className="checkbox">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) =>
                setForm({
                  ...form,
                  is_active: e.target.checked,
                })
              }
            />
            Active
          </label>

          <div className="modal-actions">
            <button
              type="button"
              className="secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
