import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import UserModal from "../components/UserModal";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const fetchUsers = async () => {
    const res = await axiosClient.get("/tenants/me/users");
    setUsers(res.data.data || []);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const deleteUser = async (id) => {
    if (!window.confirm("Delete user?")) return;
    await axiosClient.delete(`/users/${id}`);
    fetchUsers();
  };

  return (
    <div>
      <h2>Users</h2>
      <button onClick={() => setShowModal(true)}>Add User</button>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.full_name}</td>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>{u.is_active ? "Active" : "Inactive"}</td>
              <td>
                <button onClick={() => {
                  setEditingUser(u);
                  setShowModal(true);
                }}>
                  Edit
                </button>
                <button onClick={() => deleteUser(u.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <UserModal
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
