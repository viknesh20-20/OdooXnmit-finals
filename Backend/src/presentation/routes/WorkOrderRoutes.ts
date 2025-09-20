import { Router } from 'express';
import { WorkOrderController } from '@presentation/controllers/WorkOrderController';
import { WorkOrderValidator } from '@presentation/validators/WorkOrderValidator';
import { authenticateToken } from '@presentation/middleware/AuthMiddleware';

const router = Router();
const workOrderController = new WorkOrderController();

// Apply authentication middleware to all work order routes
router.use(authenticateToken);

/**
 * @route   GET /api/v1/work-orders
 * @desc    Get all work orders with filtering, pagination, and search
 * @access  Private
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20, max: 100)
 * @query   {string} search - Search term for work order number, operation, or instructions
 * @query   {string} status - Filter by status (pending, in_progress, paused, completed, cancelled)
 * @query   {string} work_center_id - Filter by work center UUID
 * @query   {string} manufacturing_order_id - Filter by manufacturing order UUID
 * @query   {string} assigned_to - Filter by assigned user UUID
 * @query   {string} priority - Filter by priority (low, medium, high, urgent)
 * @query   {string} sortBy - Sort field (wo_number, operation, status, priority, sequence, start_time, end_time, created_at)
 * @query   {string} sortOrder - Sort order (asc, desc) (default: asc)
 */
router.get(
  '/',
  WorkOrderValidator.getWorkOrdersValidation(),
  workOrderController.getWorkOrders.bind(workOrderController)
);

/**
 * @route   GET /api/v1/work-orders/:id
 * @desc    Get a single work order by ID
 * @access  Private
 * @param   {string} id - Work order UUID
 */
router.get(
  '/:id',
  WorkOrderValidator.getWorkOrderValidation(),
  workOrderController.getWorkOrder.bind(workOrderController)
);

/**
 * @route   POST /api/v1/work-orders
 * @desc    Create a new work order
 * @access  Private
 * @body    {object} workOrder - Work order data
 * @body    {string} [workOrder.wo_number] - Work order number (auto-generated if not provided)
 * @body    {string} workOrder.manufacturing_order_id - Manufacturing order UUID (required)
 * @body    {string} workOrder.work_center_id - Work center UUID (required)
 * @body    {string} workOrder.operation - Operation name (required)
 * @body    {string} [workOrder.operation_type] - Operation type
 * @body    {number} workOrder.duration - Duration in minutes (required)
 * @body    {number} [workOrder.estimated_duration] - Estimated duration in minutes
 * @body    {number} [workOrder.actual_duration] - Actual duration in minutes
 * @body    {string} [workOrder.status] - Status (default: pending)
 * @body    {string} [workOrder.priority] - Priority (default: medium)
 * @body    {string} [workOrder.assigned_to] - Assigned user UUID
 * @body    {number} workOrder.sequence - Operation sequence (required)
 * @body    {string} [workOrder.start_time] - Start time (ISO 8601)
 * @body    {string} [workOrder.end_time] - End time (ISO 8601)
 * @body    {number} [workOrder.pause_time] - Pause time in minutes (default: 0)
 * @body    {array} [workOrder.dependencies] - Array of dependent work order UUIDs
 * @body    {string} [workOrder.instructions] - Work instructions
 * @body    {string} [workOrder.comments] - Comments
 * @body    {array} [workOrder.quality_checks] - Quality check records
 * @body    {array} [workOrder.time_entries] - Time entry records
 * @body    {object} [workOrder.metadata] - Additional metadata
 */
router.post(
  '/',
  WorkOrderValidator.createWorkOrderValidation(),
  workOrderController.createWorkOrder.bind(workOrderController)
);

/**
 * @route   PUT /api/v1/work-orders/:id
 * @desc    Update a work order
 * @access  Private
 * @param   {string} id - Work order UUID
 * @body    {object} workOrder - Work order update data
 * @body    {string} [workOrder.wo_number] - Work order number
 * @body    {string} [workOrder.manufacturing_order_id] - Manufacturing order UUID
 * @body    {string} [workOrder.work_center_id] - Work center UUID
 * @body    {string} [workOrder.operation] - Operation name
 * @body    {string} [workOrder.operation_type] - Operation type
 * @body    {number} [workOrder.duration] - Duration in minutes
 * @body    {number} [workOrder.estimated_duration] - Estimated duration in minutes
 * @body    {number} [workOrder.actual_duration] - Actual duration in minutes
 * @body    {string} [workOrder.status] - Status
 * @body    {string} [workOrder.priority] - Priority
 * @body    {string} [workOrder.assigned_to] - Assigned user UUID
 * @body    {number} [workOrder.sequence] - Operation sequence
 * @body    {string} [workOrder.start_time] - Start time (ISO 8601)
 * @body    {string} [workOrder.end_time] - End time (ISO 8601)
 * @body    {number} [workOrder.pause_time] - Pause time in minutes
 * @body    {array} [workOrder.dependencies] - Array of dependent work order UUIDs
 * @body    {string} [workOrder.instructions] - Work instructions
 * @body    {string} [workOrder.comments] - Comments
 * @body    {array} [workOrder.quality_checks] - Quality check records
 * @body    {array} [workOrder.time_entries] - Time entry records
 * @body    {object} [workOrder.metadata] - Additional metadata
 */
router.put(
  '/:id',
  WorkOrderValidator.updateWorkOrderValidation(),
  workOrderController.updateWorkOrder.bind(workOrderController)
);

/**
 * @route   DELETE /api/v1/work-orders/:id
 * @desc    Delete a work order
 * @access  Private
 * @param   {string} id - Work order UUID
 */
router.delete(
  '/:id',
  WorkOrderValidator.deleteWorkOrderValidation(),
  workOrderController.deleteWorkOrder.bind(workOrderController)
);

/**
 * @route   PUT /api/v1/work-orders/:id/status
 * @desc    Update work order status with automatic time tracking
 * @access  Private
 * @param   {string} id - Work order UUID
 * @body    {object} statusUpdate - Status update data
 * @body    {string} statusUpdate.status - New status (required)
 * @body    {string} [statusUpdate.comments] - Comments about the status change
 */
router.put(
  '/:id/status',
  WorkOrderValidator.updateStatusValidation(),
  workOrderController.updateStatus.bind(workOrderController)
);

/**
 * @route   POST /api/v1/work-orders/:id/time-entries
 * @desc    Add a time entry to a work order
 * @access  Private
 * @param   {string} id - Work order UUID
 * @body    {object} timeEntry - Time entry data
 * @body    {string} timeEntry.start_time - Start time (ISO 8601) (required)
 * @body    {string} timeEntry.end_time - End time (ISO 8601) (required)
 * @body    {number} timeEntry.duration - Duration in minutes (required)
 * @body    {string} [timeEntry.description] - Description of the work performed
 * @body    {string} timeEntry.user_id - User who performed the work (required)
 */
router.post(
  '/:id/time-entries',
  WorkOrderValidator.addTimeEntryValidation(),
  workOrderController.addTimeEntry.bind(workOrderController)
);

export default router;
