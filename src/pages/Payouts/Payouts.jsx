import { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import './Payouts.css';

const PAYOUTS_DATA = [
  { id: 'PAYOUT-1001', initials: 'RS', name: 'Ravi Sharma', email: 'ravi.sharma@email.com', amount: '₹45,000', method: 'Bank Transfer', account: '**** 1234', paidDate: 'May 26, 2024, 11:30 AM', color: '#6C5CE7' },
  { id: 'PAYOUT-1002', initials: 'AV', name: 'Ankit Verma', email: 'ankit.verma@email.com', amount: '₹32,500', method: 'Bank Transfer', account: '**** 5678', paidDate: 'May 26, 2024, 10:15 AM', color: '#3B82F6' },
  { id: 'PAYOUT-1003', initials: 'NP', name: 'Neha Patel', email: 'neha.patel@email.com', amount: '₹28,000', method: 'Bank Transfer', account: '**** 9012', paidDate: 'May 25, 2024, 04:45 PM', color: '#8B5CF6' },
  { id: 'PAYOUT-1004', initials: 'VJ', name: 'Vikram Joshi', email: 'vikram.joshi@email.com', amount: '₹21,000', method: 'Bank Transfer', account: '**** 3456', paidDate: 'May 25, 2024, 01:20 PM', color: '#6C5CE7' },
  { id: 'PAYOUT-1005', initials: 'PS', name: 'Pooja Singh', email: 'pooja.singh@email.com', amount: '₹18,500', method: 'Bank Transfer', account: '**** 7890', paidDate: 'May 24, 2024, 06:10 PM', color: '#3B82F6' },
  { id: 'PAYOUT-1006', initials: 'AM', name: 'Amit Kumar', email: 'amit.kumar@email.com', amount: '₹15,000', method: 'Bank Transfer', account: '**** 2468', paidDate: 'May 24, 2024, 03:35 PM', color: '#8B5CF6' },
  { id: 'PAYOUT-1007', initials: 'PM', name: 'Priya Mehta', email: 'priya.mehta@email.com', amount: '₹14,200', method: 'Bank Transfer', account: '**** 1357', paidDate: 'May 24, 2024, 11:05 AM', color: '#6C5CE7' },
  { id: 'PAYOUT-1008', initials: 'RG', name: 'Rahul Gupta', email: 'rahul.gupta@email.com', amount: '₹12,000', method: 'Bank Transfer', account: '**** 8642', paidDate: 'May 23, 2024, 05:50 PM', color: '#8B5CF6' },
];

function Payouts() {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="payouts-page">
      {/* ===== HEADER ===== */}
      <div className="page-header">
        <div className="page-title-group">
          <h1>Payouts</h1>
          <p>View your completed payouts.</p>
        </div>
      </div>

      {/* ===== TABLE CONTAINER ===== */}
      <div className="table-container-card payouts-table-container">
        {/* Table Toolbar */}
        <div className="table-toolbar">
          <div className="table-search payouts-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input 
              type="text" 
              placeholder="Search by payee name, email or transaction ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="table-actions">
            <button className="btn-outline btn-date">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              May 20, 2024 - May 26, 2024
            </button>
            <button className="btn-outline btn-export">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="table-wrapper">
          <table className="data-table payouts-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Payee Name</th>
                <th>Email</th>
                <th>Amount</th>
                <th>Payout Method</th>
                <th>Paid Date</th>
              </tr>
            </thead>
            <tbody>
              {PAYOUTS_DATA.map((row, idx) => (
                <tr key={idx}>
                  <td className="font-semibold text-primary">{row.id}</td>
                  <td>
                    <div className="payee-name-cell">
                      <span className="avatar-mini" style={{ background: row.color }}>{row.initials}</span>
                      <span className="font-medium text-primary">{row.name}</span>
                    </div>
                  </td>
                  <td>{row.email}</td>
                  <td className="font-semibold text-primary">{row.amount}</td>
                  <td>
                    <div className="payout-method-cell">
                      <svg className="bank-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="20" width="20" height="2"/><rect x="2" y="2" width="20" height="4"/><path d="M4 6v14"/><path d="M8 6v14"/><path d="M12 6v14"/><path d="M16 6v14"/><path d="M20 6v14"/>
                      </svg>
                      <div className="payout-method-info">
                        <span className="method-name">{row.method}</span>
                        <span className="method-account">{row.account}</span>
                      </div>
                    </div>
                  </td>
                  <td>{row.paidDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="table-pagination">
          <div className="pagination-info">
            Showing 1 to 8 of 8 results
          </div>
          <div className="pagination-controls">
            <button className="page-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
            <button className="page-btn page-btn-active">1</button>
            <button className="page-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Payouts;
