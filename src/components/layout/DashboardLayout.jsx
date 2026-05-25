import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

const timeAgo = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

const getNotifIcon = (type) => {
  const icons = {
    INVOICE: {
      color: '#3B82F6',
      bg: 'rgba(59, 130, 246, 0.1)',
      svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
    },
    PAYOUT: {
      color: '#10B981',
      bg: 'rgba(16, 185, 129, 0.1)',
      svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
    },
    LEAD: {
      color: '#6C5CE7',
      bg: 'rgba(108, 92, 231, 0.1)',
      svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
    },
    SYSTEM: {
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.1)',
      svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
    }
  };
  return icons[type] || {
    color: '#8b8fa7',
    bg: 'rgba(139, 143, 167, 0.1)',
    svg: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  };
};

function DashboardLayout() {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/users/notifications');
      if (res.success) {
        setNotifications(res.notifications || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read_status: true })));
      await api.post('/users/notifications/read', {});
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      setNotifications(prev => prev.filter(n => n.id !== id));
      const deletedNotif = notifications.find(n => n.id === id);
      if (deletedNotif && !deletedNotif.read_status) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      await api.delete(`/users/notifications/${id}`);
    } catch (err) {
      console.error('Error deleting notification:', err);
      fetchNotifications();
    }
  };

  const handleClearAllNotifications = async () => {
    try {
      setNotifications([]);
      setUnreadCount(0);
      await api.delete('/users/notifications');
    } catch (err) {
      console.error('Error clearing all notifications:', err);
      fetchNotifications();
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '??';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  return (
    <div className="dashboard-layout" id="dashboard-layout">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-main">
        {/* ===== HEADER ===== */}
        <header className="dash-header" id="dashboard-header">
          <div className="dash-header-left">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
            </button>
          </div>
          <div className="dash-header-right">
            <button className="header-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {theme === 'light' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              )}
            </button>
            
            {/* Dynamic Notifications Container */}
            <div className="notif-container">
              <button 
                className="header-icon-btn notif-btn" 
                aria-label="Notifications"
                onClick={() => setNotifOpen(!notifOpen)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                {unreadCount > 0 && <span className="notif-dot">{unreadCount}</span>}
              </button>

              {notifOpen && (
                <>
                  <div className="notif-dropdown-overlay" onClick={() => setNotifOpen(false)} />
                  <div className="notif-dropdown">
                    <div className="notif-dropdown-header">
                      <h4 className="notif-dropdown-title">Notifications</h4>
                      <div className="notif-header-actions">
                        {unreadCount > 0 && (
                          <button className="notif-mark-read-btn" onClick={handleMarkAllRead}>
                            Mark read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button className="notif-clear-all-btn" onClick={handleClearAllNotifications}>
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="notif-list">
                      {notifications.length === 0 ? (
                        <div className="notif-empty">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ opacity: 0.5 }}>
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                          </svg>
                          <span className="notif-empty-text">No notifications yet</span>
                        </div>
                      ) : (
                        notifications.map((notif) => {
                          const iconCfg = getNotifIcon(notif.type);
                          return (
                            <div 
                              key={notif.id} 
                              className={`notif-item ${!notif.read_status ? 'notif-item-unread' : ''}`}
                            >
                              <div 
                                className="notif-item-icon-wrapper" 
                                style={{ background: iconCfg.bg, color: iconCfg.color }}
                              >
                                {iconCfg.svg}
                              </div>
                              <div className="notif-item-content">
                                <h5 className="notif-item-title">{notif.title}</h5>
                                <p className="notif-item-body">{notif.body}</p>
                                <span className="notif-item-time">{timeAgo(notif.created_at)}</span>
                              </div>
                              <button 
                                className="notif-delete-btn" 
                                title="Delete notification"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteNotification(notif.id);
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                  <line x1="10" y1="11" x2="10" y2="17" />
                                  <line x1="14" y1="11" x2="14" y2="17" />
                                </svg>
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div 
              className="header-avatar" 
              onClick={handleLogout} 
              title={`Logged in as ${user?.name || 'User'}. Click to Logout.`}
              style={{ cursor: 'pointer' }}
            >
              <span>{getInitials(user?.name)}</span>
            </div>
          </div>
        </header>

        {/* ===== CONTENT ===== */}
        <main className="dash-content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
