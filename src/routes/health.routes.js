import { Router } from 'express';
import { query } from '../db/database.js';
import cacheService from '../services/cache.service.js';

const router = Router();

/**
 * @route GET /api/health
 * @desc Health check endpoint
 */
router.get('/', async (req, res) => {
  let dbStatus = 'connected';
  try {
    await query('SELECT 1');
  } catch (err) {
    dbStatus = 'disconnected';
  }

  const isHealthy = dbStatus === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    data: {
      status: isHealthy ? 'healthy' : 'unhealthy',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

/**
 * @route GET /api/health/cache
 * @desc Get cache statistics
 */
router.get('/cache', async (req, res) => {
  const stats = await cacheService.getStats();
  res.json({
    success: true,
    data: {
      cache: stats,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * @route POST /api/health/cache/clear
 * @desc Clear expired cache entries
 */
router.post('/cache/clear', async (req, res) => {
  const cleared = await cacheService.clearExpired();
  res.json({
    success: true,
    data: {
      clearedEntries: cleared,
      timestamp: new Date().toISOString()
    }
  });
});

export default router;
