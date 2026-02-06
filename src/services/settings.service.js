import { queryOne, run } from '../db/database.js';
import logger from './logger.service.js';
import logger from './logger.service.js';

/**
 * Settings Service - Manages dynamic system settings with caching
 */
class SettingsService {
    constructor() {
        this.cache = new Map();  // In-memory cache
        this.cacheTTL = 60 * 1000;  // 1 minute cache
    }

    /**
     * Get a setting value by key
     * @param {string} key - Setting key
     * @param {string} defaultValue - Default if not found
     * @returns {Promise<string|null>}
     */
    async get(key, defaultValue = null) {
        // Check cache first
        const cached = this.cache.get(key);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.value;
        }

        // Query database
        try {
            const row = await queryOne(
                'SELECT setting_value FROM system_settings WHERE setting_key = ?',
                [key]
            );

            const value = row?.setting_value ?? defaultValue;

            // Update cache
            this.cache.set(key, {
                value,
                expiresAt: Date.now() + this.cacheTTL
            });

            return value;
        } catch (error) {
            logger.error(`[SettingsService] Get Error: ${error.message}`);
            return defaultValue;
        }
    }

    /**
     * Set a setting value (upsert)
     * @param {string} key - Setting key
     * @param {string} value - Setting value
     * @param {string} description - Optional description
     */
    async set(key, value, description = null) {
        try {
            await run(`
                INSERT INTO system_settings (setting_key, setting_value, description, updated_at)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE 
                    setting_value = VALUES(setting_value),
                    description = COALESCE(VALUES(description), description),
                    updated_at = VALUES(updated_at)
            `, [key, value, description, Date.now()]);

            // Invalidate cache
            this.cache.delete(key);

            return true;
        } catch (error) {
            logger.error(`[SettingsService] Set Error: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get all settings
     * @returns {Promise<Object>}
     */
    async getAll() {
        try {
            const { query } = await import('../db/database.js');
            const rows = await query('SELECT setting_key, setting_value, description, updated_at FROM system_settings');

            const settings = {};
            for (const row of rows) {
                settings[row.setting_key] = {
                    value: row.setting_value,
                    description: row.description,
                    updatedAt: row.updated_at
                };
            }

            return settings;
        } catch (error) {
            logger.error(`[SettingsService] GetAll Error: ${error.message}`);
            return {};
        }
    }

    /**
     * Check if AI is enabled
     * @returns {Promise<boolean>}
     */
    async isAiEnabled() {
        const value = await this.get('ai_enabled', 'true');
        return value === 'true';
    }

    /**
     * Get active AI model name
     * @returns {Promise<string>}
     */
    async getAiModel() {
        const value = await this.get('ai_model', null);
        return value || process.env.OLLAMA_MODEL_NAME || 'qwen2.5:0.5b-instruct';
    }

    /**
     * Clear cache (force fresh data)
     */
    clearCache() {
        this.cache.clear();
    }
}

export const settingsService = new SettingsService();
export default settingsService;
