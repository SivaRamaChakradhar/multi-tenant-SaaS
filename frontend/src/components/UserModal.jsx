import { useContext, useState } from "react";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";
import "./UserModal.css";

export default function UserModal({
  tenantId,
  user,
  onClose,
  onSaved,
}) {
    const { user: currentUser } = useContext(AuthContext);

    const [form, setForm] = useState({
      fullName: user?.full_name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "user",
      isActive: user?.is_active ?? true,
    });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🛡️ Safety guard
    const resolvedTenantId = tenantId || currentUser?.tenant?.id;
    if (!resolvedTenantId) return null;

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      console.log('🔵 UserModal submit - Current user:', currentUser);
      console.log('🔵 UserModal submit - Resolved tenantId:', resolvedTenantId);
      console.log('🔵 UserModal submit - User role:', currentUser?.role);

      if (user) {
        // UPDATE
          console.log('🟡 Updating existing user:', user.id);
          await axiosClient.put(`/users/${user.id}`, {
            fullName: form.fullName,
            role: form.role,
            isActive: form.isActive,
          });
      } else {
        // CREATE
          const payload = {
            fullName: form.fullName,
            email: form.email,
            password: form.password,
            role: form.role,
          };
          console.log('🟡 Creating new user with payload:', payload);
          console.log('🟡 API endpoint:', `/tenants/${resolvedTenantId}/users`);
          const response = await axiosClient.post(`/tenants/${resolvedTenantId}/users`, payload);
          console.log('✅ Create user response:', response.data);
      }

      onSaved();
      onClose();
    } catch (err) {
      console.error('❌ UserModal error:', err);
      console.error('❌ Error response data:', err.response?.data);
      setError(
        err.response?.data?.message || err.message || "Operation failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="user-modal-overlay">
      <div className="user-modal">
        <h3>{user ? "Edit User" : "Add New User"}</h3>

        {error && <p style={{ color: '#ff6b6b', fontSize: '0.9rem', margin: '0 0 8px', textAlign: 'center' }}>{error}</p>}

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#b8c2d9' }}>Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={form.fullName}
              onChange={(e) =>
                setForm({ ...form, fullName: e.target.value })
              }
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#b8c2d9' }}>Email Address</label>
            <input
              type="email"
              placeholder="user@example.com"
              value={form.email}
              onChange={(e) =>
                setForm({ ...form, email: e.target.value })
              }
              disabled={!!user}
              required
            />
          </div>

          {!user && (
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#b8c2d9' }}>Password</label>
              <input
                type="password"
                placeholder="Minimum 8 characters"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: '#b8c2d9' }}>Role</label>
            <select
              value={form.role}
              onChange={(e) =>
                setForm({ ...form, role: e.target.value })
              }
            >
              <option value="user">User</option>
              <option value="tenant_admin">Tenant Admin</option>
            </select>
          </div>

          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm({
                  ...form,
                  isActive: e.target.checked,
                })
              }
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '0.95rem' }}>Active User</span>
          </label>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <button type="submit" disabled={loading} style={{ flex: 1 }}>
              {loading ? "Saving..." : user ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{ flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
