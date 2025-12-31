import { useState, useEffect } from "react";
import axiosClient from "../api/axiosClient";
import "./TaskModal.css";

export default function TaskModal({ projectId, task, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "todo",
    priority: task?.priority || "medium",
    assignedTo: task?.assigned_to || "",
    dueDate: task?.due_date || "",
  });

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Get users from the current tenant
      const res = await axiosClient.get("/auth/me");
      const tenantId = res.data.data.tenant.id;
      const usersRes = await axiosClient.get(`/tenants/${tenantId}/users`);
      setUsers(usersRes.data.data?.users || usersRes.data.data || []);
    } catch (err) {
      console.error("Failed to load users", err);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);

      if (task) {
        // UPDATE
        await axiosClient.put(`/tasks/${task.id}`, {
          title: form.title,
          description: form.description,
          status: form.status,
          priority: form.priority,
          assignedTo: form.assignedTo || null,
          dueDate: form.dueDate || null,
        });
      } else {
        // CREATE
        await axiosClient.post(`/projects/${projectId}/tasks`, {
          title: form.title,
          description: form.description,
          status: form.status,
          priority: form.priority,
          assignedTo: form.assignedTo || null,
          dueDate: form.dueDate || null,
        });
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="task-modal-overlay" onClick={onClose}>
      <div className="task-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{task ? "Edit Task" : "Add New Task"}</h3>

        {error && (
          <p style={{ color: "#ff6b6b", fontSize: "0.9rem", textAlign: "center" }}>
            {error}
          </p>
        )}

        <form onSubmit={submit}>
          <div>
            <label>Task Title *</label>
            <input
              type="text"
              placeholder="Enter task title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label>Description</label>
            <textarea
              placeholder="Task description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div>
              <label>Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div>
            <label>Assign To</label>
            <select
              value={form.assignedTo}
              onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
            >
              <option value="">-- Unassigned --</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            />
          </div>

          <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
            <button type="submit" disabled={loading}>
              {loading ? "Saving..." : task ? "Update Task" : "Create Task"}
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
