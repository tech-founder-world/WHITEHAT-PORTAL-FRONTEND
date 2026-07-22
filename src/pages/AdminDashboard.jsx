import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "../css/Dashboard.css";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    teachers: 0,
    students: 0,
    todayRecords: 0,
    projects: 0,
    placements: 0,
    batches: 0,
    activeBatches: 0,
    batchStudents: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [teachersRes, studentsRes, attendanceRes, projectsRes, placementsRes, batchesRes] =
          await Promise.all([
            api.get("/admin/teachers"),
            api.get("/students"),
            api.get(`/attendance?date=${new Date().toISOString().split("T")[0]}`),
            api.get("/projects"),
            api.get("/placement/all"),
            api.get("/batches"),
          ]);
        
        const batches = batchesRes.data || [];
        setStats({
          teachers: teachersRes.data.length,
          students: studentsRes.data.length,
          todayRecords: attendanceRes.data.length,
          projects: projectsRes.data.length,
          placements: placementsRes.data.length,
          batches: batches.length,
          activeBatches: batches.filter(b => b.status === "active").length,
          batchStudents: batches.reduce((sum, b) => sum + (b.students?.length || 0), 0),
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Welcome, {user?.name} 👋</h1>
        <p className="page-subtitle">{today}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card orange">
          <div className="stat-label">Total Teachers</div>
          <div className="stat-value">{loading ? "—" : stats.teachers}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{loading ? "—" : stats.students}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Today's Attendance</div>
          <div className="stat-value">{loading ? "—" : stats.todayRecords}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #667eea" }}>
          <div className="stat-label">Total Projects</div>
          <div className="stat-value">{loading ? "—" : stats.projects}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #f97316" }}>
          <div className="stat-label">Total Placements</div>
          <div className="stat-value">{loading ? "—" : stats.placements}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #8b5cf6" }}>
          <div className="stat-label">Total Batches</div>
          <div className="stat-value" style={{ color: "#8b5cf6" }}>
            {loading ? "—" : stats.batches}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #22c55e" }}>
          <div className="stat-label">Active Batches</div>
          <div className="stat-value" style={{ color: "#22c55e" }}>
            {loading ? "—" : stats.activeBatches}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div className="stat-label">Students in Batches</div>
          <div className="stat-value" style={{ color: "#f59e0b" }}>
            {loading ? "—" : stats.batchStudents}
          </div>
        </div>
      </div>

      <div className="quick-actions-grid">
        <Link to="/admin/teachers" className="quick-action-card">
          <div className="qa-icon">👩‍🏫</div>
          <div className="qa-text">
            <div className="qa-title">Manage Teachers</div>
            <div className="qa-desc">
              Add, edit, or remove teacher accounts and assign subjects
            </div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>

        <Link to="/admin/students" className="quick-action-card">
          <div className="qa-icon">🎓</div>
          <div className="qa-text">
            <div className="qa-title">Manage Students</div>
            <div className="qa-desc">
              Add or remove student records in the system
            </div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>

        <Link to="/admin/batches" className="quick-action-card">
          <div className="qa-icon">📚</div>
          <div className="qa-text">
            <div className="qa-title">Manage Batches</div>
            <div className="qa-desc">
              Create and manage batches, add students to batches
            </div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>

        <Link to="/admin/attendance" className="quick-action-card">
          <div className="qa-icon">📋</div>
          <div className="qa-text">
            <div className="qa-title">View Attendance Records</div>
            <div className="qa-desc">
              View and filter attendance history across all subjects
            </div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>

        <Link to="/admin/projects" className="quick-action-card">
          <div className="qa-icon">📁</div>
          <div className="qa-text">
            <div className="qa-title">Manage Projects</div>
            <div className="qa-desc">
              Create and manage all projects across the system
            </div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>

        <Link to="/admin/placements" className="quick-action-card">
          <div className="qa-icon">💼</div>
          <div className="qa-text">
            <div className="qa-title">Placements</div>
            <div className="qa-desc">
              Manage student placements and job opportunities
            </div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>
      </div>
    </div>
  );
}