import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import { exportToCSV } from '../../utils/excelExport';
import './Connectors.css';

function StatIcon({ type, className }) {
  const icons = {
    users: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    shield: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    folder: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    ban: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
  };
  return type !== 'none' ? <span className={className}>{icons[type]}</span> : null;
}

function Connectors() {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [connectors, setConnectors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const LIMIT = 10;
  const [stats, setStats] = useState([
    { id: 'total', label: 'Total Connectors', value: '0', sub: '', color: '#3B82F6', icon: 'users' },
    { id: 'active', label: 'Active Connectors', value: '0', sub: '', color: '#10B981', icon: 'shield' },
    { id: 'inactive', label: 'Inactive Connectors', value: '0', sub: '', color: '#ban', icon: 'ban' },
    { id: 'connects', label: 'Total Connects', value: '0', sub: 'Cumulative', color: '#6C5CE7', icon: 'none' },
  ]);

  useEffect(() => {
    fetchConnectors();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  const fetchConnectors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/connectors');
      if (response.success) {
        setConnectors(response.connectors);
        
        // Calculate totals for stats
        const total = response.connectors.length;
        const totalConnects = response.connectors.reduce((sum, c) => sum + parseInt(c.total_connects || 0), 0);
        const active = response.connectors.filter(c => c.isactive === 1 || c.isactive === true).length;
        const inactive = total - active;
        
        setStats(prev => prev.map(s => {
          if (s.id === 'total') return { ...s, value: total.toString() };
          if (s.id === 'connects') return { ...s, value: totalConnects.toLocaleString() };
          if (s.id === 'active') return { ...s, value: active.toString(), sub: `${((active/total)*100 || 0).toFixed(1)}%` };
          if (s.id === 'inactive') return { ...s, value: inactive.toString(), sub: `${((inactive/total)*100 || 0).toFixed(1)}%` };
          return s;
        }));
      }
    } catch (error) {
      console.error('Failed to fetch connectors:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return '??';
    const parts = name.split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].substring(0, 2).toUpperCase();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const handleExport = () => {
    const headersMap = {
      name: 'Connector Name',
      phone: 'Phone',
      email: 'Email',
      total_connects: 'Total Connects',
      total_business: 'Business Volume (INR)',
      isactive: 'Status',
      created_at: 'Joined Date'
    };
    
    const exportData = filteredConnectors.map(c => ({
      ...c,
      isactive: (c.isactive === 1 || c.isactive === true) ? 'Active' : 'Inactive',
      created_at: c.created_at ? new Date(c.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
    }));
    
    exportToCSV(exportData, 'connectors_report', headersMap);
  };

  const filteredConnectors = connectors.filter(c => {
    const matchesSearch = 
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm);
    
    if (statusFilter === 'all') return matchesSearch;
    const isActive = c.isactive === 1 || c.isactive === true;
    return matchesSearch && (statusFilter === 'active' ? isActive : !isActive);
  });

  const totalCount = filteredConnectors.length;
  const totalPages = Math.ceil(totalCount / LIMIT);
  const paginatedConnectors = filteredConnectors.slice((page - 1) * LIMIT, page * LIMIT);

  return (
    <div className="connectors-page">
      {/* ===== HEADER ===== */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Connectors</h1>
          <p>Real-time performance from the connector table.</p>
        </div>
      </div>

      {/* ===== STAT CARDS ===== */}
      <div className="stats-cards-row">
        {stats.map((stat) => (
          <div className="stat-card-mini" key={stat.id}>
            <div className="stat-card-content">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
              {stat.sub && <span className="stat-sub" style={{ color: stat.id !== 'connects' ? stat.color : 'inherit' }}>{stat.sub}</span>}
            </div>
            {stat.icon !== 'none' && (
              <div className="stat-icon-wrapper" style={{ background: `${stat.color}15`, color: stat.color }}>
                <StatIcon type={stat.icon} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ===== TABLE CONTAINER ===== */}
      <div className="table-container-card">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="table-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input 
                type="text" 
                placeholder="Search by name, email or phone..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="table-filter-select"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="table-actions">
            <button className="btn-outline btn-export" onClick={handleExport}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Connector Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Total Connects</th>
                <th>Business Volume</th>
                <th>Status</th>
                <th>Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading connectors...</td></tr>
              ) : paginatedConnectors.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No connectors found.</td></tr>
              ) : (
                paginatedConnectors.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className="connector-id-cell">
                        <span className="avatar-mini" style={{ background: '#6C5CE7' }}>{getInitials(row.name)}</span>
                        <span className="font-medium text-primary">{row.name}</span>
                      </div>
                    </td>
                    <td>{row.phone || 'N/A'}</td>
                    <td>{row.email}</td>
                    <td className="font-semibold text-primary">{row.total_connects || 0}</td>
                    <td className="font-semibold text-primary">{formatCurrency(row.total_business)}</td>
                    <td>
                      <span className={`status-badge ${row.isactive ? 'status-active' : 'status-inactive'}`}>
                        {row.isactive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>{formatDate(row.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="table-pagination">
            <div className="pagination-info">
              Showing {(page - 1) * LIMIT + 1} to {Math.min(page * LIMIT, totalCount)} of {totalCount} results
            </div>
            <div className="pagination-controls">
              <button 
                className="page-btn" 
                disabled={page === 1} 
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button 
                  key={p} 
                  className={`page-btn ${page === p ? 'page-btn-active' : ''}`} 
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              {totalPages > 5 && <span className="page-ellipsis">...</span>}
              {totalPages > 5 && (
                <button 
                  className={`page-btn ${page === totalPages ? 'page-btn-active' : ''}`} 
                  onClick={() => setPage(totalPages)}
                >
                  {totalPages}
                </button>
              )}
              <button 
                className="page-btn" 
                disabled={page === totalPages} 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Connectors;
