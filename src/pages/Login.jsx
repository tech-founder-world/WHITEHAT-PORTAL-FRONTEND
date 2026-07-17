import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import "../css/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const slides = [
    {
      icon: "🎓",
      title: "Smart Attendance Tracking",
      description:
        "Real-time monitoring with advanced analytics and AI-powered insights",
      stats: "2.5M+ records processed",
    },
    {
      icon: "📊",
      title: "Comprehensive Reports",
      description:
        "Generate detailed attendance reports with visual data representation",
      stats: "98% accuracy rate",
    },
    {
      icon: "🚀",
      title: "Seamless Integration",
      description:
        "Connect with your existing systems effortlessly and securely",
      stats: "500+ institutions",
    },
  ];

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Check for saved credentials
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data } = await api.post("/auth/login", { email, password });

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      login(data.user, data.token);

      // Redirect based on role
      const redirectPath = data.user.role === "admin" ? "/admin" : "/teacher";
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid email or password. Please try again.",
      );
      // Clear password on error
      setPassword("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* ===== BACKGROUND ANIMATION ===== */}
      <div className="background-animation">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      {/* ===== PREMIUM INSTITUTE HEADER ===== */}
      <header className="institute-header">
        <div className="institute-logo">
          <div className="logo-icon-wrapper">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <rect width="36" height="36" rx="10" fill="#E8470A" />
              <path
                d="M18 8L8 14V28H28V14L18 8Z"
                stroke="white"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
              <path
                d="M13 22L18 27L23 22"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div className="logo-text">
            <span className="logo-main">White Hat</span>
            <span className="logo-sub">Coders</span>
          </div>
        </div>
        <div className="header-actions">
          <a href="#" className="header-link">
            Help
          </a>
          <span className="header-divider">|</span>
          <a href="#" className="header-link">
            Contact
          </a>
        </div>
      </header>

      <div className="login-container">
        {/* ===== LEFT PANEL - PREMIUM CAROUSEL ===== */}
        <div className="login-left">
          <div className="left-content">
            {/* Animated Carousel */}
            <div className="slides-wrapper">
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={`slide ${index === currentSlide ? "active" : ""}`}
                >
                  <div className="slide-card">
                    <div className="slide-icon-wrapper">
                      <span className="slide-icon">{slide.icon}</span>
                    </div>
                    <h3>{slide.title}</h3>
                    <p>{slide.description}</p>
                    <div className="slide-stats">
                      <span className="stat-pill">{slide.stats}</span>
                    </div>
                    <div className="slide-progress">
                      <div
                        className="slide-progress-bar"
                        style={{
                          width: index === currentSlide ? "100%" : "0%",
                          transition: "width 5s linear",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Slider Controls */}
            <div className="slider-controls">
              <div className="slider-dots">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentSlide ? "active" : ""}`}
                    onClick={() => setCurrentSlide(index)}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            {/* Slogan */}
            <div className="trust-badge">
              <span className="slogan-text">
                WhiteHead Coders — Built for excellence
              </span>
            </div>
          </div>
        </div>

        {/* ===== RIGHT PANEL - PREMIUM LOGIN FORM ===== */}
        <div className="login-right">
          <div className="login-card">
            <div className="login-card-header">
              <span className="greeting-badge">👋 Welcome back</span>
              <h2>Sign in to your account</h2>
              <p>Access your dashboard </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="login-error" role="alert">
                <span className="error-icon">⚠</span>
                <span>{error}</span>
                <button
                  className="error-close"
                  onClick={() => setError("")}
                  aria-label="Close error"
                >
                  ×
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              {/* Email Field */}
              <div className="form-group">
                <label className="form-label">
                  <span>Email Address</span>
                </label>
                <div className="input-group">
                  <input
                    className="form-control"
                    type="email"
                    placeholder="user address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label className="form-label">
                  <span>Password</span>
                </label>
                <div className="input-group">
                  <input
                    className="form-control"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="login-submit"
                disabled={loading || !email || !password}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                {loading ? (
                  <span className="loading-state">
                    <span className="spinner"></span>
                    Signing in...
                  </span>
                ) : (
                  <span className="submit-content">
                    Sign In
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill="none"
                      style={{
                        transform: isHovered
                          ? "translateX(4px)"
                          : "translateX(0)",
                        transition: "transform 0.3s ease",
                      }}
                    >
                      <path
                        d="M4.16675 10H15.8334M15.8334 10L11.6667 5.83333M15.8334 10L11.6667 14.1667"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="login-footer-links">
              <a href="#">Privacy Policy</a>
              <span className="footer-divider">•</span>
              <a href="#">Terms of Service</a>
              <span className="footer-divider">•</span>
              <span className="copyright">© 2026 WhiteHead Coders</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
