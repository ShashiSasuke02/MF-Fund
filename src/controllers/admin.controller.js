import { query, queryOne } from '../db/database.js';
import { fundModel } from '../models/fund.model.js';
import { fundNavHistoryModel } from '../models/fundNavHistory.model.js';
import logger from '../services/logger.service.js';

/**
 * Admin Controller
 * Provides administrative dashboard data and controls
 */
export const adminController = {
    /**
     * GET /api/admin/dashboard-stats
     * Get aggregated dashboard statistics
     */
    async getDashboardStats(req, res, next) {
        try {
            // Run all queries in parallel for performance
            const [
                userStats,
                transactionStats,
                holdingStats,
                fundStats,
                recentActivity
            ] = await Promise.all([
                // User statistics
                query(`
          SELECT 
            COUNT(*) as total_users,
            SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_count,
            SUM(CASE WHEN created_at > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL 7 DAY)) * 1000 THEN 1 ELSE 0 END) as new_users_7d
          FROM users
        `),
                // Transaction statistics
                query(`
          SELECT 
            COUNT(*) as total_transactions,
            SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
            SUM(CASE WHEN status = 'SUCCESS' THEN 1 ELSE 0 END) as success_count,
            SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count,
            SUM(CASE WHEN transaction_type = 'SIP' AND status = 'PENDING' THEN 1 ELSE 0 END) as pending_sips,
            SUM(CASE WHEN transaction_type = 'SWP' AND status = 'PENDING' THEN 1 ELSE 0 END) as pending_swps,
            SUM(amount) as total_volume
          FROM transactions
        `),
                // Holding statistics
                query(`
          SELECT 
            COUNT(*) as total_holdings,
            COUNT(DISTINCT user_id) as users_with_holdings,
            SUM(invested_amount) as total_invested,
            SUM(current_value) as total_current_value
          FROM holdings
        `),
                // Fund statistics
                query(`
          SELECT 
            COUNT(*) as total_funds,
            SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_funds
          FROM funds
        `),
                // Recent activity (last 10 transactions)
                query(`
          SELECT 
            t.id,
            t.transaction_type,
            t.amount,
            t.status,
            t.created_at,
            u.username
          FROM transactions t
          JOIN users u ON t.user_id = u.id
          ORDER BY t.created_at DESC
          LIMIT 10
        `)
            ]);

            // Get NAV record count
            const navStats = await fundNavHistoryModel.getTotalRecordCount();

            res.json({
                success: true,
                data: {
                    users: {
                        total: userStats[0]?.total_users || 0,
                        admins: userStats[0]?.admin_count || 0,
                        newLast7Days: userStats[0]?.new_users_7d || 0
                    },
                    transactions: {
                        total: transactionStats[0]?.total_transactions || 0,
                        pending: transactionStats[0]?.pending_count || 0,
                        success: transactionStats[0]?.success_count || 0,
                        failed: transactionStats[0]?.failed_count || 0,
                        pendingSips: transactionStats[0]?.pending_sips || 0,
                        pendingSwps: transactionStats[0]?.pending_swps || 0,
                        totalVolume: parseFloat(transactionStats[0]?.total_volume || 0)
                    },
                    holdings: {
                        total: holdingStats[0]?.total_holdings || 0,
                        usersWithHoldings: holdingStats[0]?.users_with_holdings || 0,
                        totalInvested: parseFloat(holdingStats[0]?.total_invested || 0),
                        totalCurrentValue: parseFloat(holdingStats[0]?.total_current_value || 0)
                    },
                    funds: {
                        total: fundStats[0]?.total_funds || 0,
                        active: fundStats[0]?.active_funds || 0,
                        navRecords: navStats
                    },
                    recentActivity
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/admin/users
     * Get all users with their stats
     */
    async getUsers(req, res, next) {
        try {
            const { search, role, limit = 50, offset = 0 } = req.query;

            let sql = `
        SELECT 
          u.id,
          u.username,
          u.email_id,
          u.full_name,
          u.role,
          u.created_at,
          da.balance,
          (SELECT COUNT(*) FROM holdings WHERE user_id = u.id) as holding_count,
          (SELECT SUM(invested_amount) FROM holdings WHERE user_id = u.id) as total_invested,
          (SELECT COUNT(*) FROM transactions WHERE user_id = u.id) as transaction_count
        FROM users u
        LEFT JOIN demo_accounts da ON u.id = da.user_id
        WHERE 1=1
      `;
            const params = [];

            if (search) {
                sql += ` AND (u.username LIKE ? OR u.email_id LIKE ? OR u.full_name LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`, `%${search}%`);
            }

            if (role) {
                sql += ` AND u.role = ?`;
                params.push(role);
            }

            sql += ` ORDER BY u.created_at DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), parseInt(offset));

            const users = await query(sql, params);

            // Get total count
            const countResult = await queryOne(`SELECT COUNT(*) as total FROM users`);

            res.json({
                success: true,
                data: {
                    users: users.map(u => ({
                        id: u.id,
                        username: u.username,
                        email: u.email_id,
                        fullName: u.full_name,
                        role: u.role,
                        createdAt: u.created_at,
                        balance: parseFloat(u.balance || 0),
                        holdingCount: u.holding_count || 0,
                        totalInvested: parseFloat(u.total_invested || 0),
                        transactionCount: u.transaction_count || 0
                    })),
                    pagination: {
                        total: countResult?.total || 0,
                        limit: parseInt(limit),
                        offset: parseInt(offset)
                    }
                }
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * POST /api/admin/cache/clear
     * Clear the API cache
     */
    async clearCache(req, res, next) {
        try {
            const result = await query(`DELETE FROM api_cache`);

            logger.info(`[Admin] Cache cleared: ${result.affectedRows || 0} entries removed`);

            res.json({
                success: true,
                message: `Cache cleared successfully. ${result.affectedRows || 0} entries removed.`
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/admin/activity-logs
     * Get recent system activity logs
     */
    async getActivityLogs(req, res, next) {
        try {
            const { type, limit = 50 } = req.query;

            // Combine multiple log sources
            const logs = [];

            // Cron job logs
            const cronLogs = await query(`
        SELECT 
          'CRON' as type,
          job_name as title,
          status,
          start_time as timestamp,
          duration_ms,
          message,
          error_details
        FROM cron_job_logs
        ORDER BY start_time DESC
        LIMIT ?
      `, [parseInt(limit)]);
            logs.push(...cronLogs.map(l => ({ ...l, type: 'CRON' })));

            // Fund sync logs
            const syncLogs = await query(`
        SELECT 
          'SYNC' as type,
          CONCAT(sync_type, ' Sync') as title,
          sync_status as status,
          start_time as timestamp,
          execution_duration_ms as duration_ms,
          CONCAT('Funds: ', total_funds_fetched, ', NAV: ', nav_records_inserted) as message,
          error_details
        FROM fund_sync_log
        ORDER BY start_time DESC
        LIMIT ?
      `, [parseInt(limit)]);
            logs.push(...syncLogs.map(l => ({ ...l, type: 'SYNC' })));

            // Recent transactions (anonymized)
            const txLogs = await query(`
        SELECT 
          'TRANSACTION' as type,
          CONCAT(transaction_type, ' - ₹', FORMAT(amount, 2)) as title,
          status,
          created_at as timestamp,
          NULL as duration_ms,
          scheme_name as message,
          failure_reason as error_details
        FROM transactions
        ORDER BY created_at DESC
        LIMIT ?
      `, [parseInt(limit)]);
            logs.push(...txLogs.map(l => ({ ...l, type: 'TRANSACTION' })));

            // Sort all logs by timestamp descending
            logs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

            // Filter by type if specified
            const filteredLogs = type
                ? logs.filter(l => l.type === type.toUpperCase())
                : logs;

            res.json({
                success: true,
                data: filteredLogs.slice(0, parseInt(limit))
            });
        } catch (error) {
            next(error);
        }
    },

    /**
     * GET /api/admin/sync-chart-data
     * Get sync data for chart visualization (last 7 days)
     */
    async getSyncChartData(req, res, next) {
        try {
            const days = parseInt(req.query.days) || 7;

            const chartData = await query(`
        SELECT 
          DATE(FROM_UNIXTIME(start_time / 1000)) as date,
          sync_type,
          COUNT(*) as count,
          SUM(CASE WHEN sync_status = 'SUCCESS' THEN 1 ELSE 0 END) as success_count,
          SUM(CASE WHEN sync_status = 'FAILED' THEN 1 ELSE 0 END) as failed_count,
          AVG(execution_duration_ms) as avg_duration
        FROM fund_sync_log
        WHERE start_time > UNIX_TIMESTAMP(DATE_SUB(NOW(), INTERVAL ? DAY)) * 1000
        GROUP BY DATE(FROM_UNIXTIME(start_time / 1000)), sync_type
        ORDER BY date ASC
      `, [days]);

            // Generate all dates in range for complete chart
            const today = new Date();
            const dates = [];
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                dates.push(date.toISOString().split('T')[0]);
            }

            // Map data to dates
            const formattedData = dates.map(date => {
                const fullSync = chartData.find(d => d.date === date && d.sync_type === 'FULL');
                const incSync = chartData.find(d => d.date === date && d.sync_type === 'INCREMENTAL');

                return {
                    date,
                    fullSync: fullSync?.count || 0,
                    incrementalSync: incSync?.count || 0,
                    fullSuccess: fullSync?.success_count || 0,
                    incrementalSuccess: incSync?.success_count || 0,
                    avgDuration: Math.round((fullSync?.avg_duration || 0) + (incSync?.avg_duration || 0))
                };
            });

            res.json({
                success: true,
                data: formattedData
            });
        } catch (error) {
            next(error);
        }
    }
};

export default adminController;
