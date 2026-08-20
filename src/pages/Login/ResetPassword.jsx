import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { ENV } from '../../env';
import Logo from '../../components/common/Logo';
import './Login.css';

/**
 * Reset Password Page — validates token and sets a new password
 */
function ResetPassword() {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
      return;
    }

    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${ENV.API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Something went wrong.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page" id="reset-password-page">
      {/* Background decorations */}
      <div className="login-bg-decoration" aria-hidden="true">
        <svg className="bg-wave bg-wave-1" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path d="M0,160L48,170.7C96,181,192,203,288,186.7C384,171,480,117,576,112C672,107,768,149,864,181.3C960,213,1056,235,1152,218.7C1248,203,1344,149,1392,122.7L1440,96" />
        </svg>
        <svg className="bg-wave bg-wave-2" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path d="M0,224L48,213.3C96,203,192,181,288,186.7C384,192,480,224,576,234.7C672,245,768,235,864,208C960,181,1056,139,1152,128C1248,117,1344,139,1392,149.3L1440,160" />
        </svg>
        <div className="bg-dots">
          <span className="dot dot-1"></span>
          <span className="dot dot-2"></span>
          <span className="dot dot-3"></span>
          <span className="dot dot-4"></span>
          <span className="dot dot-5"></span>
          <span className="dot dot-6"></span>
        </div>
        <div className="bg-orb bg-orb-1"></div>
        <div className="bg-orb bg-orb-2"></div>
      </div>

      {/* Theme toggle */}
      <button className="theme-toggle" onClick={toggleTheme} type="button" aria-label="Toggle theme">
        {theme === 'light' ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
        )}
      </button>

      {/* Card */}
      <div className="login-card" id="reset-password-card">
        <div className="login-card-inner">
          <div className="login-logo-section">
            <Logo className="login-mode" />
          </div>

          <div className="login-welcome">
            <h2 className="login-title">Reset Password</h2>
            <p className="login-subtitle">Enter your new password below.</p>
          </div>

          {error && (
            <div className="login-error-banner" role="alert">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 0.875rem',
              borderRadius: '10px',
              marginBottom: '1rem',
              fontSize: '0.8rem',
              background: theme === 'dark' ? 'rgba(16, 185, 129, 0.1)' : '#ecfdf5',
              color: theme === 'dark' ? '#6ee7b7' : '#059669',
              border: `1px solid ${theme === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#a7f3d0'}`,
            }} role="status">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              <span>{message} Redirecting to login...</span>
            </div>
          )}

          {!message && (
            <form className="login-form" onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="new-password" className="form-label">New Password</label>
                <div className="input-wrapper">
                  <span className="input-icon input-icon-left">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="new-password"
                    className="form-input"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="input-icon input-icon-right password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password" className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon input-icon-left">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirm-password"
                    className="form-input"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="btn-loading">
                    <span className="spinner"></span>
                    Resetting...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>
          )}

          <div className="login-divider">
            <span className="divider-line"></span>
            <span className="divider-text">or</span>
            <span className="divider-line"></span>
          </div>

          <div className="login-signup" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <span>Back to</span>
            <a href="/login" className="signup-link" onClick={(e) => { e.preventDefault(); navigate('/login'); }}>
              Sign In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
