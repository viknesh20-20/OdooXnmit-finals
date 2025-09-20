import { Router } from 'express';
import { BOMController } from '@presentation/controllers/BOMController';
import { BOMValidator } from '@presentation/validators/BOMValidator';
import { authenticateToken } from '@presentation/middleware/AuthMiddleware';

const router = Router();
const bomController = new BOMController();

// Apply authentication middleware to all BOM routes
router.use(authenticateToken);

/**
 * @route   GET /api/v1/boms
 * @desc    Get all BOMs with filtering, pagination, and search
 * @access  Private
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20, max: 100)
 * @query   {string} search - Search term for name, version, or description
 * @query   {string} product_id - Filter by product UUID
 * @query   {boolean} is_active - Filter by active status
 * @query   {boolean} is_default - Filter by default status
 * @query   {string} created_by - Filter by creator UUID
 * @query   {string} approved_by - Filter by approver UUID
 * @query   {string} sortBy - Sort field (name, version, is_active, is_default, created_at, approved_at)
 * @query   {string} sortOrder - Sort order (asc, desc) (default: desc)
 */
router.get(
  '/',
  BOMValidator.getBOMsValidation(),
  bomController.getBOMs.bind(bomController)
);

/**
 * @route   GET /api/v1/boms/:id
 * @desc    Get a single BOM by ID with components and operations
 * @access  Private
 * @param   {string} id - BOM UUID
 */
router.get(
  '/:id',
  BOMValidator.getBOMValidation(),
  bomController.getBOM.bind(bomController)
);

/**
 * @route   POST /api/v1/boms
 * @desc    Create a new BOM
 * @access  Private
 * @body    {object} bom - BOM data
 * @body    {string} bom.product_id - Product UUID (required)
 * @body    {string} bom.version - BOM version (required)
 * @body    {string} bom.name - BOM name (required)
 * @body    {string} [bom.description] - BOM description
 * @body    {boolean} [bom.is_active] - Active status (default: true)
 * @body    {boolean} [bom.is_default] - Default BOM for product (default: false)
 * @body    {string} bom.created_by - Creator UUID (required)
 * @body    {string} [bom.approved_by] - Approver UUID
 * @body    {string} [bom.approved_at] - Approval date (ISO 8601)
 * @body    {object} [bom.metadata] - Additional metadata
 */
router.post(
  '/',
  BOMValidator.createBOMValidation(),
  bomController.createBOM.bind(bomController)
);

/**
 * @route   PUT /api/v1/boms/:id
 * @desc    Update a BOM
 * @access  Private
 * @param   {string} id - BOM UUID
 * @body    {object} bom - BOM update data
 * @body    {string} [bom.product_id] - Product UUID
 * @body    {string} [bom.version] - BOM version
 * @body    {string} [bom.name] - BOM name
 * @body    {string} [bom.description] - BOM description
 * @body    {boolean} [bom.is_active] - Active status
 * @body    {boolean} [bom.is_default] - Default BOM for product
 * @body    {string} [bom.created_by] - Creator UUID
 * @body    {string} [bom.approved_by] - Approver UUID
 * @body    {string} [bom.approved_at] - Approval date (ISO 8601)
 * @body    {object} [bom.metadata] - Additional metadata
 */
router.put(
  '/:id',
  BOMValidator.updateBOMValidation(),
  bomController.updateBOM.bind(bomController)
);

/**
 * @route   DELETE /api/v1/boms/:id
 * @desc    Delete a BOM
 * @access  Private
 * @param   {string} id - BOM UUID
 */
router.delete(
  '/:id',
  BOMValidator.deleteBOMValidation(),
  bomController.deleteBOM.bind(bomController)
);

/**
 * @route   PUT /api/v1/boms/:id/approve
 * @desc    Approve a BOM and set it as active
 * @access  Private
 * @param   {string} id - BOM UUID
 * @body    {object} approval - Approval data
 * @body    {string} approval.approved_by - Approver UUID (required)
 */
router.put(
  '/:id/approve',
  BOMValidator.approveBOMValidation(),
  bomController.approveBOM.bind(bomController)
);

export default router;
