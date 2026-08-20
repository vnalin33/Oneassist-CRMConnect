import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import { exportToCSV } from '../../utils/excelExport';
import './Withdrawals.css';

function StatIcon({ type, className }) {
  const icons = {
    fileText: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>,
    clock: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
    checkCircle: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
    xCircle: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
    wallet: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>,
  };
  return <span className={className}>{icons[type]}</span>;
}

const fmtINR = (n) => '₹' + parseFloat(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── Preview Modal ─────────────────────────────────────────────
function PreviewModal({ request, onClose }) {
  if (!request) return null;
  const rawBank = request.bank_details;
  const bank = typeof rawBank === 'string' ? (() => { try { return JSON.parse(rawBank); } catch { return {}; } })() : (rawBank || {});

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-preview" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Withdrawal Details</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="preview-body">
          <div className="preview-grid">
            <div><span className="label">Partner</span><span className="val">{request.connector_name || request.partner_name || '—'}</span></div>
            <div><span className="label">Phone</span><span className="val">{request.partner_phone || '—'}</span></div>
            <div><span className="label">Email</span><span className="val">{request.partner_email || '—'}</span></div>
            <div><span className="label">Amount</span><span className="val" style={{ color: '#6C5CE7', fontWeight: 700 }}>{fmtINR(request.amount)}</span></div>
            <div><span className="label">Request Date</span><span className="val">{fmtDate(request.request_date)}</span></div>
            <div><span className="label">Status</span><span className="val"><span className={`status-badge status-${request.status}`}>{request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}</span></span></div>
          </div>
          <div className="preview-breakdown">
            <h3>Bank Details</h3>
            <div className="bill-line"><span>Bank Name</span><span>{bank.bank_name || bank.bankName || request.connector_bank_name || 'N/A'}</span></div>
            <div className="bill-line"><span>Account Number</span><span>{bank.account || bank.accountNumber || request.connector_account || 'N/A'}</span></div>
            <div className="bill-line"><span>IFSC Code</span><span>{bank.ifsc || bank.ifscCode || request.connector_ifsc || 'N/A'}</span></div>
            <div className="bill-line"><span>Account Holder</span><span>{bank.account_holder || bank.accountHolder || request.connector_account_holder || 'N/A'}</span></div>
            <div className="bill-line"><span>Branch</span><span>{bank.branch || request.connector_branch || 'N/A'}</span></div>
          </div>
          <div className="preview-status-row">
            <span className={`status-badge status-${request.status}`}>{request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}</span>
            {request.approved_date && <span className="expected-date">Approved: {fmtDate(request.approved_date)}</span>}
            {request.paid_date && <span className="expected-date">Paid: {fmtDate(request.paid_date)}</span>}
            {request.remarks && <span className="remarks-text">Remarks: {request.remarks}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────
function EditModal({ request, onClose, onSave }) {
  const [action, setAction] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  if (!request) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (action === 'approve') {
        await api.put(`/withdrawals/${request.id}/approve`, { remarks });
      } else if (action === 'reject') {
        if (!remarks.trim()) { alert('Please enter rejection remarks'); setSaving(false); return; }
        await api.put(`/withdrawals/${request.id}/reject`, { remarks });
      } else if (action === 'paid') {
        await api.put(`/withdrawals/${request.id}/paid`, { remarks });
      }
      onSave();
    } catch (err) {
      alert(err.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-edit" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Withdrawal Status</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="edit-body">
          <div className="edit-info">
            <p><strong>Partner:</strong> {request.connector_name || request.partner_name}</p>
            <p><strong>Amount:</strong> {fmtINR(request.amount)}</p>
            <p><strong>Current Status:</strong> <span className={`status-badge status-${request.status}`}>{request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}</span></p>
          </div>

          <div className="action-btns">
            {(request.status === 'pending') && (
              <>
                <button className={`action-btn approve ${action === 'approve' ? 'active' : ''}`} onClick={() => setAction('approve')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
                  Approve
                </button>
                <button className={`action-btn reject ${action === 'reject' ? 'active' : ''}`} onClick={() => setAction('reject')}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
                  Reject
                </button>
              </>
            )}
            {(request.status === 'approved') && (
              <button className={`action-btn paid ${action === 'paid' ? 'active' : ''}`} onClick={() => setAction('paid')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>
                Mark as Paid
              </button>
            )}
          </div>

          {action === 'reject' && (
            <div className="field-group">
              <label>Rejection Remarks <span className="required">*</span></label>
              <textarea rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Enter reason for rejection..." />
            </div>
          )}

          {(action === 'approve' || action === 'paid') && (
            <div className="field-group">
              <label>Remarks / Transaction Reference</label>
              <textarea rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Enter payment reference or notes..." />
            </div>
          )}

          {action && (
            <button className="save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Confirm'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
function Withdrawals() {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [amountRange, setAmountRange] = useState('all');
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, paid: 0, totalPaidAmount: 0, totalPendingAmount: 0 });
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [previewRequest, setPreviewRequest] = useState(null);
  const [editRequest, setEditRequest] = useState(null);
  const LIMIT = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const listUrl = `/withdrawals?status=${statusFilter}&search=${searchTerm}&page=${page}&limit=${LIMIT}`;
      const [listRes, statsRes] = await Promise.all([
        api.get(listUrl),
        api.get('/withdrawals/stats'),
      ]);
      // Apply client-side amount range filter
      let rows = listRes.rows || [];
      if (amountRange !== 'all') {
        rows = rows.filter(r => {
          const amt = parseFloat(r.amount) || 0;
          switch (amountRange) {
            case 'under-5k': return amt < 5000;
            case '5k-25k': return amt >= 5000 && amt < 25000;
            case '25k-1l': return amt >= 25000 && amt < 100000;
            case 'above-1l': return amt >= 100000;
            default: return true;
          }
        });
      }
      setRequests(rows);
      setTotalCount(amountRange !== 'all' ? rows.length : (listRes.total || 0));
      if (statsRes.data) setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, page, amountRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, amountRange]);

  const handleExport = async () => {
    try {
      const response = await api.get(`/withdrawals?status=${statusFilter}&search=${searchTerm}&page=1&limit=100000`);
      if (response.success && response.rows) {
        const headersMap = {
          connector_name: 'Partner',
          amount: 'Amount (INR)',
          bank: 'Bank Name',
          status: 'Status',
          request_date: 'Request Date',
          paid_date: 'Paid Date',
          remarks: 'Remarks'
        };
        
        const exportData = response.rows.map(row => {
          const rawBank = row.bank_details;
          const bank = typeof rawBank === 'string' ? (() => { try { return JSON.parse(rawBank); } catch { return {}; } })() : (rawBank || {});
          const bankName = bank.bank_name || bank.bankName || row.connector_bank_name || 'N/A';
          return {
            connector_name: row.connector_name || row.partner_name || '—',
            amount: parseFloat(row.amount || 0),
            bank: bankName,
            status: row.status,
            request_date: row.request_date ? new Date(row.request_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
            paid_date: row.paid_date ? new Date(row.paid_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
            remarks: row.remarks || '—'
          };
        });
        
        exportToCSV(exportData, 'withdrawals_report', headersMap);
      } else {
        alert('No data found to export');
      }
    } catch (err) {
      console.error('Failed to export withdrawals:', err);
      alert('Failed to export data');
    }
  };

  const totalPages = Math.ceil(totalCount / LIMIT);

  const STAT_CARDS = [
    { id: 'total', label: 'Total Requests', value: stats.total, color: '#6C5CE7', icon: 'fileText' },
    { id: 'pending', label: 'Pending', value: stats.pending, sub: fmtINR(stats.totalPendingAmount), color: '#F59E0B', icon: 'clock' },
    { id: 'approved', label: 'Approved', value: stats.approved, color: '#10B981', icon: 'checkCircle' },
    { id: 'rejected', label: 'Rejected', value: stats.rejected, color: '#EF4444', icon: 'xCircle' },
    { id: 'paid', label: 'Paid', value: stats.paid, sub: fmtINR(stats.totalPaidAmount), color: '#3B82F6', icon: 'wallet' },
  ];

  const handleModalSave = () => {
    setEditRequest(null);
    setPreviewRequest(null);
    fetchData();
  };

  const handleDownloadReceipt = (row) => {
    const rawBank = row.bank_details;
    const bank = typeof rawBank === 'string' ? (() => { try { return JSON.parse(rawBank); } catch { return {}; } })() : (rawBank || {});
    const bankName = bank.bank_name || bank.bankName || row.connector_bank_name || 'N/A';
    const accountNo = bank.account || bank.accountNumber || row.connector_account || 'N/A';
    const ifsc = bank.ifsc || bank.ifscCode || row.connector_ifsc || 'N/A';
    const holder = bank.account_holder || bank.accountHolder || row.connector_account_holder || 'N/A';

    const html = `<!DOCTYPE html>
<html><head><title>Payment Receipt</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #1a1a2e; }
  .receipt { max-width: 700px; margin: 0 auto; border: 2px solid #6C5CE7; border-radius: 12px; overflow: hidden; }
  .header { background: linear-gradient(135deg, #6C5CE7, #3B82F6); color: #fff; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; } .header p { margin: 5px 0 0; opacity: 0.9; }
  .body { padding: 30px; }
  .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
  .row:last-child { border-bottom: none; }
  .label { color: #6b7280; font-size: 13px; } .value { font-weight: 600; font-size: 14px; }
  .amount { font-size: 28px; font-weight: 800; color: #10B981; text-align: center; margin: 20px 0; }
  .section-title { font-weight: 700; color: #6C5CE7; margin: 20px 0 10px; font-size: 15px; border-bottom: 2px solid #6C5CE7; padding-bottom: 5px; }
  .stamp { text-align: center; margin-top: 25px; padding: 12px; background: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0; }
  .stamp span { color: #10B981; font-weight: 700; font-size: 18px; }
  @media print { body { padding: 0; } .receipt { border: none; } }
</style>
</head><body>
<div class="receipt">
  <div class="header"><h1>💰 Payment Receipt</h1><p>Withdrawal Confirmation</p></div>
  <div class="body">
    <div class="amount">₹${parseFloat(row.amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
    <div class="section-title">Partner Details</div>
    <div class="row"><span class="label">Partner Name</span><span class="value">${row.connector_name || row.partner_name || '—'}</span></div>
    <div class="row"><span class="label">Phone</span><span class="value">${row.partner_phone || '—'}</span></div>
    <div class="row"><span class="label">Email</span><span class="value">${row.partner_email || '—'}</span></div>
    <div class="section-title">Bank Details</div>
    <div class="row"><span class="label">Bank Name</span><span class="value">${bankName}</span></div>
    <div class="row"><span class="label">Account Number</span><span class="value">${accountNo}</span></div>
    <div class="row"><span class="label">IFSC Code</span><span class="value">${ifsc}</span></div>
    <div class="row"><span class="label">Account Holder</span><span class="value">${holder}</span></div>
    <div class="section-title">Transaction Details</div>
    <div class="row"><span class="label">Request Date</span><span class="value">${fmtDate(row.request_date)}</span></div>
    <div class="row"><span class="label">Paid Date</span><span class="value">${fmtDate(row.paid_date)}</span></div>
    ${row.remarks ? `<div class="row"><span class="label">Remarks</span><span class="value">${row.remarks}</span></div>` : ''}
    <div class="stamp"><span>✅ PAID</span></div>
  </div>
</div>
</body></html>`;
    
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => setTimeout(() => printWindow.print(), 500);
    setTimeout(() => printWindow.print(), 1000);
  };

  return (
    <div className="withdrawals-page">
      {/* HEADER */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Withdrawal Requests</h1>
          <p>Manage and process partner withdrawal requests.</p>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats-cards-row">
        {STAT_CARDS.map((stat) => (
          <div
            className={`stat-card-mini ${statusFilter === stat.id ? 'stat-active' : ''}`}
            key={stat.id}
            onClick={() => { setStatusFilter(stat.id === 'total' ? 'all' : stat.id); setPage(1); }}
            style={{ cursor: 'pointer' }}
          >
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

      {/* TABLE */}
      <div className="table-container-card">
        <div className="table-toolbar">
          <div className="table-toolbar-left">
            <div className="table-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by partner name..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
            <select
              value={amountRange}
              onChange={(e) => setAmountRange(e.target.value)}
              className="table-filter-select"
            >
              <option value="all">All Amounts</option>
              <option value="under-5k">Under ₹5,000</option>
              <option value="5k-25k">₹5K – ₹25K</option>
              <option value="25k-1l">₹25K – ₹1 Lakh</option>
              <option value="above-1l">Above ₹1 Lakh</option>
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
                <th>#</th>
                <th>Partner</th>
                <th>Amount</th>
                <th>Bank</th>
                <th>Status</th>
                <th>Request Date</th>
                <th>Paid Date</th>
                <th>Remarks</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>No withdrawal requests found</td></tr>
              ) : (
                requests.map((row, idx) => {
                  const rawBank = row.bank_details;
                  const bank = typeof rawBank === 'string' ? (() => { try { return JSON.parse(rawBank); } catch { return {}; } })() : (rawBank || {});
                  return (
                    <tr key={row.id}>
                      <td className="font-medium">{(page - 1) * LIMIT + idx + 1}</td>
                      <td className="font-medium text-primary">{row.connector_name || row.partner_name || '—'}</td>
                      <td className="font-semibold">{fmtINR(row.amount)}</td>
                      <td>{bank.bank_name || bank.bankName || row.connector_bank_name || '—'}</td>
                      <td>
                        <span className={`status-badge status-${row.status}`}>
                          {row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}
                        </span>
                      </td>
                      <td>{fmtDate(row.request_date)}</td>
                      <td>{row.paid_date ? fmtDate(row.paid_date) : '—'}</td>
                      <td className="remarks-cell">{row.remarks || '—'}</td>
                      <td>
                        <div className="action-cell">
                          {/* Preview */}
                          <button className="btn-icon" title="View Details" onClick={() => setPreviewRequest(row)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>
                          {/* Edit Status */}
                          <button className="btn-icon" title="Update Status" onClick={() => setEditRequest(row)} disabled={row.status === 'paid' || row.status === 'rejected'}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            </svg>
                          </button>
                          {/* Download Receipt for Paid */}
                          {row.status === 'paid' && (
                            <button className="btn-icon" title="Download Receipt" onClick={() => handleDownloadReceipt(row)}>
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
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
              <button className="page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                <button key={p} className={`page-btn ${page === p ? 'page-btn-active' : ''}`} onClick={() => setPage(p)}>{p}</button>
              ))}
              {totalPages > 5 && <span className="page-ellipsis">...</span>}
              {totalPages > 5 && (
                <button className={`page-btn ${page === totalPages ? 'page-btn-active' : ''}`} onClick={() => setPage(totalPages)}>{totalPages}</button>
              )}
              <button className="page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {previewRequest && <PreviewModal request={previewRequest} onClose={() => setPreviewRequest(null)} />}
      {editRequest && <EditModal request={editRequest} onClose={() => setEditRequest(null)} onSave={handleModalSave} />}
    </div>
  );
}

export default Withdrawals;
