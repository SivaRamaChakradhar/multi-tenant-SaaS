import { useState, useContext } from "react";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";
import "./ProjectModal.css";

export default function ProjectModal({ project, onClose, onSaved }) {
  const { user } = useContext(AuthContext);
  const [form, setForm] = useState({
    name: project?.name || "",
    description: project?.description || "",
    status: project?.status || "active",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!form.name) {
      setError("Project name is required");
      return;
    }

    // Prevent super admin from creating projects (they have no tenant)
    if (!project && user?.role === 'super_admin') {
      setError("Super admins cannot create projects. Please login as a tenant admin.");
      return;
    }

    try {
      setError("");
      setLoading(true);

      if (project) {
        await axiosClient.put(`/projects/${project.id}`, form);
      } else {
        await axiosClient.post("/projects", form);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save project");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h3>{project ? "Edit Project" : "Create Project"}</h3>

        {error && <p style={{ color: '#ff6b6b', fontSize: '0.9rem', marginBottom: '10px' }}>{error}</p>}

        <input
          placeholder="Project Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />

        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />

        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>

        <button onClick={submit} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </button>
        <button onClick={onClose} disabled={loading}>Cancel</button>
      </div>
    </div>
  );
}
