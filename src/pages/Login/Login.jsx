import { useLogin } from '../../hooks/useLogin';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from '../../components/common/Logo';
import './Login.css';

/**
 * Login Page - Responsive login form with light/dark theme support
 * Pixel-perfect match to One Assist Technologies CRMConnect design
 */
function Login() {
  const {
    formData,
    errors,
    isSubmitting,
    showPassword,
    apiError,
    handleChange,
    toggleShowPassword,
    handleSubmit,
  } = useLogin();

  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sessionExpired, setSessionExpired] = useState(() => {
    const expired = localStorage.getItem('crm-session-expired') === 'true';
    if (expired) {
      localStorage.removeItem('crm-session-expired');
    }
    return expired;
  });

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const success = await handleSubmit(e);
    if (success) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="login-page" id="login-page">
      {/* Background decorations - visible mainly on dark theme */}
      <div className="login-bg-decoration" aria-hidden="true">
        {/* Wave / curved mesh lines for dark theme */}
        <svg className="bg-wave bg-wave-1" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path d="M0,160L48,170.7C96,181,192,203,288,186.7C384,171,480,117,576,112C672,107,768,149,864,181.3C960,213,1056,235,1152,218.7C1248,203,1344,149,1392,122.7L1440,96" />
        </svg>
        <svg className="bg-wave bg-wave-2" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,234.7C672,245,768,235,864,208C960,181,1056,139,1152,128C1248,117,1344,139,1392,149.3L1440,160" />
        </svg>
        {/* Glowing dots */}
        <div className="bg-dots">
          <span className="dot dot-1"></span>
          <span className="dot dot-2"></span>
          <span className="dot dot-3"></span>
          <span className="dot dot-4"></span>
          <span className="dot dot-5"></span>
          <span className="dot dot-6"></span>
          <span className="dot dot-7"></span>
          <span className="dot dot-8"></span>
        </div>
        {/* Gradient orbs */}
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
      </div>

      {/* Theme toggle */}
      <button
        className="theme-toggle"
        id="theme-toggle-btn"
        onClick={toggleTheme}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        type="button"
      >
        {theme === 'light' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </button>

      {/* Login Card */}
      <div className="login-card" id="login-card">
        <div className="login-card-inner">
          {/* Logo Section */}
          <div className="login-logo-section">
            <Logo className="login-mode" />
          </div>

          {/* Welcome Text */}
          <div className="login-welcome">
            <h2 className="login-title" id="login-title">Welcome Back!</h2>
            <p className="login-subtitle">Sign in to continue to CRMConnect</p>
          </div>

          {/* API Error / Session Expired */}
          {sessionExpired && (
            <div className="login-error-banner" style={{ background: theme === 'dark' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(245, 158, 11, 0.06)', color: theme === 'dark' ? '#fbbf24' : '#b45309', border: `1px solid ${theme === 'dark' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(245, 158, 11, 0.12)'}` }} role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>Your session has expired. Please log in again.</span>
            </div>
          )}

          {apiError && (
            <div className="login-error-banner" id="login-error-banner" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{apiError}</span>
            </div>
          )}

          {/* Login Form */}
          <form className="login-form" id="login-form" onSubmit={handleFormSubmit} noValidate>
            {/* Email Field */}
            <div className={`form-group ${errors.email ? 'has-error' : ''}`}>
              <label htmlFor="login-email" className="form-label">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon input-icon-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <polyline points="22,4 12,13 2,4" />
                  </svg>
                </span>
                <input
                  type="email"
                  id="login-email"
                  className="form-input"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  autoComplete="email"
                  aria-describedby={errors.email ? 'email-error' : undefined}
                  aria-invalid={!!errors.email}
                />
              </div>
              {errors.email && (
                <span className="form-error" id="email-error" role="alert">{errors.email}</span>
              )}
            </div>

            {/* Password Field */}
            <div className={`form-group ${errors.password ? 'has-error' : ''}`}>
              <label htmlFor="login-password" className="form-label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon input-icon-left">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="login-password"
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  autoComplete="current-password"
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  className="input-icon input-icon-right password-toggle"
                  id="password-toggle-btn"
                  onClick={toggleShowPassword}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <span className="form-error" id="password-error" role="alert">{errors.password}</span>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="login-options">
              <label className="checkbox-label" htmlFor="remember-me">
                <input
                  type="checkbox"
                  id="remember-me"
                  checked={formData.rememberMe}
                  onChange={(e) => handleChange('rememberMe', e.target.checked)}
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">Remember me</span>
              </label>
              <a
                href="/forgot-password"
                className="forgot-password-link"
                id="forgot-password-link"
                onClick={(e) => { e.preventDefault(); navigate('/forgot-password'); }}
              >
                Forgot Password?
              </a>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              className="login-submit-btn"
              id="login-submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="btn-loading">
                  <span className="spinner"></span>
                  Signing In...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="login-divider">
            <span className="divider-line"></span>
            <span className="divider-text">or continue with</span>
            <span className="divider-line"></span>
          </div>

          {/* Sign Up Link */}
          <div className="login-signup">
            <span>Don't have an account?</span>
            <a
              href="/register"
              className="signup-link"
              id="signup-link"
              onClick={(e) => { e.preventDefault(); navigate('/register'); }}
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
