/**
 * Dashboard Controller - Handles admin dashboard stats aggregation
 */
const db = require('../config/database');

const dashboardController = {
  /**
   * GET /api/dashboard/stats
   */
  async getStats(req, res, next) {
    try {
      let monthFilter = "DATE_TRUNC('month', CURRENT_DATE)";
      let monthEnd = "DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'";
      let prevMonthFilter = "DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')";
      let prevMonthEnd = "DATE_TRUNC('month', CURRENT_DATE)";
      
      const { month } = req.query; // format 'YYYY-MM'
      const monthParams = [];
      const prevMonthParams = [];
      
      if (month && /^\d{4}-\d{2}$/.test(month)) {
        const [year, monthNum] = month.split('-');
        const startTimestamp = `${year}-${monthNum}-01 00:00:00`;
        
        const prevMonthDate = new Date(parseInt(year), parseInt(monthNum) - 2, 1);
        const prevYear = prevMonthDate.getFullYear();
        const prevMonthNum = (prevMonthDate.getMonth() + 1).toString().padStart(2, '0');
        const prevStartTimestamp = `${prevYear}-${prevMonthNum}-01 00:00:00`;

        monthFilter = "$1::timestamp";
        monthEnd = "$1::timestamp + INTERVAL '1 month'";
        prevMonthFilter = "$1::timestamp";
        prevMonthEnd = "$1::timestamp + INTERVAL '1 month'";
        
        monthParams.push(startTimestamp);
        prevMonthParams.push(prevStartTimestamp);
      }
 
      // 1. General Stats
      // Total connects (leads count)
      const totalConnectsRes = await db.query('SELECT COUNT(*) FROM leadpersonaldetails');
      const totalConnects = parseInt(totalConnectsRes.rows[0].count || 0);
 
      // Active contacts (leads whose status represents active progress, not in 17, 18, 20 or rejected)
      const activeContactsRes = await db.query(
        "SELECT COUNT(*) FROM leadpersonaldetails WHERE status NOT IN (5, 7, 9, 14, 16, 17, 18, 20, 21, 23)"
      );
      const activeContacts = parseInt(activeContactsRes.rows[0].count || 0);
 
      // Pending payout requests (invoice requests + withdrawals pending/approved)
      const pendingInvoicesRes = await db.query(
        "SELECT COUNT(*) FROM invoice_requests WHERE status IN ('pending', 'approved')"
      );
      const pendingWithdrawalsRes = await db.query(
        "SELECT COUNT(*) FROM withdrawals WHERE status IN ('pending', 'approved')"
      );
      const pendingPayoutRequests = 
        parseInt(pendingInvoicesRes.rows[0].count || 0) + 
        parseInt(pendingWithdrawalsRes.rows[0].count || 0);
 
      // Monthly connects (leads added in selected/current month)
      const monthlyConnectsRes = await db.query(
        `SELECT COUNT(*) FROM leadpersonaldetails WHERE createdon >= ${monthFilter} AND createdon < ${monthEnd}`,
        monthParams
      );
      const monthlyConnects = parseInt(monthlyConnectsRes.rows[0].count || 0);
 
      // Total Payout (This Month) - sum of paid invoice requests + paid withdrawals in selected/current month
      const monthlyPaidInvoicesRes = await db.query(
        `SELECT COALESCE(SUM(total_amount), 0) as sum FROM invoice_requests WHERE status = 'paid' AND updated_at >= ${monthFilter} AND updated_at < ${monthEnd}`,
        monthParams
      );
      const monthlyPaidWithdrawalsRes = await db.query(
        `SELECT COALESCE(SUM(amount), 0) as sum FROM withdrawals WHERE status = 'paid' AND paid_date >= ${monthFilter} AND paid_date < ${monthEnd}`,
        monthParams
      );
      const monthlyPayout = 
        parseFloat(monthlyPaidInvoicesRes.rows[0].sum || 0) + 
        parseFloat(monthlyPaidWithdrawalsRes.rows[0].sum || 0);
 
      // Successful conversions (status 17, 18, 20 - disbursement/completed)
      const conversionsRes = await db.query(
        "SELECT COUNT(*) FROM leadpersonaldetails WHERE status IN (17, 18, 20)"
      );
      const conversions = parseInt(conversionsRes.rows[0].count || 0);
 
      // Calculate percentage changes vs last month
      const lastMonthConnectsRes = await db.query(
        `SELECT COUNT(*) FROM leadpersonaldetails 
         WHERE createdon >= ${prevMonthFilter} 
           AND createdon < ${prevMonthEnd}`,
        prevMonthParams
      );
      const lastMonthConnects = parseInt(lastMonthConnectsRes.rows[0].count || 0);
      let connectsChange = '+0%';
      if (lastMonthConnects > 0) {
        const pct = ((monthlyConnects - lastMonthConnects) / lastMonthConnects) * 100;
        connectsChange = (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
      }
 
      // 2. Chart Growth: Connect Growth (this month vs last month, daily)
      const thisMonthDailyRes = await db.query(
        `SELECT EXTRACT(DAY FROM createdon)::integer as day, COUNT(*) as count 
         FROM leadpersonaldetails 
         WHERE createdon >= ${monthFilter} 
           AND createdon < ${monthEnd}
         GROUP BY EXTRACT(DAY FROM createdon)
         ORDER BY day`,
        monthParams
      );
 
      const lastMonthDailyRes = await db.query(
        `SELECT EXTRACT(DAY FROM createdon)::integer as day, COUNT(*) as count 
         FROM leadpersonaldetails 
         WHERE createdon >= ${prevMonthFilter} 
           AND createdon < ${prevMonthEnd}
         GROUP BY EXTRACT(DAY FROM createdon)
         ORDER BY day`,
        prevMonthParams
      );

      // Build daily stats for chart
      const thisMonthDaily = {};
      thisMonthDailyRes.rows.forEach(r => { thisMonthDaily[r.day] = r.count; });
      const lastMonthDaily = {};
      lastMonthDailyRes.rows.forEach(r => { lastMonthDaily[r.day] = r.count; });

      const lineData = [];
      // Generate days 1 to 31
      for (let day = 1; day <= 31; day++) {
        // Format day name like '01', '05', etc., or show all days
        const dayStr = day.toString().padStart(2, '0');
        lineData.push({
          name: dayStr,
          thisMonth: thisMonthDaily[day] || 0,
          lastMonth: lastMonthDaily[day] || 0
        });
      }

      // 3. Connect Status (Pie Chart)
      const statusRes = await db.query(
        `SELECT 
           CASE 
             WHEN status IN (17, 18, 20) THEN 'Converted'
             WHEN status IN (5, 7, 9, 14, 16, 21, 23) THEN 'Rejected'
             WHEN status IN (6, 8, 12, 13, 15, 19) THEN 'Pending'
             ELSE 'Active'
           END as category,
           COUNT(*) as count
         FROM leadpersonaldetails
         GROUP BY category`
      );
      
      const pieMap = { Active: 0, Pending: 0, Converted: 0, Rejected: 0 };
      let totalPieCount = 0;
      statusRes.rows.forEach(r => {
        pieMap[r.category] = parseInt(r.count || 0);
        totalPieCount += parseInt(r.count || 0);
      });

      const colorsMap = {
        Active: '#6C5CE7',
        Pending: '#F59E0B',
        Converted: '#10B981',
        Rejected: '#EF4444'
      };

      const pieData = Object.entries(pieMap).map(([name, value]) => {
        const pctVal = totalPieCount > 0 ? ((value / totalPieCount) * 100).toFixed(0) : 0;
        return {
          name,
          value,
          pct: `${pctVal}%`,
          color: colorsMap[name]
        };
      });

      // 4. Recent Activities
      // Fetch recent leads
      const recentLeadsRes = await db.query(
        `SELECT 
           c.name as connector,
           (COALESCE(l.firstname, '') || ' ' || COALESCE(l.lastname, '')) as contact,
           'New Connect Added' as activity,
           '#10B981' as actColor,
           '#D1FAE5' as actBg,
           l.createdon as date,
           COALESCE(NULLIF(l.loanamount, '')::numeric, 0) as amount
         FROM leadpersonaldetails l
         LEFT JOIN connector c ON l.connectorid = c.id
         ORDER BY l.createdon DESC
         LIMIT 5`
      );

      // Fetch recent invoices
      const recentInvoicesRes = await db.query(
        `SELECT 
           connector_name as connector,
           contact_name as contact,
           'Invoice Requested' as activity,
           '#3B82F6' as actColor,
           '#DBEAFE' as actBg,
           created_at as date,
           total_amount as amount
         FROM invoice_requests
         ORDER BY created_at DESC
         LIMIT 5`
      );

      // Fetch recent withdrawals
      const recentWithdrawalsRes = await db.query(
        `SELECT 
           connector_name as connector,
           'Wallet Payout' as contact,
           'Payout Requested' as activity,
           '#F59E0B' as actColor,
           '#FEF3C7' as actBg,
           request_date as date,
           amount
         FROM withdrawals
         ORDER BY request_date DESC
         LIMIT 5`
      );

      // Combine and sort
      const activities = [
        ...recentLeadsRes.rows.map(r => ({ ...r, type: 'lead' })),
        ...recentInvoicesRes.rows.map(r => ({ ...r, type: 'invoice', amount: parseFloat(r.amount) })),
        ...recentWithdrawalsRes.rows.map(r => ({ ...r, type: 'withdrawal', amount: parseFloat(r.amount) }))
      ]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);

      // 5. Top Partners
      const topPartnersRes = await db.query(
        `SELECT 
           c.id, c.name as name,
           (SELECT COUNT(*) FROM leadpersonaldetails l WHERE l.connectorid = c.id)::integer as connects,
           (SELECT COALESCE(SUM(ir.total_amount), 0) FROM invoice_requests ir WHERE ir.connectorid = c.id AND ir.status = 'paid')::numeric as amount
         FROM connector c
         ORDER BY connects DESC
         LIMIT 5`
      );

      const topConnectors = topPartnersRes.rows.map((row, idx) => ({
        rank: idx + 1,
        name: row.name,
        connects: row.connects,
        amount: parseFloat(row.amount || 0)
      }));

      // 6. Invoice Stats & Payout Overview
      const invoiceStatsRes = await db.query(
        `SELECT 
           status,
           COUNT(*)::integer as count,
           COALESCE(SUM(total_amount), 0)::numeric as amount
         FROM invoice_requests
         GROUP BY status`
      );

      const invoiceStatsMap = {
        pending: { count: 0, amount: 0, color: '#F59E0B', bg: '#FEF3C7' },
        approved: { count: 0, amount: 0, color: '#10B981', bg: '#D1FAE5' },
        rejected: { count: 0, amount: 0, color: '#EF4444', bg: '#FEE2E2' },
        paid: { count: 0, amount: 0, color: '#3B82F6', bg: '#DBEAFE' }
      };

      invoiceStatsRes.rows.forEach(r => {
        if (invoiceStatsMap[r.status]) {
          invoiceStatsMap[r.status].count = parseInt(r.count || 0);
          invoiceStatsMap[r.status].amount = parseFloat(r.amount || 0);
        }
      });

      const invoiceStatsList = Object.entries(invoiceStatsMap).map(([label, val]) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value: val.count,
        amount: val.amount,
        color: val.color,
        bg: val.bg
      }));

      // Payout overview values (All time / current totals)
      const allInvoicesPaidRes = await db.query(
        "SELECT COALESCE(SUM(total_amount), 0) as sum FROM invoice_requests WHERE status = 'paid'"
      );
      const allWithdrawalsPaidRes = await db.query(
        "SELECT COALESCE(SUM(amount), 0) as sum FROM withdrawals WHERE status = 'paid'"
      );
      const totalPaidPayout = 
        parseFloat(allInvoicesPaidRes.rows[0].sum || 0) + 
        parseFloat(allWithdrawalsPaidRes.rows[0].sum || 0);

      const allInvoicesPendingRes = await db.query(
        "SELECT COALESCE(SUM(total_amount), 0) as sum FROM invoice_requests WHERE status IN ('pending', 'approved')"
      );
      const allWithdrawalsPendingRes = await db.query(
        "SELECT COALESCE(SUM(amount), 0) as sum FROM withdrawals WHERE status IN ('pending', 'approved')"
      );
      const totalPendingPayout = 
        parseFloat(allInvoicesPendingRes.rows[0].sum || 0) + 
        parseFloat(allWithdrawalsPendingRes.rows[0].sum || 0);

      const totalPayout = totalPaidPayout + totalPendingPayout;

      res.json({
        success: true,
        data: {
          stats: {
            totalConnects,
            activeContacts,
            pendingPayoutRequests,
            monthlyConnects,
            monthlyPayout,
            conversions,
            connectsChange
          },
          lineData,
          pieData,
          activities,
          topConnectors,
          invoiceStats: invoiceStatsList,
          payoutOverview: {
            totalPayout,
            pendingPayout: totalPendingPayout,
            paidPayout: totalPaidPayout
          }
        }
      });

    } catch (error) {
      next(error);
    }
  }
};

module.exports = dashboardController;
