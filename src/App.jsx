import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/Login/ForgotPassword';
import ResetPassword from './pages/Login/ResetPassword';
import DashboardLayout from './components/layout/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Connectors from './pages/Connectors';
import Contacts from './pages/Contacts';
import Invoices from './pages/Invoices';
import Withdrawals from './pages/Withdrawals';
import Settings from './pages/Settings';
import UnderDevelopment from './pages/UnderDevelopment/UnderDevelopment';
import ProtectedRoute from './components/common/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';

/**
 * RootRedirect - Redirects to /dashboard if authenticated, or /login if not
 */
function RootRedirect() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />;
}


function PublicRoute({ children }) {
  const { isAuthenticated, logout } = useAuth();
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true;
      if (isAuthenticated) {
        logout();
      }
    }
  }, [isAuthenticated, logout]);

  return children;
}


function App() {
  return (
    <Routes>
      {/* Root Route */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <Login />
        </PublicRoute>
      } />
      <Route path="/org-signup" element={<Register />} />
      <Route path="/forgot-password" element={
        <PublicRoute>
          <ForgotPassword />
        </PublicRoute>
      } />
      <Route path="/reset-password" element={
        <PublicRoute>
          <ResetPassword />
        </PublicRoute>
      } />

      {/* Dashboard Layout Routes — Protected */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/connectors" element={<Connectors />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/payouts" element={<UnderDevelopment moduleName="Payouts" />} />
        <Route path="/withdrawals" element={<Withdrawals />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/calculator" element={<UnderDevelopment moduleName="Payout Calculator" />} />
        <Route path="/reports" element={<UnderDevelopment moduleName="Reports" />} />
      </Route>

      {/* Default redirect */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}

export default App;
