import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminProjects from "./pages/AdminProjects";
import AdminBatches from "./pages/AdminBatches";
import TeacherDashboard from "./pages/TeacherDashboard";
import CounsellorDashboard from "./pages/CounsellorDashboard";
import ManageTeachers from "./pages/ManageTeachers";
import ManageCounsellors from "./pages/ManageCounsellors";
import ManageStudents from "./pages/ManageStudents";
import MarkAttendance from "./pages/MarkAttendance";
import AttendanceHistory from "./pages/AttendanceHistory";
import Evaluations from "./pages/Evaluations";
import Layout from "./components/Layout";
import TeacherProjects from "./pages/TeacherProjects";
import CounsellorBatches from "./pages/CounsellorBatches";
import Placement from "./pages/Placement";
import StudentPlacementForm from "./components/StudentPlacementForm";
import CounsellorTrack from "./pages/CounsellorTrack";
import TeacherBatches from "./pages/TeacherBatches";

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
            <Route path="batches" element={<AdminBatches />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="evaluations" element={<Evaluations />} />
            <Route path="attendance" element={<AttendanceHistory />} />
            <Route path="placements" element={<Placement />} />
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
            <Route path="batches" element={<TeacherBatches />} />
            <Route path="projects" element={<TeacherProjects />} />
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
            <Route path="track" element={<CounsellorTrack />} />
            <Route path="placements" element={<Placement />} />
          </Route>

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
          <Route path="/apply/:formLink" element={<StudentPlacementForm />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
