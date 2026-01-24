
import db from '../db/database.js';

/**
 * Cron Job Log Model
 * Manages generic cron job execution logs
 */

export const cronJobLogModel = {
    /**
     * Create a new execution log entry
     * @param {Object} log - Log details
     * @param {string} log.job_name - Name of the cron job
     * @param {string} log.status - Status (RUNNING, SUCCESS, FAILED)
     * @param {string} log.triggered_by - Trigger type (SCHEDULE, MANUAL)
     * @param {number} log.start_time - Start timstamp
     * @returns {Promise<number>} Log ID
     */
    async create(log) {
        const result = await db.run(
            `INSERT INTO cron_job_logs (job_name, status, triggered_by, start_time)
       VALUES (?, ?, ?, ?)`,
            [
                log.job_name,
                log.status || 'RUNNING',
                log.triggered_by || 'SCHEDULE',
                log.start_time || Date.now()
            ]
        );
        const logId = Number(result.lastInsertRowid);
        console.log(`[CronJobLog] Created log entry ID: ${logId} for job: ${log.job_name}`);
        return logId;
    },

    /**
     * Update log entry (e.g. upon completion)
     * @param {number} id - Log ID
     * @param {Object} updates - Fields to update
     * @returns {Promise}
     */
    async update(id, updates) {
        const fields = [];
        const values = [];

        if (updates.status) {
            fields.push('status = ?');
            values.push(updates.status);
        }
        if (updates.end_time) {
            fields.push('end_time = ?');
            values.push(updates.end_time);
        }
        if (updates.duration_ms !== undefined) {
            fields.push('duration_ms = ?');
            values.push(updates.duration_ms);
        }
        if (updates.message) {
            fields.push('message = ?');
            values.push(updates.message);
        }
        if (updates.error_details) {
            fields.push('error_details = ?');
            values.push(updates.error_details);
        }

        if (fields.length === 0) {
            console.log(`[CronJobLog] No fields to update for log ID: ${id}`);
            return;
        }

        values.push(id);

        const query = `UPDATE cron_job_logs SET ${fields.join(', ')} WHERE id = ?`;
        console.log(`[CronJobLog] Updating log ID: ${id} with status: ${updates.status}`);
        const result = await db.run(query, values);
        console.log(`[CronJobLog] Update result for ID ${id}: ${result.changes} row(s) affected`);
        return result;
    },

    /**
     * Get logs for a specific job
     * @param {string} jobName - Job name
     * @param {number} limit - Limit
     * @returns {Promise<Array>}
     */
    async getLogsByJob(jobName, limit = 20) {
        return db.query(
            `SELECT * FROM cron_job_logs 
       WHERE job_name = ? 
       ORDER BY start_time DESC 
       LIMIT ?`,
            [jobName, limit]
        );
    },

    /**
     * Get last run for a job
     * @param {string} jobName
     * @returns {Promise<Object>}
     */
    async getLastRun(jobName) {
        return db.queryOne(
            `SELECT * FROM cron_job_logs 
       WHERE job_name = ? 
       ORDER BY start_time DESC 
       LIMIT 1`,
            [jobName]
        );
    },

    /**
    * Get recent logs across all jobs
    * @param {number} limit
    * @returns {Promise<Array>}
    */
    async getAllRecentLogs(limit = 50) {
        return db.query(
            `SELECT * FROM cron_job_logs 
       ORDER BY start_time DESC 
       LIMIT ?`,
            [limit]
        );
    }
};
