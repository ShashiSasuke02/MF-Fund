import { Router } from 'express';
import fundController from '../controllers/fund.controller.js';

const router = Router();

/**
 * @route GET /api/funds/search
 * @desc Search funds by name
 * @query q - Search query (required)
 */
router.get('/search', fundController.search);

/**
 * @route GET /api/funds/:schemeCode
 * @desc Get detailed fund information with performance metrics
 */
router.get('/:schemeCode', fundController.getDetails);

/**
 * @route GET /api/funds/:schemeCode/nav
 * @desc Get latest NAV for a fund
 */
router.get('/:schemeCode/nav', fundController.getLatestNAV);

/**
 * @route GET /api/funds/:schemeCode/history
 * @desc Get NAV history for a fund
 * @query startDate - Start date (YYYY-MM-DD)
 * @query endDate - End date (YYYY-MM-DD)
 * @query limit - Limit number of records returned
 */
router.get('/:schemeCode/history', fundController.getHistory);

export default router;
