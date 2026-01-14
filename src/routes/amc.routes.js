import { Router } from 'express';
import amcController from '../controllers/amc.controller.js';

const router = Router();

/**
 * @route GET /api/amcs
 * @desc Get all AMCs
 */
router.get('/', amcController.getAll);

/**
 * @route GET /api/amcs/:fundHouse
 * @desc Get single AMC by fund house name
 */
router.get('/:fundHouse', amcController.getOne);

/**
 * @route GET /api/amcs/:fundHouse/funds
 * @desc Get all funds for a specific AMC
 * @query search - Filter by scheme name
 * @query category - Filter by scheme category
 * @query sort - Sort order (name_asc, name_desc, nav_asc, nav_desc)
 */
router.get('/:fundHouse/funds', amcController.getFunds);

export default router;
