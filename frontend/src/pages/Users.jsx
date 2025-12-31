import { useContext, useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import UserModal from "../components/UserModal";
import { AuthContext } from "../context/AuthContext";
import "./Users.css";

export default function Users() {
  const { user } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    if (user?.tenant?.id) {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
  try {
    const res = await axiosClient.get(
      `/tenants/${user.tenant.id}/users`
    );

    const usersData =
      res.data.data?.users ||
      res.data.data ||
      [];

    setUsers(usersData);
  } catch (err) {
    console.error("Failed to load users", err);
    setUsers([]); // prevent crash
  }
};


  const deleteUser = async (id) => {
    if (!window.confirm("Delete user?")) return;
    await axiosClient.delete(`/users/${id}`);
    fetchUsers();
  };

  return (
    <div className="users-page">
      <div className="users-header">
        <h2>Users</h2>

        {user.role === "tenant_admin" && (
          <button
            className="primary-btn"
            onClick={() => setShowModal(true)}
          >
            + Add User
          </button>
        )}
      </div>

      {users.length === 0 ? (
        <p className="empty-state">No users found</p>
      ) : (
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              {user.role === "tenant_admin" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.full_name}</td>
                <td>{u.email}</td>
                <td>
                  <span className={`badge role-${u.role}`}>
                    {u.role}
                  </span>
                </td>
                <td>
                  <span className={u.is_active ? "active" : "inactive"}>
                    {u.is_active ? "Active" : "Inactive"}
                  </span>
                </td>

                {user.role === "tenant_admin" && (
                  <td className="actions">
                    <button
                      onClick={() => {
                        setEditingUser(u);
                        setShowModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="danger"
                      onClick={() => deleteUser(u.id)}
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <UserModal
          tenantId={user?.tenant?.id}
          user={editingUser}
          onClose={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          onSaved={fetchUsers}
        />
      )}
    </div>
  );
}
