import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "../css/Dashboard.css";

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [todayCount, setTodayCount] = useState(null);
  const [studentCount, setStudentCount] = useState(null);
  const [assignedSubjects, setAssignedSubjects] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split("T")[0];

        // Fetch students assigned to this teacher
        const stuRes = await api.get("/students");
        setStudentCount(stuRes.data.length);

        // Get today's attendance for assigned students
        const attRes = await api.get(`/attendance?date=${today}`);
        setTodayCount(attRes.data.length);

        // Get assigned subjects
        setAssignedSubjects(user?.subjects || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, [user]);

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
          <div className="stat-label">Your Subjects</div>
          <div className="stat-value">{assignedSubjects.length || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Assigned Students</div>
          <div className="stat-value">{studentCount ?? "—"}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Today's Records</div>
          <div className="stat-value">{todayCount ?? "—"}</div>
        </div>
      </div>

      {assignedSubjects.length > 0 && (
        <div className="card" style={{ marginBottom: "20px" }}>
          <div className="card-label">Your Assigned Subjects</div>
          <div className="subject-tags">
            {assignedSubjects.map((s) => (
              <span key={s} className="subject-tag">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="quick-actions-grid">
        <Link to="/teacher/mark-attendance" className="quick-action-card">
          <div className="qa-icon">✅</div>
          <div className="qa-text">
            <div className="qa-title">Mark Attendance</div>
            <div className="qa-desc">
              Select a subject and date to mark student attendance
            </div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>

        <Link to="/teacher/students" className="quick-action-card">
          <div className="qa-icon">🎓</div>
          <div className="qa-text">
            <div className="qa-title">View Students</div>
            <div className="qa-desc">
              View your assigned students with their details
            </div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>

        <Link to="/teacher/history" className="quick-action-card">
          <div className="qa-icon">📊</div>
          <div className="qa-text">
            <div className="qa-title">History & Stats</div>
            <div className="qa-desc">
              View attendance records for your students
            </div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>

        <Link to="/teacher/batches" className="quick-action-card">
          <div className="qa-icon">📚</div>
          <div className="qa-text">
            <div className="qa-title">My Batches</div>
            <div className="qa-desc">
              Create and manage your teaching batches
            </div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>
      </div>
    </div>
  );
}
