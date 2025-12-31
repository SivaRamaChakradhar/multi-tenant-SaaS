import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
import TaskModal from "../components/TaskModal";
import "./ProjectDetails.css";

export default function ProjectDetails() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    const p = await axiosClient.get(`/projects/${projectId}`);
    const t = await axiosClient.get(`/projects/${projectId}/tasks`);

    setProject(p.data.data);
    setTasks(t.data.data || []);
  };

  const updateStatus = async (taskId, status) => {
    await axiosClient.patch(`/tasks/${taskId}/status`, { status });
    loadData();
  };

  const deleteTask = async (id) => {
    if (!window.confirm("Delete task?")) return;
    await axiosClient.delete(`/tasks/${id}`);
    loadData();
  };

  if (!project) return <p className="loading">Loading...</p>;

  return (
    <div className="project-details-page">
      {/* HEADER */}
      <div className="project-header">
        <div>
          <h2>{project.name}</h2>
          <p className="description">{project.description || "No description"}</p>
        </div>

        <span className={`status-badge status-${project.status}`}>
          {project.status}
        </span>
      </div>

      {/* TASKS */}
      <div className="tasks-section">
        <div className="tasks-header">
          <h3>Tasks</h3>
          <button className="primary-btn" onClick={() => setShowModal(true)}>
            + Add Task
          </button>
        </div>

        {tasks.length === 0 ? (
          <p className="empty-state">No tasks available</p>
        ) : (
          <div className="table-wrapper">
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assigned</th>
                  <th>Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>
                      <span className={`task-badge status-${t.status}`}>
                        {t.status}
                      </span>
                    </td>
                    <td>
                      <span className={`task-badge priority-${t.priority}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td>{t.assignee_name || "-"}</td>
                    <td>{t.due_date || "N/A"}</td>
                    <td className="actions">
                      {t.status !== "completed" && (
                        <button
                          className="btn-success"
                          onClick={() => updateStatus(t.id, "completed")}
                        >
                          Complete
                        </button>
                      )}
                      <button
                        className="btn-edit"
                        onClick={() => {
                          setEditingTask(t);
                          setShowModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => deleteTask(t.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <TaskModal
          projectId={projectId}
          task={editingTask}
          onClose={() => {
            setShowModal(false);
            setEditingTask(null);
          }}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
