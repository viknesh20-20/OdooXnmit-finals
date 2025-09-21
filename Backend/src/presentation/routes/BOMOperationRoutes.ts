import { Router } from 'express';
import { BOMOperationController } from '@presentation/controllers/BOMOperationController';
import { BOMOperationValidator } from '@presentation/validators/BOMOperationValidator';
import { authenticateToken } from '@presentation/middleware/AuthMiddleware';

const router = Router();
const bomOperationController = new BOMOperationController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * @route   GET /api/v1/bom-operations
 * @desc    Get all BOM operations with optional filtering
 * @access  Private
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20)
 * @query   {string} search - Search term for operation name
 * @query   {string} bom_id - Filter by BOM ID
 * @query   {string} operation_type - Filter by operation type
 * @query   {string} work_center_id - Filter by work center ID
 * @query   {string} sortBy - Sort field (default: sequence)
 * @query   {string} sortOrder - Sort order (asc, desc) (default: asc)
 */
router.get(
  '/',
  BOMOperationValidator.getBOMOperationsValidation(),
  bomOperationController.getBOMOperations.bind(bomOperationController)
);

/**
 * @route   GET /api/v1/bom-operations/:id
 * @desc    Get a single BOM operation by ID
 * @access  Private
 * @param   {string} id - BOM Operation UUID
 */
router.get(
  '/:id',
  BOMOperationValidator.getBOMOperationValidation(),
  bomOperationController.getBOMOperation.bind(bomOperationController)
);

/**
 * @route   GET /api/v1/bom-operations/bom/:bomId
 * @desc    Get all operations for a specific BOM
 * @access  Private
 * @param   {string} bomId - BOM UUID
 */
router.get(
  '/bom/:bomId',
  BOMOperationValidator.getBOMOperationsByBOMValidation(),
  bomOperationController.getBOMOperationsByBOM.bind(bomOperationController)
);

/**
 * @route   POST /api/v1/bom-operations
 * @desc    Create a new BOM operation
 * @access  Private
 * @body    {object} operation - BOM operation data
 * @body    {string} operation.bom_id - BOM UUID (required)
 * @body    {string} operation.operation - Operation name (required, 1-255 chars)
 * @body    {string} [operation.operation_type] - Operation type (1-100 chars)
 * @body    {string} [operation.work_center_id] - Work center UUID
 * @body    {number} operation.duration - Duration in minutes (required, min: 1)
 * @body    {number} [operation.setup_time] - Setup time in minutes (default: 0)
 * @body    {number} [operation.teardown_time] - Teardown time in minutes (default: 0)
 * @body    {number} [operation.cost_per_hour] - Cost per hour (default: 0.00)
 * @body    {number} operation.sequence - Operation sequence (required, min: 1)
 * @body    {string} [operation.description] - Operation description
 * @body    {string} [operation.instructions] - Operation instructions
 * @body    {array} [operation.quality_requirements] - Quality requirements array
 * @body    {array} [operation.tools_required] - Required tools array
 * @body    {array} [operation.skills_required] - Required skills array
 * @body    {object} [operation.metadata] - Additional metadata
 */
router.post(
  '/',
  BOMOperationValidator.createBOMOperationValidation(),
  bomOperationController.createBOMOperation.bind(bomOperationController)
);

/**
 * @route   PUT /api/v1/bom-operations/:id
 * @desc    Update a BOM operation
 * @access  Private
 * @param   {string} id - BOM Operation UUID
 * @body    {object} operation - BOM operation update data (same as create, all optional)
 */
router.put(
  '/:id',
  BOMOperationValidator.updateBOMOperationValidation(),
  bomOperationController.updateBOMOperation.bind(bomOperationController)
);

/**
 * @route   DELETE /api/v1/bom-operations/:id
 * @desc    Delete a BOM operation
 * @access  Private
 * @param   {string} id - BOM Operation UUID
 */
router.delete(
  '/:id',
  BOMOperationValidator.deleteBOMOperationValidation(),
  bomOperationController.deleteBOMOperation.bind(bomOperationController)
);

/**
 * @route   PUT /api/v1/bom-operations/bom/:bomId/reorder
 * @desc    Reorder operations for a BOM
 * @access  Private
 * @param   {string} bomId - BOM UUID
 * @body    {array} operations - Array of operation IDs in new order
 * @body    {string} operations[].id - Operation UUID
 * @body    {number} operations[].sequence - New sequence number
 */
router.put(
  '/bom/:bomId/reorder',
  BOMOperationValidator.reorderBOMOperationsValidation(),
  bomOperationController.reorderBOMOperations.bind(bomOperationController)
);

export default router;
