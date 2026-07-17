import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "../css/Dashboard.css";

export default function CounsellorDashboard() {
  const { user } = useAuth();
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [todayRecords, setTodayRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];

        // Fetch assigned students
        const studentsRes = await api.get(`/counsellor/students`);
        setAssignedStudents(studentsRes.data);

        // Fetch batches
        const batchesRes = await api.get("/batches");
        setBatches(batchesRes.data);

        // Fetch today's attendance for assigned students
        const attendanceRes = await api.get(`/attendance?date=${today}`);
        const records = attendanceRes.data;
        setTodayRecords(records.length);

        const present = records.filter((r) => r.status === "present").length;
        setStats({ present, absent: records.length - present });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
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
        <h1 className="page-title">Hello, {user?.name} 👋</h1>
        <p className="page-subtitle">{today}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card orange">
          <div className="stat-label">Assigned Students</div>
          <div className="stat-value">
            {loading ? "—" : assignedStudents.length}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: "4px solid #667eea" }}>
          <div className="stat-label">Total Batches</div>
          <div className="stat-value">{loading ? "—" : batches.length}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Today's Present</div>
          <div className="stat-value">{loading ? "—" : stats.present}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Today's Absent</div>
          <div className="stat-value">{loading ? "—" : stats.absent}</div>
        </div>
      </div>

      {user?.specialization && (
        <div className="card" style={{ marginBottom: "20px" }}>
          <div className="card-label">Specialization</div>
          <div className="subject-tags">
            <span className="subject-tag">{user.specialization}</span>
          </div>
        </div>
      )}

      <div className="quick-actions-grid">
        <Link to="/counsellor/students" className="quick-action-card">
          <div className="qa-icon">➕</div>
          <div className="qa-text">
            <div className="qa-title">Add Students</div>
            <div className="qa-desc">Create and manage student profiles</div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>

        <Link to="/counsellor/batches" className="quick-action-card">
          <div className="qa-icon">📚</div>
          <div className="qa-text">
            <div className="qa-title">Manage Batches</div>
            <div className="qa-desc">Create and organize student batches</div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>

        <Link to="/counsellor/history" className="quick-action-card">
          <div className="qa-icon">📊</div>
          <div className="qa-text">
            <div className="qa-title">History & Stats</div>
            <div className="qa-desc">
              View attendance records for your students
            </div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>

        <Link to="/counsellor/evaluations" className="quick-action-card">
          <div className="qa-icon">📝</div>
          <div className="qa-text">
            <div className="qa-title">Evaluations</div>
            <div className="qa-desc">Track and manage student evaluations</div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>
      </div>
    </div>
  );
}
