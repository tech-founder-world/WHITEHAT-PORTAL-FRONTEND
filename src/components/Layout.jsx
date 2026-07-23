import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect, useRef } from "react";
import "../css/Layout.css";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const sidebarRef = useRef(null);

  // Update clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle click outside on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        isMobileMenuOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target)
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobileMenuOpen]);

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    }
  };

  // Get navigation items based on role
  const getNavItems = () => {
    if (user?.role === "admin") {
      return [
        {
          path: "/admin",
          label: "Dashboard",
          icon: "📊",
          description: "Overview",
          exact: true,
        },
        {
          path: "/admin/teachers",
          label: "Teachers",
          icon: "👩‍🏫",
          description: "Manage teachers",
        },
        {
          path: "/admin/counsellors",
          label: "Counsellors",
          icon: "🧑‍🏫",
          description: "Manage counsellors",
        },
        {
          path: "/admin/students",
          label: "Students",
          icon: "🎓",
          description: "Manage students",
        },
        {
          path: "/admin/batches",
          label: "Batches",
          icon: "📚",
          description: "Manage batches",
        },
        {
          path: "/admin/projects",
          label: "Projects",
          icon: "📁",
          description: "Manage projects",
        },
        {
          path: "/admin/attendance",
          label: "Attendance",
          icon: "📋",
          description: "View records",
        },
        {
          path: "/admin/evaluations",
          label: "Evaluations",
          icon: "📝",
          description: "Manage evaluations",
        },
        {
          path: "/admin/placements",
          label: "Placements",
          icon: "💼",
          description: "Manage placements",
        },
      ];
    } else if (user?.role === "counsellor") {
      return [
        {
          path: "/counsellor",
          label: "Dashboard",
          icon: "📊",
          description: "Overview",
          exact: true,
        },
        {
          path: "/counsellor/batches",
          label: "Batches",
          icon: "📚",
          description: "Manage batches",
        },
        // {
        //   path: "/counsellor/track",
        //   label: "Student Tracker",
        //   icon: "📊",
        //   description: "Track & update students",
        // },
        {
          path: "/counsellor/students",
          label: "Students",
          icon: "🎓",
          description: "Assigned students",
        },
      ];
    } else {
      // Teacher
      return [
        {
          path: "/teacher",
          label: "Dashboard",
          icon: "📊",
          description: "Overview",
          exact: true,
        },
        {
          path: "/teacher/mark-attendance",
          label: "Mark Attendance",
          icon: "✅",
          description: "Mark today's attendance",
        },
        {
          path: "/teacher/students",
          label: "Students",
          icon: "🎓",
          description: "View students",
        },
        {
          path: "/teacher/history",
          label: "History",
          icon: "📋",
          description: "Attendance history",
        },
        {
          path: "/teacher/evaluations",
          label: "Evaluations",
          icon: "📝",
          description: "Manage evaluations",
        },
        {
          path: "/teacher/projects",
          label: "Projects",
          icon: "📁",
          description: "Manage projects",
        },
        {
          path: "/teacher/batches",
          label: "Batches",
          icon: "📚",
          description: "Manage batches",
        },
      ];
    }
  };

  const navItems = getNavItems();

  // Get role-specific color
  const getRoleColor = () => {
    if (user?.role === "admin") return "var(--primary)";
    if (user?.role === "counsellor") return "#667eea";
    return "#4CAF50";
  };

  const roleColor = getRoleColor();

  return (
    <div className={`layout ${isSidebarCollapsed ? "collapsed" : ""}`}>
      {/* Mobile Header */}
      <header className="mobile-header">
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <span className="hamburger"></span>
        </button>
        <div className="mobile-logo">
<<<<<<< HEAD
         
          <img src="../logo whc.png" alt="" />
=======
          <img src="/logo.jpeg" alt="Logo" className="mobile-logo-img" />
>>>>>>> 0f16ab5b23fc014182e1b22ade027488188ff282
        </div>
        <div className="mobile-user">
          <div className="mobile-avatar" style={{ background: roleColor }}>
            {user?.name?.[0] || "U"}
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}

      <aside
        ref={sidebarRef}
        className={`sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-logo">
<<<<<<< HEAD
            <div
              // className="logo-icon-wrapper"
              // style={{ background: roleColor }}
            >
             <img src="../logo whc.png" alt="" />
          </div>
=======
            <div className="logo-image-wrapper">
              <img src="/logo.jpeg" alt="Logo" className="sidebar-logo-img" />
            </div>
            {/* Removed text logo - only image */}
>>>>>>> 0f16ab5b23fc014182e1b22ade027488188ff282
          </div>

          <button
            className="sidebar-toggle"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            <span className="toggle-icon">
              {isSidebarCollapsed ? "→" : "←"}
            </span>
          </button>
        </div>

        {/* User Profile Card */}
        <div className="user-profile-card" style={{ borderColor: roleColor }}>
          <div
            className="user-profile-avatar"
            style={{ background: roleColor }}
          >
            {user?.name?.[0] || "U"}
          </div>
          <div className="user-profile-info">
            <div className="user-profile-name">{user?.name || "User"}</div>
            <div className="user-profile-role" style={{ color: roleColor }}>
              {user?.role === "admin" && "👑 Admin"}
              {user?.role === "teacher" && "👨‍🏫 Teacher"}
              {user?.role === "counsellor" && "🧑‍🏫 Counsellor"}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact || false}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "active" : ""}`
              }
              title={item.description}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {!isSidebarCollapsed && (
                <span className="nav-tooltip">{item.description}</span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="system-status">
            <span className="status-dot"></span>
            <span className="status-text">System Online</span>
          </div>
          <div className="clock-display">
            {currentTime.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>
          <button
            className="btn btn-danger"
            onClick={handleLogout}
            style={{ width: "100%" }}
          >
            <span className="logout-icon">🚪</span>
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </aside>

      <main className="main-content">
        <div className="content-wrapper">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
