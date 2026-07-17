import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import CounsellorDashboard from "./pages/CounsellorDashboard";
import ManageTeachers from "./pages/ManageTeachers";
import ManageCounsellors from "./pages/ManageCounsellors";
import ManageStudents from "./pages/ManageStudents";
import MarkAttendance from "./pages/MarkAttendance";
import AttendanceHistory from "./pages/AttendanceHistory";
import Evaluations from "./pages/Evaluations";
import Layout from "./components/Layout";
import PlacementPanel from "./components/PlacementPanel"; // ✅ Fixed import path

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole)
    return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === "admin") return <Navigate to="/admin" replace />;
  if (user.role === "counsellor") return <Navigate to="/counsellor" replace />;
  return <Navigate to="/teacher" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* Admin Routes - Layout as wrapper */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRole="admin">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="teachers" element={<ManageTeachers />} />
            <Route path="counsellors" element={<ManageCounsellors />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="evaluations" element={<Evaluations />} />
            <Route path="attendance" element={<AttendanceHistory />} />
            {/* ✅ PLACEMENT ROUTE - Nested under admin */}
            <Route path="placements" element={<PlacementPanel />} />
          </Route>

          {/* Teacher Routes */}
          <Route
            path="/teacher"
            element={
              <ProtectedRoute requiredRole="teacher">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<TeacherDashboard />} />
            <Route path="mark-attendance" element={<MarkAttendance />} />
            <Route path="evaluations" element={<Evaluations />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="history" element={<AttendanceHistory />} />
          </Route>

          {/* Counsellor Routes */}
          <Route
            path="/counsellor"
            element={
              <ProtectedRoute requiredRole="counsellor">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CounsellorDashboard />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="history" element={<AttendanceHistory />} />
            <Route path="evaluations" element={<Evaluations />} />
          </Route>

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}