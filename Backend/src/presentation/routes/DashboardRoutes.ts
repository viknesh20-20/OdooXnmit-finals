import { Router } from 'express';
import { resolve } from '@infrastructure/di/Container';
import { DashboardController } from '@presentation/controllers/DashboardController';
import { AuthMiddleware } from '@presentation/middleware/AuthMiddleware';

const router = Router();
const dashboardController = resolve<DashboardController>('DashboardController');
const authMiddleware = resolve<AuthMiddleware>('AuthMiddleware');

// All dashboard routes require authentication
router.use(authMiddleware.authenticate);

/**
 * @route GET /api/v1/dashboard
 * @desc Get consolidated dashboard data including user profile, statistics, and recent activity
 * @access Private
 * @returns {Object} Dashboard data with user info, summaries, recent activity, and alerts
 */
router.get('/', dashboardController.getDashboardData.bind(dashboardController));

export default router;
