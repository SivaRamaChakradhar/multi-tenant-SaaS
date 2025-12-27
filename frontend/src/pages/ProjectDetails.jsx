import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";

export default function ProjectDetails() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);

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

  if (!project) return <p>Loading...</p>;

  return (
    <div>
      <h2>{project.name}</h2>
      <p>{project.description}</p>

      <h3>Tasks</h3>

      {tasks.length === 0 ? (
        <p>No tasks</p>
      ) : (
        <table>
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
                <td>{t.status}</td>
                <td>{t.priority}</td>
                <td>{t.assignee_name}</td>
                <td>{t.due_date}</td>
                <td>
                  <button onClick={() => updateStatus(t.id, "completed")}>
                    Complete
                  </button>
                  <button onClick={() => deleteTask(t.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
