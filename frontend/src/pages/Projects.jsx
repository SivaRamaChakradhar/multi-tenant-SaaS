import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import ProjectModal from "../components/ProjectModal";
import { useNavigate } from "react-router-dom";

export default function Projects() {
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
    const res = await axiosClient.get(
      filter === "all" ? "/projects" : `/projects?status=${filter}`
    );
    setProjects(res.data.data || []);
  };

  const deleteProject = async (id) => {
    if (!window.confirm("Delete this project?")) return;
    await axiosClient.delete(`/projects/${id}`);
    fetchProjects();
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h2>Projects</h2>

      <div className="toolbar">
        <button onClick={() => setShowModal(true)}>+ New Project</button>

        <input
          placeholder="Search projects"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {filteredProjects.length === 0 ? (
        <p>No projects found</p>
      ) : (
        <table>
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
                <td>{p.status}</td>
                <td>{p.task_count || 0}</td>
                <td>{new Date(p.created_at).toLocaleDateString()}</td>
                <td>
                  <button onClick={() => navigate(`/projects/${p.id}`)}>
                    View
                  </button>
                  <button onClick={() => {
                    setEditingProject(p);
                    setShowModal(true);
                  }}>
                    Edit
                  </button>
                  <button onClick={() => deleteProject(p.id)}>
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
