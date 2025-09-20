import { body, param, query, ValidationChain } from 'express-validator';

export class StockMovementValidator {
  /**
   * Validation for GET /api/v1/stock-movements
   */
  static getStockMovementsValidation(): ValidationChain[] {
    return [
      query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
      
      query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
      
      query('search')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Search term must be between 1 and 255 characters'),
      
      query('product_id')
        .optional()
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
      
      query('type')
        .optional()
        .isIn(['in', 'out', 'adjustment', 'transfer'])
        .withMessage('Type must be one of: in, out, adjustment, transfer'),
      
      query('reference_type')
        .optional()
        .isIn(['purchase_order', 'sales_order', 'manufacturing_order', 'adjustment', 'transfer', 'return'])
        .withMessage('Reference type must be one of: purchase_order, sales_order, manufacturing_order, adjustment, transfer, return'),
      
      query('from_location')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('From location must be between 1 and 100 characters'),
      
      query('to_location')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('To location must be between 1 and 100 characters'),
      
      query('processed_by')
        .optional()
        .isUUID()
        .withMessage('Processed by must be a valid UUID'),
      
      query('start_date')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
      
      query('end_date')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date'),
      
      query('sortBy')
        .optional()
        .isIn(['timestamp', 'type', 'quantity', 'unit_cost', 'total_value', 'running_balance', 'created_at'])
        .withMessage('Sort by must be a valid field'),
      
      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),
    ];
  }

  /**
   * Validation for GET /api/v1/stock-movements/:id
   */
  static getStockMovementValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('Stock movement ID must be a valid UUID'),
    ];
  }

  /**
   * Validation for POST /api/v1/stock-movements
   */
  static createStockMovementValidation(): ValidationChain[] {
    return [
      body('product_id')
        .notEmpty()
        .isUUID()
        .withMessage('Product ID is required and must be a valid UUID'),
      
      body('type')
        .notEmpty()
        .isIn(['in', 'out', 'adjustment', 'transfer'])
        .withMessage('Type is required and must be one of: in, out, adjustment, transfer'),
      
      body('quantity')
        .notEmpty()
        .isFloat({ min: 0.01 })
        .withMessage('Quantity is required and must be a positive number'),
      
      body('unit')
        .notEmpty()
        .isString()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Unit is required and must be between 1 and 20 characters'),
      
      body('unit_cost')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Unit cost must be a non-negative number'),
      
      body('total_value')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Total value must be a non-negative number'),
      
      body('reference')
        .notEmpty()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Reference is required and must be between 1 and 100 characters'),
      
      body('reference_type')
        .notEmpty()
        .isIn(['purchase_order', 'sales_order', 'manufacturing_order', 'adjustment', 'transfer', 'return'])
        .withMessage('Reference type is required and must be one of: purchase_order, sales_order, manufacturing_order, adjustment, transfer, return'),
      
      body('from_location')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('From location must be between 1 and 100 characters'),
      
      body('to_location')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('To location must be between 1 and 100 characters'),
      
      body('timestamp')
        .optional()
        .isISO8601()
        .withMessage('Timestamp must be a valid ISO 8601 date'),
      
      body('processed_by')
        .optional()
        .isUUID()
        .withMessage('Processed by must be a valid UUID'),
      
      body('notes')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes must be at most 1000 characters'),
      
      body('batch_number')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Batch number must be between 1 and 50 characters'),
      
      body('expiry_date')
        .optional()
        .isISO8601()
        .withMessage('Expiry date must be a valid ISO 8601 date'),
      
      body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
    ];
  }

  /**
   * Validation for PUT /api/v1/stock-movements/:id
   */
  static updateStockMovementValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('Stock movement ID must be a valid UUID'),
      
      body('product_id')
        .optional()
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
      
      body('type')
        .optional()
        .isIn(['in', 'out', 'adjustment', 'transfer'])
        .withMessage('Type must be one of: in, out, adjustment, transfer'),
      
      body('quantity')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Quantity must be a positive number'),
      
      body('unit')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Unit must be between 1 and 20 characters'),
      
      body('unit_cost')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Unit cost must be a non-negative number'),
      
      body('total_value')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Total value must be a non-negative number'),
      
      body('reference')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Reference must be between 1 and 100 characters'),
      
      body('reference_type')
        .optional()
        .isIn(['purchase_order', 'sales_order', 'manufacturing_order', 'adjustment', 'transfer', 'return'])
        .withMessage('Reference type must be one of: purchase_order, sales_order, manufacturing_order, adjustment, transfer, return'),
      
      body('from_location')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('From location must be between 1 and 100 characters'),
      
      body('to_location')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('To location must be between 1 and 100 characters'),
      
      body('timestamp')
        .optional()
        .isISO8601()
        .withMessage('Timestamp must be a valid ISO 8601 date'),
      
      body('processed_by')
        .optional()
        .isUUID()
        .withMessage('Processed by must be a valid UUID'),
      
      body('notes')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Notes must be at most 1000 characters'),
      
      body('batch_number')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Batch number must be between 1 and 50 characters'),
      
      body('expiry_date')
        .optional()
        .isISO8601()
        .withMessage('Expiry date must be a valid ISO 8601 date'),
      
      body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
    ];
  }

  /**
   * Validation for DELETE /api/v1/stock-movements/:id
   */
  static deleteStockMovementValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('Stock movement ID must be a valid UUID'),
    ];
  }

  /**
   * Validation for GET /api/v1/stock-movements/product/:productId/balance
   */
  static getProductBalanceValidation(): ValidationChain[] {
    return [
      param('productId')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    ];
  }
}
