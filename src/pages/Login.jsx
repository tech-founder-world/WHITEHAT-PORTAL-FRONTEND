import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import '../css/Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data.user, data.token);
      navigate(data.user.role === 'admin' ? '/admin' : '/teacher');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-branding">
          <div className="login-logo">
            <div className="login-logo-icon">AMS</div>
            <div className="login-logo-text">
              <span className="login-logo-main">Attendance</span>
              <span className="login-logo-sub">Management System</span>
            </div>
          </div>
          <div className="login-tagline">
            <h1>Track. Manage.<br /><span>Succeed.</span></h1>
            <p>Streamline attendance tracking for your institution with a fast, simple, and reliable system.</p>
          </div>
          <div className="login-features">
            <div className="login-feature">✅ Role-based access for Admin & Teachers</div>
            <div className="login-feature">📋 Mark & edit attendance in seconds</div>
            <div className="login-feature">📊 Attendance stats & history</div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Welcome back</h2>
            <p>Sign in to your account to continue</p>
          </div>

          {error && (
            <div className="login-error">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-control"
                type="email"
                placeholder="you@school.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-control"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary login-submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="login-hint">
            Default admin: <strong>admin@school.com</strong> / <strong>admin123</strong><br />
            (Run <code>POST /api/auth/seed-admin</code> to create)
          </p>
        </div>
      </div>
    </div>
  );
}
