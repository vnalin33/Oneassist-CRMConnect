import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const AuthContext = createContext(null);

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in ms

/**
 * AuthProvider - Global authentication context provider
 * Manages user session, token storage, and 30-min auto sign-out
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('crm-user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('crm-token'));
  const [isLoading, setIsLoading] = useState(false);
  const logoutTimerRef = useRef(null);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('crm-token');
    localStorage.removeItem('crm-user');
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
  }, []);

  // Start/reset the 30 minute auto sign-out timer
  const startLogoutTimer = useCallback(() => {
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    logoutTimerRef.current = setTimeout(() => {
      logout();
      localStorage.setItem('crm-session-expired', 'true');
      window.location.href = '/crmconnect/login';
    }, SESSION_TIMEOUT);
  }, [logout]);

  // Reset timer on user activity
  useEffect(() => {
    if (!token) return;

    const resetTimer = () => startLogoutTimer();
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimer));
    startLogoutTimer();

    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer));
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [token, startLogoutTimer]);

  // Handle server-side 401 token expired logout events
  useEffect(() => {
    const handleCrmLogout = () => {
      logout();
      localStorage.setItem('crm-session-expired', 'true');
      window.location.href = '/crmconnect/login';
    };
    window.addEventListener('crm-logout', handleCrmLogout);
    return () => window.removeEventListener('crm-logout', handleCrmLogout);
  }, [logout]);

  const login = useCallback((userData, authToken) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('crm-token', authToken);
    localStorage.setItem('crm-user', JSON.stringify(userData));
    startLogoutTimer();
  }, [startLogoutTimer]);

  const updateUser = useCallback((updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('crm-user', JSON.stringify(newUser));
  }, [user]);

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{ user, token, isLoading, isAuthenticated, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
