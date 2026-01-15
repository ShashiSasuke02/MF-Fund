import { Router } from 'express';
import cacheService from '../services/cache.service.js';

const router = Router();

/**
 * @route GET /api/health
 * @desc Health check endpoint
 */
router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'healthy',
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
