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
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const res = await axiosClient.get("/projects");
      const projects = res.data.data?.projects || [];

      setRecentProjects(projects.slice(0, 5));

      const taskRequests = projects.map((p) =>
        axiosClient.get(`/projects/${p.id}/tasks?assignedTo=${user.id}`)
      );

      const taskResponses = await Promise.all(taskRequests);
      const tasks = taskResponses.flatMap(r => r.data.data || []);

      const completed = tasks.filter(t => t.status === "completed").length;

      setMyTasks(tasks);
      setStats({
        totalProjects: projects.length,
        totalTasks: tasks.length,
        completedTasks: completed,
        pendingTasks: tasks.length - completed,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const visibleTasks =
    taskFilter === "all"
      ? myTasks
      : myTasks.filter(t => t.status === taskFilter);

  return (
    <div className="dashboard-root">
      <header className="dashboard-header">
        <h1>Welcome, {user.fullName}</h1>
        <p>Here’s what’s happening in your workspace</p>
      </header>

      {/* STATS */}
      <section className="stats-section">
        <Stat label="Projects" value={stats.totalProjects} />
        <Stat label="Total Tasks" value={stats.totalTasks} />
        <Stat label="Completed" value={stats.completedTasks} />
        <Stat label="Pending" value={stats.pendingTasks} />
      </section>

      {/* CONTENT */}
      <section className="dashboard-content">
        {/* PROJECTS */}
        <div className="panel">
          <div className="panel-header">
            <h3>Recent Projects</h3>
          </div>

          {recentProjects.length === 0 ? (
            <Empty text="No projects yet" />
          ) : (
            recentProjects.map(p => (
              <div
                key={p.id}
                className="project-card"
                onClick={() => navigate(`/projects/${p.id}`)}
              >
                <div>
                  <strong>{p.name}</strong>
                  <span className={`status ${p.status}`}>
                    {p.status}
                  </span>
                </div>
                <small>{p.task_count || 0} tasks</small>
              </div>
            ))
          )}
        </div>

        {/* TASKS */}
        <div className="panel">
          <div className="panel-header">
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
          </div>

          {visibleTasks.length === 0 ? (
            <Empty text="No tasks assigned" />
          ) : (
            visibleTasks.map(t => (
              <div key={t.id} className="task-row">
                <div>
                  <strong>{t.title}</strong>
                  <small>{t.project_name}</small>
                </div>
                <span className={`status ${t.status}`}>
                  {t.status.replace("_", " ")}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-tile">
      <span>{label}</span>
      <h2>{value}</h2>
    </div>
  );
}

function Empty({ text }) {
  return <div className="empty">{text}</div>;
}
