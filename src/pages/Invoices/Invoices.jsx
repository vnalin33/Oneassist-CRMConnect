import { useState, useEffect, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../services/api';
import { exportToCSV } from '../../utils/excelExport';
import { ENV } from '../../env';
import './Invoices.css';

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
function PreviewModal({ invoice, onClose }) {
  if (!invoice) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-preview" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Invoice Preview</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="preview-body">
          <div className="preview-grid">
            <div><span className="label">Connector</span><span className="val">{invoice.connector_name}</span></div>
            <div><span className="label">Contact</span><span className="val">{invoice.contact_name}</span></div>
            <div><span className="label">Loan Type</span><span className="val">{invoice.loan_type}</span></div>
            <div><span className="label">Service Type</span><span className="val">{invoice.service_type || '—'}</span></div>
            <div><span className="label">Loan Amount</span><span className="val">{fmtINR(invoice.loan_amount)}</span></div>
            <div><span className="label">Disbursed</span><span className="val">{fmtINR(invoice.disbursed_amount)}</span></div>
            <div><span className="label">Payout Type</span><span className="val">{invoice.processing_type || invoice.invoice_type}</span></div>
            <div><span className="label">Bank</span><span className="val">{invoice.bank_name || '—'}</span></div>
            <div><span className="label">Track #</span><span className="val">{invoice.track_number || '—'}</span></div>
            <div><span className="label">GST Status</span><span className="val">{invoice.is_gst_registered ? '✅ Registered' : '❌ Not Registered'}</span></div>
          </div>
          <div className="preview-breakdown">
            <h3>Bill Breakdown</h3>
            <div className="bill-line"><span>Payout Amount</span><span>{fmtINR(invoice.payout_amount)}</span></div>
            {!invoice.is_gst_registered && (
              <>
                <div className="bill-line deduction"><span>SGST (9%)</span><span>- {fmtINR(invoice.sgst)}</span></div>
                <div className="bill-line deduction"><span>CGST (9%)</span><span>- {fmtINR(invoice.cgst)}</span></div>
              </>
            )}
            <div className="bill-line deduction"><span>TDS (2%)</span><span>- {fmtINR(invoice.tds)}</span></div>
            <div className="bill-line total"><span>Grand Total</span><span>{fmtINR(invoice.total_amount)}</span></div>
          </div>
          <div className="preview-status-row">
            <span className={`status-badge status-${invoice.status}`}>{invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}</span>
            {invoice.expected_payout_date && <span className="expected-date">Expected Payout: {fmtDate(invoice.expected_payout_date)}</span>}
            {invoice.remarks && <span className="remarks-text">Remarks: {invoice.remarks}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ────────────────────────────────────────────────
function EditModal({ invoice, onClose, onSave }) {
  const [action, setAction] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [remarks, setRemarks] = useState('');
  const [saving, setSaving] = useState(false);

  if (!invoice) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      if (action === 'approve') {
        if (!expectedDate) { alert('Please enter expected payout date'); setSaving(false); return; }
        await api.put(`/invoice-requests/${invoice.id}/approve`, { expected_payout_date: expectedDate });
      } else if (action === 'reject') {
        if (!remarks.trim()) { alert('Please enter rejection remarks'); setSaving(false); return; }
        await api.put(`/invoice-requests/${invoice.id}/reject`, { remarks });
      } else if (action === 'paid') {
        await api.put(`/invoice-requests/${invoice.id}/paid`, {});
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
          <h2>Update Invoice Status</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="edit-body">
          <div className="edit-info">
            <p><strong>Connector:</strong> {invoice.connector_name}</p>
            <p><strong>Contact:</strong> {invoice.contact_name}</p>
            <p><strong>Amount:</strong> {fmtINR(invoice.total_amount)}</p>
            <p><strong>Current Status:</strong> <span className={`status-badge status-${invoice.status}`}>{invoice.status?.charAt(0).toUpperCase() + invoice.status?.slice(1)}</span></p>
          </div>

          <div className="action-btns">
            {(invoice.status === 'pending') && (
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
            {(invoice.status === 'approved') && (
              <button className={`action-btn paid ${action === 'paid' ? 'active' : ''}`} onClick={() => setAction('paid')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>
                Mark as Paid
              </button>
            )}
          </div>

          {action === 'approve' && (
            <div className="field-group">
              <label>Expected Payout Date <span className="required">*</span></label>
              <input type="date" value={expectedDate} onChange={e => setExpectedDate(e.target.value)} />
            </div>
          )}

          {action === 'reject' && (
            <div className="field-group">
              <label>Rejection Remarks <span className="required">*</span></label>
              <textarea rows={3} value={remarks} onChange={e => setRemarks(e.target.value)} placeholder="Enter reason for rejection..." />
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

// ─── Billing Modal ─────────────────────────────────────────────
function BillingModal({ invoice, onClose, onSave }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: invoice.billing_from_name || '',
    address: invoice.billing_from_address || '',
    phone: invoice.billing_from_phone || '',
    email: invoice.billing_from_email || '',
    pan: invoice.billing_from_pan || '',
    gstin: invoice.billing_from_gstin || '',
    place_of_supply: invoice.place_of_supply || '',
  });

  const [billToData, setBillToData] = useState({
    name: invoice.billing_to_name || '',
    address: invoice.billing_to_address || '',
    phone: invoice.billing_to_phone || '',
    email: invoice.billing_to_email || '',
    pan: invoice.billing_to_pan || '',
    gst: invoice.billing_to_gst || '',
  });

  if (!invoice) return null;

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBillToChange = (e) => {
    setBillToData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/invoice-requests/${invoice.id}/billing`, { billingFrom: formData, billingTo: billToData });
      onSave();
    } catch (err) {
      alert(err.message || 'Failed to save billing info');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-edit" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Update Billing Info</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="edit-body" style={{ display: 'flex', gap: '2rem' }}>
          {/* Bill From Column */}
          <div style={{ flex: 1 }}>
            <h3>Bill From</h3>
            <div className="field-group">
              <label>Company Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label>Address</label>
              <textarea rows={2} name="address" value={formData.address} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label>Phone</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label>Email</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label>PAN</label>
              <input type="text" name="pan" value={formData.pan} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label>GSTIN</label>
              <input type="text" name="gstin" value={formData.gstin} onChange={handleChange} />
            </div>
            <div className="field-group">
              <label>Place of Supply</label>
              <input type="text" name="place_of_supply" value={formData.place_of_supply} onChange={handleChange} />
            </div>
          </div>

          {/* Bill To Column */}
          <div style={{ flex: 1 }}>
            <h3>Bill To (Connector)</h3>
            <div className="field-group">
              <label>Name</label>
              <input type="text" name="name" value={billToData.name} onChange={handleBillToChange} />
            </div>
            <div className="field-group">
              <label>Address</label>
              <textarea rows={2} name="address" value={billToData.address} onChange={handleBillToChange} />
            </div>
            <div className="field-group">
              <label>Phone</label>
              <input type="text" name="phone" value={billToData.phone} onChange={handleBillToChange} />
            </div>
            <div className="field-group">
              <label>Email</label>
              <input type="email" name="email" value={billToData.email} onChange={handleBillToChange} />
            </div>
            <div className="field-group">
              <label>PAN</label>
              <input type="text" name="pan" value={billToData.pan} onChange={handleBillToChange} />
            </div>
            <div className="field-group">
              <label>GST</label>
              <input type="text" name="gst" value={billToData.gst} onChange={handleBillToChange} />
            </div>
          </div>
        </div>
        <div className="edit-body" style={{ borderTop: 'none', paddingTop: 0 }}>
          <button className="save-btn" onClick={handleSave} disabled={saving} style={{ marginTop: '1rem' }}>
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────
function Invoices() {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [loanTypeFilter, setLoanTypeFilter] = useState('all');
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0, paid: 0 });
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [previewInvoice, setPreviewInvoice] = useState(null);
  const [editInvoice, setEditInvoice] = useState(null);
  const [billingInvoice, setBillingInvoice] = useState(null);
  const LIMIT = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let listUrl = `/invoice-requests?status=${statusFilter}&search=${searchTerm}&page=${page}&limit=${LIMIT}&invoice_type=${typeFilter}`;
      if (loanTypeFilter !== 'all') listUrl += `&loan_type=${encodeURIComponent(loanTypeFilter)}`;
      const [listRes, statsRes] = await Promise.all([
        api.get(listUrl),
        api.get('/invoice-requests/stats'),
      ]);
      setInvoices(listRes.rows || []);
      setTotalCount(listRes.total || 0);
      if (statsRes.data) setStats(statsRes.data);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, page, typeFilter, loanTypeFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, typeFilter, loanTypeFilter]);

  const handleExport = async () => {
    try {
      const response = await api.get(`/invoice-requests?status=${statusFilter}&search=${searchTerm}&page=1&limit=100000&invoice_type=${typeFilter}`);
      if (response.success && response.rows) {
        const headersMap = {
          connector_name: 'Connector',
          contact_name: 'Contact Name',
          loan_type: 'Loan Type',
          payout_amount: 'Payout Amount (INR)',
          total_amount: 'Grand Total (INR)',
          invoice_type: 'Type',
          status: 'Status',
          expected_payout_date: 'Expected Payout Date',
          created_at: 'Created Date'
        };

        const exportData = response.rows.map(inv => ({
          ...inv,
          payout_amount: parseFloat(inv.payout_amount || 0),
          total_amount: parseFloat(inv.total_amount || 0),
          expected_payout_date: inv.expected_payout_date ? new Date(inv.expected_payout_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
          created_at: inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
        }));

        exportToCSV(exportData, 'invoices_report', headersMap);
      } else {
        alert('No data found to export');
      }
    } catch (err) {
      console.error('Failed to export invoices:', err);
      alert('Failed to export data');
    }
  };

  const totalPages = Math.ceil(totalCount / LIMIT);

  const STAT_CARDS = [
    { id: 'total', label: 'Total Requests', value: stats.total, color: '#6C5CE7', icon: 'fileText' },
    { id: 'pending', label: 'Pending', value: stats.pending, sub: stats.total > 0 ? `${((stats.pending / stats.total) * 100).toFixed(1)}%` : '', color: '#F59E0B', icon: 'clock' },
    { id: 'approved', label: 'Approved', value: stats.approved, sub: stats.total > 0 ? `${((stats.approved / stats.total) * 100).toFixed(1)}%` : '', color: '#10B981', icon: 'checkCircle' },
    { id: 'rejected', label: 'Rejected', value: stats.rejected, sub: stats.total > 0 ? `${((stats.rejected / stats.total) * 100).toFixed(1)}%` : '', color: '#EF4444', icon: 'xCircle' },
    { id: 'paid', label: 'Paid', value: stats.paid, sub: stats.total > 0 ? `${((stats.paid / stats.total) * 100).toFixed(1)}%` : '', color: '#3B82F6', icon: 'wallet' },
  ];

  const handleModalSave = () => {
    setEditInvoice(null);
    setPreviewInvoice(null);
    setBillingInvoice(null);
    fetchData();
  };

  const handleDownload = async (invoiceId) => {
    try {
      const token = localStorage.getItem('crm-token');
      const response = await fetch(`${ENV.API_BASE_URL}/invoice-requests/${invoiceId}/invoice-pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to generate invoice');

      const htmlText = await response.text();
      const printWindow = window.open('', '_blank', 'width=900,height=700');
      printWindow.document.write(htmlText);
      printWindow.document.close();

      // Wait for content to render, then trigger print (Save as PDF)
      printWindow.onload = () => {
        setTimeout(() => printWindow.print(), 500);
      };
      // Fallback if onload doesn't fire
      setTimeout(() => printWindow.print(), 1000);
    } catch (err) {
      console.error(err);
      alert('Failed to download invoice');
    }
  };

  return (
    <div className="invoices-page">
      {/* HEADER */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Invoice Requests</h1>
          <p>Manage and track all invoice requests from connectors.</p>
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
                placeholder="Search by name, invoice number..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="table-filter-select"
            >
              <option value="all">All Invoice Types</option>
              <option value="instant">Instant</option>
              <option value="regular">Cycle</option>
            </select>
            <select
              value={loanTypeFilter}
              onChange={(e) => setLoanTypeFilter(e.target.value)}
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
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
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
                <th>Connector</th>
                <th>Contact Name</th>
                <th>Loan Type</th>
                <th>Payout Amt</th>
                <th>Grand Total</th>
                <th>Type</th>
                <th>Status</th>
                <th>Expected Payout</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: '2rem' }}>Loading...</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={11} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>No invoice requests found</td></tr>
              ) : (
                invoices.map((row, idx) => (
                  <tr key={row.id}>
                    <td className="font-medium">{(page - 1) * LIMIT + idx + 1}</td>
                    <td className="font-medium text-primary">{row.connector_name}</td>
                    <td className="font-medium">{row.contact_name}</td>
                    <td>{row.loan_type}</td>
                    <td className="font-semibold">{fmtINR(row.payout_amount)}</td>
                    <td className="font-semibold text-primary">{fmtINR(row.total_amount)}</td>
                    <td><span className="type-badge">{row.invoice_type || 'instant'}</span></td>
                    <td>
                      <span className={`status-badge status-${row.status}`}>
                        {row.status?.charAt(0).toUpperCase() + row.status?.slice(1)}
                      </span>
                    </td>
                    <td>{row.expected_payout_date ? fmtDate(row.expected_payout_date) : '—'}</td>
                    <td>{fmtDate(row.created_at)}</td>
                    <td>
                      <div className="action-cell">
                        {/* Preview (Eye) */}
                        <button className="btn-icon" title="Preview" onClick={() => setPreviewInvoice(row)}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>
                        {/* Edit */}
                        <button className="btn-icon" title="Edit Status" onClick={() => setEditInvoice(row)} disabled={row.status === 'paid' || row.status === 'rejected'}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                        </button>
                        {/* Download */}
                        {row.status === 'paid' && (
                          <button className="btn-icon" title="Download Invoice" onClick={() => handleDownload(row.id)}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
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
      {previewInvoice && <PreviewModal invoice={previewInvoice} onClose={() => setPreviewInvoice(null)} />}
      {editInvoice && <EditModal invoice={editInvoice} onClose={() => setEditInvoice(null)} onSave={handleModalSave} />}
      {billingInvoice && <BillingModal invoice={billingInvoice} onClose={() => setBillingInvoice(null)} onSave={handleModalSave} />}
    </div>
  );
}

export default Invoices;
