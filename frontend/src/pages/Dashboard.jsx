import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosClient from "../api/axiosClient";
import { AuthContext } from "../context/AuthContext";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });

  const [recentProjects, setRecentProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [taskFilter, setTaskFilter] = useState("all");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const projectsRes = await axiosClient.get("/projects");
      const projects =
        projectsRes.data.data?.projects ||
        projectsRes.data.data?.rows ||
        projectsRes.data.data ||
        [];

      setRecentProjects(projects.slice(0, 5));

      const taskRequests = projects.map((p) =>
        axiosClient.get(`/projects/${p.id}/tasks?assignedTo=${user.id}`)
      );

      const taskResponses = await Promise.all(taskRequests);
      const allTasks = taskResponses.flatMap((r) =>
        Array.isArray(r.data.data) ? r.data.data : []
      );

      const completed = allTasks.filter(
        (t) => t.status === "completed"
      ).length;

      setMyTasks(allTasks);
      setStats({
        totalProjects: projects.length,
        totalTasks: allTasks.length,
        completedTasks: completed,
        pendingTasks: allTasks.length - completed,
      });
    } catch (err) {
      console.error("Dashboard load failed", err);
    }
  };

  const filteredTasks =
    taskFilter === "all"
      ? myTasks
      : myTasks.filter((t) => t.status === taskFilter);

  return (
    <div className="dashboard">
      <div className="dashboard-inner">
        <h2>Dashboard</h2>

        {/* ===== STATS ===== */}
        <div className="stats-grid">
          <StatCard title="Total Projects" value={stats.totalProjects} />
          <StatCard title="Total Tasks" value={stats.totalTasks} />
          <StatCard title="Completed Tasks" value={stats.completedTasks} />
          <StatCard title="Pending Tasks" value={stats.pendingTasks} />
        </div>

        {/* ===== LISTS ===== */}
        <div className="lists-wrapper">
          {/* Recent Projects */}
          <section>
            <h3>Recent Projects</h3>
            {recentProjects.length === 0 ? (
              <p className="empty-state">No projects found</p>
            ) : (
              <ul className="project-list">
                {recentProjects.map((project) => (
                  <li
                    key={project.id}
                    className="clickable"
                    onClick={() => project.id && navigate(`/projects/${project.id}`)}
                  >
                    <div className="list-header">
                      <strong>{project.name}</strong>
                      <span className={`badge status-${project.status}`}>
                        {project.status}
                      </span>
                    </div>
                    <div className="list-meta">
                      <span>Tasks: {project.taskCount || 0}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* My Tasks */}
          <section>
            <h3>My Tasks</h3>
            <select
              value={taskFilter}
              onChange={(e) => setTaskFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>

            {filteredTasks.length === 0 ? (
              <p className="empty-state">No tasks assigned</p>
            ) : (
              <ul className="task-list">
                {filteredTasks.map((task) => {
                  const normalizedStatus = (task.status || "").replace("-", "_");
                  return (
                    <li key={task.id}>
                      <div className="list-header">
                        <strong>{task.title}</strong>
                        <span
                          className={`task-item-status status-${normalizedStatus}`}
                        >
                          {normalizedStatus.replace("_", " ")}
                        </span>
                      </div>
                      <div className="list-meta">
                        <span>{task.project_name}</span>
                        <span className="priority">{task.priority}</span>
                        <span>{task.due_date || "No due date"}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="stat-card">
      <h4>{title}</h4>
      <p>{value}</p>
    </div>
  );
}
