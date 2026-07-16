import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../css/Layout.css';

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: '⊞', end: true },
  { to: '/admin/teachers', label: 'Teachers', icon: '👩‍🏫' },
  { to: '/admin/students', label: 'Students', icon: '🎓' },
  { to: '/admin/evaluations', label: 'Evaluations', icon: '📝' },
  { to: '/admin/attendance', label: 'History & Stats', icon: '📊' },
];

const teacherLinks = [
  { to: '/teacher', label: 'Dashboard', icon: '⊞', end: true },
  { to: '/teacher/mark-attendance', label: 'Mark Attendance', icon: '✅' },
  { to: '/teacher/evaluations', label: 'Evaluations', icon: '📝' },
  { to: '/teacher/students', label: 'Students', icon: '🎓' },
  { to: '/teacher/history', label: 'History & Stats', icon: '📊' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const links = user?.role === 'admin' ? adminLinks : teacherLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">AMS</div>
          <div className="logo-text">
            <span className="logo-main">Attend</span>
            <span className="logo-sub">Manager</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'nav-link-active' : ''}`
              }
            >
              <span className="nav-icon">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-details">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            ⎋
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
