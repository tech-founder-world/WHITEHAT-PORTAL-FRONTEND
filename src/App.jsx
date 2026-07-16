import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ManageTeachers from './pages/ManageTeachers';
import ManageStudents from './pages/ManageStudents';
import MarkAttendance from './pages/MarkAttendance';
import AttendanceHistory from './pages/AttendanceHistory';
import Evaluations from './pages/Evaluations';
import Layout from './components/Layout';

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) return <Navigate to="/" replace />;
  return children;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/teacher" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<HomeRedirect />} />

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin">
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="teachers" element={<ManageTeachers />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="evaluations" element={<Evaluations />} />
            <Route path="attendance" element={<AttendanceHistory />} />
          </Route>

          {/* Teacher Routes */}
          <Route path="/teacher" element={
            <ProtectedRoute requiredRole="teacher">
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<TeacherDashboard />} />
            <Route path="mark-attendance" element={<MarkAttendance />} />
            <Route path="evaluations" element={<Evaluations />} />
            <Route path="students" element={<ManageStudents />} />
            <Route path="history" element={<AttendanceHistory />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
