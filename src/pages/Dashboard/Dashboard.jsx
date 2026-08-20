import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import api from '../../services/api';
import './Dashboard.css';

/* ==========================================
   ICON COMPONENTS
   ========================================== */
function StatIcon({ type, className }) {
  const icons = {
    connects: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    active: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
    pending: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    monthly: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    payout: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    conversions: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="20 6 9 17 4 12"/></svg>,
  };
  return <span className={className}>{icons[type]}</span>;
}

/* ==========================================
   CUSTOM TOOLTIP
   ========================================== */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">Day {label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="chart-tooltip-value">
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

function Dashboard() {
  const { theme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const monthInputRef = useRef(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trigger, setTrigger] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
  });

  useEffect(() => {
    let active = true;
    const fetchDashboardStats = async () => {
      try {
        const res = await api.get(`/dashboard/stats?month=${selectedMonth}`);
        if (!active) return;
        if (res.success) {
          setData(res.data);
          setError(null);
        } else {
          setError(res.message || 'Failed to fetch dashboard data');
        }
      } catch (err) {
        if (!active) return;
        console.error('Error fetching dashboard stats:', err);
        setError(err.message || 'Connection to server failed. Please try again.');
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDashboardStats();
    return () => {
      active = false;
    };
  }, [trigger, selectedMonth]);

  if (loading) {
    return (
      <div className="dash-loading" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem'
      }}>
        <div className="spinner" style={{
          width: 48,
          height: 48,
          border: '4px solid rgba(108, 92, 231, 0.1)',
          borderTopColor: '#6C5CE7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }}></div>
        <p style={{ color: '#888', fontWeight: 500 }}>Fetching dashboard metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dash-error" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        gap: '1rem',
        textAlign: 'center',
        padding: '2rem'
      }}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <h3 style={{ margin: 0, color: '#ff4d4d' }}>Unable to Load Dashboard</h3>
        <p style={{ color: '#6b7280', maxWidth: 400, margin: 0 }}>{error}</p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <button 
            onClick={() => {
              setLoading(true);
              setTrigger(prev => prev + 1);
            }} 
            style={{
              padding: '8px 16px',
              backgroundColor: '#6C5CE7',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#5b4cc4'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#6C5CE7'}
          >
            Retry Connection
          </button>
          <button 
            onClick={() => {
              logout();
              navigate('/login');
            }} 
            style={{
              padding: '8px 16px',
              backgroundColor: '#EF4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#dc2626'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#EF4444'}
          >
            Sign Out / Switch Account
          </button>
        </div>
      </div>
    );
  }

  const { stats, lineData, pieData, activities, topConnectors, invoiceStats, payoutOverview } = data;

  const maxConnects = Math.max(...topConnectors.map(c => c.connects), 1);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const STATS_CARDS = [
    { id: 'total', label: 'Total Connects', value: stats.totalConnects.toLocaleString(), change: stats.connectsChange, positive: !stats.connectsChange.startsWith('-'), color: '#6C5CE7', icon: 'connects' },
    { id: 'active', label: 'Active Contacts', value: stats.activeContacts.toLocaleString(), change: '', positive: true, color: '#10B981', icon: 'active' },
    { id: 'pending', label: 'Pending Payouts', value: stats.pendingPayoutRequests.toLocaleString(), change: '', positive: true, color: '#F59E0B', icon: 'pending' },
    { id: 'monthly', label: 'Monthly Connects', value: stats.monthlyConnects.toLocaleString(), change: '', positive: true, color: '#3B82F6', icon: 'monthly' },
    { id: 'payout', label: 'Month Payout', value: formatCurrency(stats.monthlyPayout), change: '', positive: true, color: '#8B5CF6', icon: 'payout' },
    { id: 'conversions', label: 'Conversions', value: stats.conversions.toLocaleString(), change: '', positive: true, color: '#06B6D4', icon: 'conversions' },
  ];

  return (
    <>
      {/* Page title */}
      <div className="dash-page-title">
        <div className="dash-page-title-left">
          <h1>Dashboard</h1>
          <p>Welcome back, Admin! Here's what's happening today.</p>
        </div>
        <div className="dash-month-picker" onClick={() => monthInputRef.current?.showPicker?.()}>
          <div className="picker-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <input 
            ref={monthInputRef}
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
            className="dash-month-input" 
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="stats-grid">
        {STATS_CARDS.map((stat) => (
          <div className="stat-card" key={stat.id} id={`stat-${stat.id}`}>
            <div className="stat-card-top">
              <div className="stat-card-info">
                <span className="stat-card-label">{stat.label}</span>
                <span className="stat-card-value">{stat.value}</span>
                {stat.change && (
                  <span className={`stat-card-change ${stat.positive ? 'positive' : 'negative'}`}>
                    {stat.positive ? '↑' : '↓'} {stat.change}
                    <span className="stat-card-vs">vs last month</span>
                  </span>
                )}
              </div>
              <StatIcon type={stat.icon} className="stat-card-icon" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="charts-grid">
        {/* Line Chart */}
        <div className="dash-card chart-card" id="connect-growth-chart">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Connect Growth (Daily)</h3>
          </div>
          <div className="chart-legend">
            <span className="legend-item"><span className="legend-dot" style={{ background: '#6C5CE7' }}></span>This Month</span>
            <span className="legend-item"><span className="legend-dot" style={{ background: '#9ca3af' }}></span>Last Month</span>
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? 'rgba(124,108,240,0.08)' : '#f0f0f5'} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: theme === 'dark' ? '#6b7280' : '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: theme === 'dark' ? '#6b7280' : '#9ca3af' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="thisMonth" stroke="#6C5CE7" strokeWidth={2.5} dot={false} name="This Month" />
                <Line type="monotone" dataKey="lastMonth" stroke="#9ca3af" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Last Month" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="dash-card donut-card" id="connect-status-chart">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Connect Status</h3>
          </div>
          <div className="donut-wrapper">
            <div className="donut-chart-container">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" startAngle={90} endAngle={-270}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} stroke="none" />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-center">
                <span className="donut-center-value">{stats.totalConnects}</span>
                <span className="donut-center-label">Total</span>
              </div>
            </div>
            <div className="donut-legend">
              {pieData.map((d, i) => (
                <div className="donut-legend-item" key={i}>
                  <span className="donut-legend-dot" style={{ background: d.color }}></span>
                  <span className="donut-legend-name">{d.name}</span>
                  <span className="donut-legend-stat">{d.value.toLocaleString()} ({d.pct})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="dash-card activities-card" id="recent-activities">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Recent Activities</h3>
          </div>
          <div className="activities-table-wrapper">
            <table className="activities-table">
              <thead>
                <tr>
                  <th>Connector</th>
                  <th>Contact</th>
                  <th>Activity</th>
                  <th>Date</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '1.5rem', color: '#888' }}>
                      No recent activities found
                    </td>
                  </tr>
                ) : (
                  activities.map((a, i) => (
                    <tr key={i}>
                      <td>
                        <div className="activity-user">
                          <div className="activity-avatar" style={{ background: pieData[i % pieData.length]?.color || '#6C5CE7' }}>
                            {a.connector ? a.connector[0].toUpperCase() : '?'}
                          </div>
                          {a.connector || 'Unknown Connector'}
                        </div>
                      </td>
                      <td>{a.contact}</td>
                      <td><span className="activity-badge" style={{ color: a.actColor, background: a.actBg }}>{a.activity}</span></td>
                      <td className="activity-date">{formatDate(a.date)}</td>
                      <td className="activity-amount">{formatCurrency(a.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="bottom-grid">
        {/* Top Connectors */}
        <div className="dash-card" id="top-connectors">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Top Connectors</h3>
          </div>
          <div className="connectors-list">
            {topConnectors.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No connector connections recorded yet</p>
            ) : (
              topConnectors.map((c, idx) => (
                <div className="connector-row" key={c.rank || idx}>
                  <span className="connector-rank">{c.rank}</span>
                  <div className="connector-avatar" style={{ background: pieData[(idx) % pieData.length]?.color || '#6C5CE7' }}>
                    {c.name ? c.name[0].toUpperCase() : '?'}
                  </div>
                  <div className="connector-info">
                    <span className="connector-name">{c.name}</span>
                    <span className="connector-connects">{c.connects} Connects</span>
                  </div>
                  <div className="connector-bar-wrapper">
                    <div className="connector-bar" style={{ width: `${(c.connects / maxConnects) * 100}%` }}></div>
                  </div>
                  <span className="connector-amount">{formatCurrency(c.amount)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Invoice Requests Overview */}
        <div className="dash-card" id="invoice-overview">
          <div className="dash-card-header">
            <h3 className="dash-card-title">Invoice Requests Overview</h3>
          </div>
          <div className="invoice-stats-grid">
            {invoiceStats.map((inv, i) => (
              <div className="invoice-stat" key={i} style={{ borderLeftColor: inv.color }}>
                <span className="invoice-stat-label">{inv.label}</span>
                <span className="invoice-stat-value" style={{ color: inv.color }}>{inv.value}</span>
                <span className="invoice-stat-amount">{formatCurrency(inv.amount)}</span>
              </div>
            ))}
          </div>
          <div className="payout-overview">
            <h4 className="payout-overview-title">Payout Overview (All-Time)</h4>
            <div className="payout-overview-grid">
              <div className="payout-item">
                <span className="payout-item-label">Total Payout</span>
                <span className="payout-item-value">{formatCurrency(payoutOverview.totalPayout)}</span>
              </div>
              <div className="payout-item">
                <span className="payout-item-label">Pending Payout</span>
                <span className="payout-item-value" style={{ color: '#F59E0B' }}>{formatCurrency(payoutOverview.pendingPayout)}</span>
              </div>
              <div className="payout-item">
                <span className="payout-item-label">Paid Payout</span>
                <span className="payout-item-value" style={{ color: '#10B981' }}>{formatCurrency(payoutOverview.paidPayout)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Dashboard;
