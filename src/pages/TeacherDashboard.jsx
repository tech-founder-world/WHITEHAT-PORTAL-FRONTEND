import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../css/Dashboard.css';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [todayCount, setTodayCount] = useState(null);
  const [studentCount, setStudentCount] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        const [attRes, stuRes] = await Promise.all([
          api.get(`/attendance?date=${today}`),
          api.get('/students'),
        ]);
        setTodayCount(attRes.data.length);
        setStudentCount(stuRes.data.length);
      } catch (err) { console.error(err); }
    };
    fetchStats();
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
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
          <div className="stat-value">{user?.subjects?.length || 0}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Students</div>
          <div className="stat-value">{studentCount ?? '—'}</div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">Today's Records</div>
          <div className="stat-value">{todayCount ?? '—'}</div>
        </div>
      </div>

      {user?.subjects?.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-label">Your Assigned Subjects</div>
          <div className="subject-tags">
            {user.subjects.map(s => (
              <span key={s} className="subject-tag">{s}</span>
            ))}
          </div>
        </div>
      )}

      <div className="quick-actions-grid">
        <Link to="/teacher/mark-attendance" className="quick-action-card">
          <div className="qa-icon">✅</div>
          <div className="qa-text">
            <div className="qa-title">Mark Attendance</div>
            <div className="qa-desc">Select a subject and date to mark student attendance</div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>

        <Link to="/teacher/students" className="quick-action-card">
          <div className="qa-icon">🎓</div>
          <div className="qa-text">
            <div className="qa-title">View Students</div>
            <div className="qa-desc">Browse the full list of students in the system</div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>

        <Link to="/teacher/history" className="quick-action-card">
          <div className="qa-icon">📊</div>
          <div className="qa-text">
            <div className="qa-title">History & Stats</div>
            <div className="qa-desc">View attendance records and percentage stats by subject</div>
          </div>
          <div className="qa-arrow">→</div>
        </Link>
      </div>
    </div>
  );
}
