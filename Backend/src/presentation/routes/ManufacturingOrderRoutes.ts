import { Router } from 'express';
import { ManufacturingOrderController } from '@presentation/controllers/ManufacturingOrderController';
import { ManufacturingOrderValidator } from '@presentation/validators/ManufacturingOrderValidator';
import { authenticateToken } from '@presentation/middleware/AuthMiddleware';

const router = Router();
const manufacturingOrderController = new ManufacturingOrderController();

// Apply authentication middleware to all manufacturing order routes
router.use(authenticateToken);

/**
 * @route   GET /api/v1/manufacturing-orders
 * @desc    Get all manufacturing orders with filtering, pagination, and search
 * @access  Private
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20, max: 100)
 * @query   {string} search - Search term for MO number or notes
 * @query   {string} status - Filter by status (draft, planned, released, in_progress, paused, completed, cancelled)
 * @query   {string} product_id - Filter by product UUID
 * @query   {string} priority - Filter by priority (low, medium, high, urgent)
 * @query   {string} created_by - Filter by creator UUID
 * @query   {string} assigned_to - Filter by assignee UUID
 * @query   {string} sortBy - Sort field (mo_number, status, priority, planned_start_date, planned_end_date, created_at)
 * @query   {string} sortOrder - Sort order (asc, desc) (default: desc)
 */
router.get(
  '/',
  ManufacturingOrderValidator.getManufacturingOrdersValidation(),
  manufacturingOrderController.getManufacturingOrders.bind(manufacturingOrderController)
);

/**
 * @route   GET /api/v1/manufacturing-orders/:id
 * @desc    Get a single manufacturing order by ID with associated work orders
 * @access  Private
 * @param   {string} id - Manufacturing order UUID
 */
router.get(
  '/:id',
  ManufacturingOrderValidator.getManufacturingOrderValidation(),
  manufacturingOrderController.getManufacturingOrder.bind(manufacturingOrderController)
);

/**
 * @route   POST /api/v1/manufacturing-orders
 * @desc    Create a new manufacturing order
 * @access  Private
 * @body    {object} manufacturingOrder - Manufacturing order data
 * @body    {string} [manufacturingOrder.mo_number] - MO number (auto-generated if not provided)
 * @body    {string} manufacturingOrder.product_id - Product UUID (required)
 * @body    {string} manufacturingOrder.bom_id - BOM UUID (required)
 * @body    {number} manufacturingOrder.quantity - Quantity to produce (required)
 * @body    {string} manufacturingOrder.quantity_unit - Unit of measurement (required)
 * @body    {string} [manufacturingOrder.status] - Status (default: draft)
 * @body    {string} [manufacturingOrder.priority] - Priority (default: medium)
 * @body    {string} [manufacturingOrder.planned_start_date] - Planned start date (ISO 8601)
 * @body    {string} [manufacturingOrder.planned_end_date] - Planned end date (ISO 8601)
 * @body    {string} [manufacturingOrder.actual_start_date] - Actual start date (ISO 8601)
 * @body    {string} [manufacturingOrder.actual_end_date] - Actual end date (ISO 8601)
 * @body    {string} manufacturingOrder.created_by - Creator UUID (required)
 * @body    {string} [manufacturingOrder.assigned_to] - Assignee UUID
 * @body    {string} [manufacturingOrder.notes] - Notes
 * @body    {object} [manufacturingOrder.metadata] - Additional metadata
 */
router.post(
  '/',
  ManufacturingOrderValidator.createManufacturingOrderValidation(),
  manufacturingOrderController.createManufacturingOrder.bind(manufacturingOrderController)
);

/**
 * @route   PUT /api/v1/manufacturing-orders/:id
 * @desc    Update a manufacturing order
 * @access  Private
 * @param   {string} id - Manufacturing order UUID
 * @body    {object} manufacturingOrder - Manufacturing order update data
 * @body    {string} [manufacturingOrder.mo_number] - MO number
 * @body    {string} [manufacturingOrder.product_id] - Product UUID
 * @body    {string} [manufacturingOrder.bom_id] - BOM UUID
 * @body    {number} [manufacturingOrder.quantity] - Quantity to produce
 * @body    {string} [manufacturingOrder.quantity_unit] - Unit of measurement
 * @body    {string} [manufacturingOrder.status] - Status
 * @body    {string} [manufacturingOrder.priority] - Priority
 * @body    {string} [manufacturingOrder.planned_start_date] - Planned start date (ISO 8601)
 * @body    {string} [manufacturingOrder.planned_end_date] - Planned end date (ISO 8601)
 * @body    {string} [manufacturingOrder.actual_start_date] - Actual start date (ISO 8601)
 * @body    {string} [manufacturingOrder.actual_end_date] - Actual end date (ISO 8601)
 * @body    {string} [manufacturingOrder.created_by] - Creator UUID
 * @body    {string} [manufacturingOrder.assigned_to] - Assignee UUID
 * @body    {string} [manufacturingOrder.notes] - Notes
 * @body    {object} [manufacturingOrder.metadata] - Additional metadata
 */
router.put(
  '/:id',
  ManufacturingOrderValidator.updateManufacturingOrderValidation(),
  manufacturingOrderController.updateManufacturingOrder.bind(manufacturingOrderController)
);

/**
 * @route   DELETE /api/v1/manufacturing-orders/:id
 * @desc    Delete a manufacturing order (only if no associated work orders)
 * @access  Private
 * @param   {string} id - Manufacturing order UUID
 */
router.delete(
  '/:id',
  ManufacturingOrderValidator.deleteManufacturingOrderValidation(),
  manufacturingOrderController.deleteManufacturingOrder.bind(manufacturingOrderController)
);

export default router;
