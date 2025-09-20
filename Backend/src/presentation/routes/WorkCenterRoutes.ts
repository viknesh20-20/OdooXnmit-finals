import { Router } from 'express';
import { WorkCenterController } from '@presentation/controllers/WorkCenterController';
import { WorkCenterValidator } from '@presentation/validators/WorkCenterValidator';
import { authenticateToken } from '@presentation/middleware/AuthMiddleware';

const router = Router();
const workCenterController = new WorkCenterController();

// Apply authentication middleware to all work center routes
router.use(authenticateToken);

/**
 * @route   GET /api/v1/work-centers
 * @desc    Get all work centers with filtering, pagination, and search
 * @access  Private
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20, max: 100)
 * @query   {string} search - Search term for name, code, or description
 * @query   {string} status - Filter by status (active, inactive, maintenance)
 * @query   {string} location - Filter by location
 * @query   {string} sortBy - Sort field (name, code, status, utilization, efficiency, created_at)
 * @query   {string} sortOrder - Sort order (asc, desc) (default: asc)
 */
router.get(
  '/',
  WorkCenterValidator.getWorkCentersValidation(),
  workCenterController.getWorkCenters.bind(workCenterController)
);

/**
 * @route   GET /api/v1/work-centers/:id
 * @desc    Get a single work center by ID
 * @access  Private
 * @param   {string} id - Work center UUID
 */
router.get(
  '/:id',
  WorkCenterValidator.getWorkCenterValidation(),
  workCenterController.getWorkCenter.bind(workCenterController)
);

/**
 * @route   POST /api/v1/work-centers
 * @desc    Create a new work center
 * @access  Private
 * @body    {object} workCenter - Work center data
 * @body    {string} workCenter.code - Work center code (required, unique)
 * @body    {string} workCenter.name - Work center name (required)
 * @body    {string} [workCenter.description] - Work center description
 * @body    {number} workCenter.cost_per_hour - Cost per hour (required)
 * @body    {number} workCenter.capacity - Capacity (required)
 * @body    {number} [workCenter.efficiency] - Efficiency percentage (0-100)
 * @body    {string} [workCenter.status] - Status (active, inactive, maintenance)
 * @body    {number} [workCenter.utilization] - Utilization percentage (0-100)
 * @body    {string} [workCenter.location] - Location
 * @body    {number} [workCenter.availability] - Availability percentage (0-100)
 * @body    {string} [workCenter.maintenance_schedule] - Maintenance schedule
 * @body    {string} [workCenter.next_maintenance] - Next maintenance date
 * @body    {array} [workCenter.operator_ids] - Array of operator UUIDs
 * @body    {array} [workCenter.capabilities] - Array of capabilities
 * @body    {object} [workCenter.working_hours] - Working hours schedule
 * @body    {number} [workCenter.oee_score] - OEE score (0-100)
 * @body    {number} [workCenter.downtime_hours] - Downtime hours
 * @body    {number} [workCenter.productive_hours] - Productive hours
 * @body    {object} [workCenter.metadata] - Additional metadata
 */
router.post(
  '/',
  WorkCenterValidator.createWorkCenterValidation(),
  workCenterController.createWorkCenter.bind(workCenterController)
);

/**
 * @route   PUT /api/v1/work-centers/:id
 * @desc    Update an existing work center
 * @access  Private
 * @param   {string} id - Work center UUID
 * @body    {object} workCenter - Work center data (all fields optional)
 * @body    {string} [workCenter.code] - Work center code (must be unique)
 * @body    {string} [workCenter.name] - Work center name
 * @body    {string} [workCenter.description] - Work center description
 * @body    {number} [workCenter.cost_per_hour] - Cost per hour
 * @body    {number} [workCenter.capacity] - Capacity
 * @body    {number} [workCenter.efficiency] - Efficiency percentage (0-100)
 * @body    {string} [workCenter.status] - Status (active, inactive, maintenance)
 * @body    {number} [workCenter.utilization] - Utilization percentage (0-100)
 * @body    {string} [workCenter.location] - Location
 * @body    {number} [workCenter.availability] - Availability percentage (0-100)
 * @body    {string} [workCenter.maintenance_schedule] - Maintenance schedule
 * @body    {string} [workCenter.next_maintenance] - Next maintenance date
 * @body    {array} [workCenter.operator_ids] - Array of operator UUIDs
 * @body    {array} [workCenter.capabilities] - Array of capabilities
 * @body    {object} [workCenter.working_hours] - Working hours schedule
 * @body    {number} [workCenter.oee_score] - OEE score (0-100)
 * @body    {number} [workCenter.downtime_hours] - Downtime hours
 * @body    {number} [workCenter.productive_hours] - Productive hours
 * @body    {object} [workCenter.metadata] - Additional metadata
 */
router.put(
  '/:id',
  WorkCenterValidator.updateWorkCenterValidation(),
  workCenterController.updateWorkCenter.bind(workCenterController)
);

/**
 * @route   DELETE /api/v1/work-centers/:id
 * @desc    Delete a work center (soft delete - sets status to inactive)
 * @access  Private
 * @param   {string} id - Work center UUID
 */
router.delete(
  '/:id',
  WorkCenterValidator.deleteWorkCenterValidation(),
  workCenterController.deleteWorkCenter.bind(workCenterController)
);

/**
 * @route   PUT /api/v1/work-centers/:id/utilization
 * @desc    Update work center utilization metrics
 * @access  Private
 * @param   {string} id - Work center UUID
 * @body    {object} utilization - Utilization data
 * @body    {number} utilization.utilization - Utilization percentage (required, 0-100)
 * @body    {number} [utilization.oee_score] - OEE score (0-100)
 * @body    {number} [utilization.downtime_hours] - Downtime hours
 * @body    {number} [utilization.productive_hours] - Productive hours
 */
router.put(
  '/:id/utilization',
  WorkCenterValidator.updateUtilizationValidation(),
  workCenterController.updateUtilization.bind(workCenterController)
);

export default router;
