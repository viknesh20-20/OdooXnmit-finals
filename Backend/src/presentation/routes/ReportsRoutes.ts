import { Router } from 'express';
import { ReportsController } from '@presentation/controllers/ReportsController';
import { ReportsValidator } from '@presentation/validators/ReportsValidator';
import { authenticateToken } from '@presentation/middleware/AuthMiddleware';

const router = Router();
const reportsController = new ReportsController();

// Apply authentication middleware to all report routes
router.use(authenticateToken);

/**
 * @route   GET /api/v1/reports/production-summary
 * @desc    Get production summary report with manufacturing and work order statistics
 * @access  Private
 * @query   {string} start_date - Start date for report period (ISO 8601)
 * @query   {string} end_date - End date for report period (ISO 8601)
 */
router.get(
  '/production-summary',
  ReportsValidator.getProductionSummaryValidation(),
  reportsController.getProductionSummary.bind(reportsController)
);

/**
 * @route   GET /api/v1/reports/work-center-utilization
 * @desc    Get work center utilization report with capacity and efficiency metrics
 * @access  Private
 * @query   {string} start_date - Start date for report period (ISO 8601)
 * @query   {string} end_date - End date for report period (ISO 8601)
 * @query   {string} work_center_id - Filter by specific work center UUID
 */
router.get(
  '/work-center-utilization',
  ReportsValidator.getWorkCenterUtilizationValidation(),
  reportsController.getWorkCenterUtilization.bind(reportsController)
);

/**
 * @route   GET /api/v1/reports/inventory-summary
 * @desc    Get inventory summary report with current stock levels and values
 * @access  Private
 * @query   {string} product_id - Filter by specific product UUID
 */
router.get(
  '/inventory-summary',
  ReportsValidator.getInventorySummaryValidation(),
  reportsController.getInventorySummary.bind(reportsController)
);

/**
 * @route   GET /api/v1/reports/production-efficiency
 * @desc    Get production efficiency report with performance metrics and trends
 * @access  Private
 * @query   {string} start_date - Start date for report period (ISO 8601)
 * @query   {string} end_date - End date for report period (ISO 8601)
 */
router.get(
  '/production-efficiency',
  ReportsValidator.getProductionEfficiencyValidation(),
  reportsController.getProductionEfficiency.bind(reportsController)
);

/**
 * @route   GET /api/v1/reports/export/:reportType
 * @desc    Export report data in specified format (JSON or CSV)
 * @access  Private
 * @param   {string} reportType - Type of report to export (production-summary, work-center-utilization, inventory-summary, production-efficiency)
 * @query   {string} format - Export format (json, csv) (default: json)
 * @query   {string} start_date - Start date for report period (ISO 8601)
 * @query   {string} end_date - End date for report period (ISO 8601)
 * @query   {string} work_center_id - Filter by specific work center UUID (for utilization reports)
 * @query   {string} product_id - Filter by specific product UUID (for inventory reports)
 */
router.get(
  '/export/:reportType',
  ReportsValidator.exportReportValidation(),
  reportsController.exportReport.bind(reportsController)
);

export default router;
