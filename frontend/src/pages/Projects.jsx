import { useContext, useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import ProjectModal from "../components/ProjectModal";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "./Projects.css";

export default function Projects() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [projects, setProjects] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  useEffect(() => {
    fetchProjects();
  }, [filter]);

  const fetchProjects = async () => {
    try {
      const res = await axiosClient.get(
        filter === "all" ? "/projects" : `/projects?status=${filter}`
      );

      const projectsData =
        res.data.data?.projects || res.data.data || [];

      setProjects(projectsData);
    } catch (err) {
      console.error("Failed to load projects", err);
    }
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    await axiosClient.delete(`/projects/${id}`);
    fetchProjects();
  };

  const filteredProjects = projects.filter((p) =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="projects-page">
      <div className="projects-header">
        <h2>Projects</h2>

        {user?.role !== 'super_admin' && (
          <button className="primary-btn" onClick={() => setShowModal(true)}>
            + New Project
          </button>
        )}
      </div>

      <div className="projects-toolbar">
        <input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {filteredProjects.length === 0 ? (
        <p className="empty-state">No projects found</p>
      ) : (
        <table className="projects-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Tasks</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProjects.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>
                  <span className={`badge status-${p.status}`}>
                    {p.status}
                  </span>
                </td>
                <td>{p.taskCount ?? p.task_count ?? 0}</td>
                <td>
                  {p.created_at
                    ? new Date(p.created_at).toLocaleDateString()
                    : "-"}
                </td>
                <td className="actions">
                  <button onClick={() => navigate(`/projects/${p.id}`)}>
                    View
                  </button>
                  <button
                    onClick={() => {
                      setEditingProject(p);
                      setShowModal(true);
                    }}
                  >
                    Edit
                  </button>
                  <button className="danger" onClick={() => deleteProject(p.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <ProjectModal
          project={editingProject}
          onClose={() => {
            setShowModal(false);
            setEditingProject(null);
          }}
          onSaved={fetchProjects}
        />
      )}
    </div>
  );
}
