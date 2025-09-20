import { Router } from 'express';
import { StockMovementController } from '@presentation/controllers/StockMovementController';
import { StockMovementValidator } from '@presentation/validators/StockMovementValidator';
import { authenticateToken } from '@presentation/middleware/AuthMiddleware';

const router = Router();
const stockMovementController = new StockMovementController();

// Apply authentication middleware to all stock movement routes
router.use(authenticateToken);

/**
 * @route   GET /api/v1/stock-movements
 * @desc    Get all stock movements with filtering, pagination, and search
 * @access  Private
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20, max: 100)
 * @query   {string} search - Search term for reference, notes, or batch number
 * @query   {string} product_id - Filter by product UUID
 * @query   {string} type - Filter by movement type (in, out, adjustment, transfer)
 * @query   {string} reference_type - Filter by reference type (purchase_order, sales_order, manufacturing_order, adjustment, transfer, return)
 * @query   {string} from_location - Filter by source location
 * @query   {string} to_location - Filter by destination location
 * @query   {string} processed_by - Filter by processor UUID
 * @query   {string} start_date - Filter by start date (ISO 8601)
 * @query   {string} end_date - Filter by end date (ISO 8601)
 * @query   {string} sortBy - Sort field (timestamp, type, quantity, unit_cost, total_value, running_balance, created_at)
 * @query   {string} sortOrder - Sort order (asc, desc) (default: desc)
 */
router.get(
  '/',
  StockMovementValidator.getStockMovementsValidation(),
  stockMovementController.getStockMovements.bind(stockMovementController)
);

/**
 * @route   GET /api/v1/stock-movements/product/:productId/balance
 * @desc    Get current stock balance for a specific product
 * @access  Private
 * @param   {string} productId - Product UUID
 */
router.get(
  '/product/:productId/balance',
  StockMovementValidator.getProductBalanceValidation(),
  stockMovementController.getProductBalance.bind(stockMovementController)
);

/**
 * @route   GET /api/v1/stock-movements/:id
 * @desc    Get a single stock movement by ID
 * @access  Private
 * @param   {string} id - Stock movement UUID
 */
router.get(
  '/:id',
  StockMovementValidator.getStockMovementValidation(),
  stockMovementController.getStockMovement.bind(stockMovementController)
);

/**
 * @route   POST /api/v1/stock-movements
 * @desc    Create a new stock movement
 * @access  Private
 * @body    {object} stockMovement - Stock movement data
 * @body    {string} stockMovement.product_id - Product UUID (required)
 * @body    {string} stockMovement.type - Movement type: in, out, adjustment, transfer (required)
 * @body    {number} stockMovement.quantity - Quantity moved (required)
 * @body    {string} stockMovement.unit - Unit of measurement (required)
 * @body    {number} [stockMovement.unit_cost] - Cost per unit
 * @body    {number} [stockMovement.total_value] - Total value (auto-calculated if unit_cost provided)
 * @body    {string} stockMovement.reference - Reference number (required)
 * @body    {string} stockMovement.reference_type - Reference type (required)
 * @body    {string} [stockMovement.from_location] - Source location
 * @body    {string} [stockMovement.to_location] - Destination location
 * @body    {string} [stockMovement.timestamp] - Movement timestamp (ISO 8601, default: now)
 * @body    {string} [stockMovement.processed_by] - Processor UUID
 * @body    {string} [stockMovement.notes] - Additional notes
 * @body    {string} [stockMovement.batch_number] - Batch number
 * @body    {string} [stockMovement.expiry_date] - Expiry date (ISO 8601)
 * @body    {object} [stockMovement.metadata] - Additional metadata
 */
router.post(
  '/',
  StockMovementValidator.createStockMovementValidation(),
  stockMovementController.createStockMovement.bind(stockMovementController)
);

/**
 * @route   PUT /api/v1/stock-movements/:id
 * @desc    Update a stock movement
 * @access  Private
 * @param   {string} id - Stock movement UUID
 * @body    {object} stockMovement - Stock movement update data
 * @body    {string} [stockMovement.product_id] - Product UUID
 * @body    {string} [stockMovement.type] - Movement type
 * @body    {number} [stockMovement.quantity] - Quantity moved
 * @body    {string} [stockMovement.unit] - Unit of measurement
 * @body    {number} [stockMovement.unit_cost] - Cost per unit
 * @body    {number} [stockMovement.total_value] - Total value
 * @body    {string} [stockMovement.reference] - Reference number
 * @body    {string} [stockMovement.reference_type] - Reference type
 * @body    {string} [stockMovement.from_location] - Source location
 * @body    {string} [stockMovement.to_location] - Destination location
 * @body    {string} [stockMovement.timestamp] - Movement timestamp (ISO 8601)
 * @body    {string} [stockMovement.processed_by] - Processor UUID
 * @body    {string} [stockMovement.notes] - Additional notes
 * @body    {string} [stockMovement.batch_number] - Batch number
 * @body    {string} [stockMovement.expiry_date] - Expiry date (ISO 8601)
 * @body    {object} [stockMovement.metadata] - Additional metadata
 */
router.put(
  '/:id',
  StockMovementValidator.updateStockMovementValidation(),
  stockMovementController.updateStockMovement.bind(stockMovementController)
);

/**
 * @route   DELETE /api/v1/stock-movements/:id
 * @desc    Delete a stock movement
 * @access  Private
 * @param   {string} id - Stock movement UUID
 */
router.delete(
  '/:id',
  StockMovementValidator.deleteStockMovementValidation(),
  stockMovementController.deleteStockMovement.bind(stockMovementController)
);

export default router;
