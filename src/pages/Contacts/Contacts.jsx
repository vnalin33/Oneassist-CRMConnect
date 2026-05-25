import { useState, useEffect } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import { exportToCSV } from '../../utils/excelExport';
import './Contacts.css';

function StatIcon({ type, className }) {
  const icons = {
    users: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    userCheck: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg>,
    userX: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="18" y1="8" x2="23" y2="13"/><line x1="23" y1="8" x2="18" y2="13"/></svg>,
    trophy: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>,
  };
  return <span className={className}>{icons[type]}</span>;
}

function Contacts() {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [loanFilter, setLoanFilter] = useState('all');
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState([
    { id: 'total', label: 'Total Contacts', value: '0', sub: '', color: '#6C5CE7', icon: 'users' },
    { id: 'active', label: 'Active Contacts', value: '0', sub: '', color: '#10B981', icon: 'userCheck' },
    { id: 'inactive', label: 'Inactive Contacts', value: '0', sub: '', color: '#EF4444', icon: 'userX' },
    { id: 'converted', label: 'Converted Contacts', value: '0', sub: '', color: '#3B82F6', icon: 'trophy' },
  ]);

  useEffect(() => {
    fetchContacts();
  }, [page, searchTerm, statusFilter, loanFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, loanFilter]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/leads?page=${page}&search=${searchTerm}&limit=10&status=${statusFilter}&loantype=${loanFilter}`);
      if (response.success) {
        setContacts(response.leads);
        setTotal(response.total);
        
        // Update stats dynamically based on results
        setStats(prev => prev.map(s => s.id === 'total' ? { ...s, value: response.total.toLocaleString() } : s));
      }
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Fetch all matching records without page limitations
      const response = await api.get(`/leads?page=1&search=${searchTerm}&limit=100000&status=${statusFilter}&loantype=${loanFilter}`);
      if (response.success && response.leads) {
        const headersMap = {
          full_name: 'Name',
          mobilenumber: 'Mobile',
          email: 'Email',
          connector_name: 'Connector Name',
          loantype: 'Loan Type',
          loanamount: 'Loan Amount (INR)',
          createdon: 'Created Date'
        };
        
        const exportData = response.leads.map(lead => ({
          ...lead,
          connector_name: lead.connector_name || 'System',
          createdon: lead.createdon ? new Date(lead.createdon).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
        }));
        
        exportToCSV(exportData, 'contacts_report', headersMap);
      } else {
        alert('No data found to export');
      }
    } catch (err) {
      console.error('Failed to export contacts:', err);
      alert('Failed to export data');
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

  return (
    <div className="contacts-page">
      {/* ===== HEADER ===== */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Contact List</h1>
          <p>Real-time lead data from leadpersonaldetails.</p>
        </div>
      </div>

      {/* ===== STAT CARDS ===== */}
      <div className="stats-cards-row">
        {stats.map((stat) => (
          <div className="stat-card-mini" key={stat.id}>
            <div className="stat-card-content">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-value">{stat.value}</span>
              {stat.sub && <span className="stat-sub" style={{ color: stat.color }}>{stat.sub}</span>}
            </div>
            <div className="stat-icon-wrapper" style={{ background: `${stat.color}15`, color: stat.color }}>
              <StatIcon type={stat.icon} />
            </div>
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
                placeholder="Search by name, mobile or email..." 
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
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Converted">Converted</option>
              <option value="Rejected">Rejected</option>
            </select>
            <select 
              value={loanFilter} 
              onChange={(e) => setLoanFilter(e.target.value)} 
              className="table-filter-select"
            >
              <option value="all">All Loan Types</option>
              <option value="Home Loan">Home Loan</option>
              <option value="Personal Loan">Personal Loan</option>
              <option value="Business Loan">Business Loan</option>
              <option value="LAP">LAP</option>
              <option value="Gold Loan">Gold Loan</option>
              <option value="Vehicle Loan">Vehicle Loan</option>
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
                <th>Name</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Connector Name</th>
                <th>Loantype</th>
                <th>Loan Amount</th>
                <th>Created Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading contacts...</td></tr>
              ) : contacts.length === 0 ? (
                <tr><td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>No contacts found.</td></tr>
              ) : (
                contacts.map((row, idx) => (
                  <tr key={row.id || idx}>
                    <td>
                      <div className="connector-name-cell">
                        <span className="avatar-mini" style={{ background: '#6C5CE7' }}>{getInitials(row.full_name)}</span>
                        <span className="font-medium text-primary">{row.full_name}</span>
                      </div>
                    </td>
                    <td>{row.mobilenumber}</td>
                    <td>{row.email || 'N/A'}</td>
                    <td><span className="font-medium">{row.connector_name || 'System'}</span></td>
                    <td>{row.loantype || 'N/A'}</td>
                    <td className="font-semibold text-primary">{formatCurrency(row.loanamount)}</td>
                    <td>{formatDate(row.createdon)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-pagination">
          <div className="pagination-info">
            Showing {(page-1)*10 + 1} to {Math.min(page*10, total)} of {total.toLocaleString()} results
          </div>
          <div className="pagination-controls">
            <button 
              className="page-btn" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <button className="page-btn page-btn-active">{page}</button>
            <button 
              className="page-btn" 
              onClick={() => setPage(p => p + 1)}
              disabled={page * 10 >= total}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contacts;
