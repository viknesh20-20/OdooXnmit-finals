import { body, param, query, ValidationChain } from 'express-validator';

export class ManufacturingOrderValidator {
  /**
   * Validation for GET /api/v1/manufacturing-orders
   */
  static getManufacturingOrdersValidation(): ValidationChain[] {
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
      
      query('status')
        .optional()
        .isIn(['draft', 'planned', 'released', 'in_progress', 'paused', 'completed', 'cancelled'])
        .withMessage('Status must be one of: draft, planned, released, in_progress, paused, completed, cancelled'),
      
      query('product_id')
        .optional()
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
      
      query('priority')
        .optional()
        .isIn(['low', 'normal', 'high', 'urgent'])
        .withMessage('Priority must be one of: low, normal, high, urgent'),
      
      query('created_by')
        .optional()
        .isUUID()
        .withMessage('Created by must be a valid UUID'),
      
      query('assigned_to')
        .optional()
        .isUUID()
        .withMessage('Assigned to must be a valid UUID'),
      
      query('sortBy')
        .optional()
        .isIn(['mo_number', 'status', 'priority', 'planned_start_date', 'planned_end_date', 'created_at'])
        .withMessage('Sort by must be a valid field'),
      
      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),
    ];
  }

  /**
   * Validation for GET /api/v1/manufacturing-orders/:id
   */
  static getManufacturingOrderValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('Manufacturing order ID must be a valid UUID'),
    ];
  }

  /**
   * Validation for POST /api/v1/manufacturing-orders
   */
  static createManufacturingOrderValidation(): ValidationChain[] {
    return [
      body('mo_number')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Manufacturing order number must be between 1 and 50 characters'),
      
      body('product_id')
        .notEmpty()
        .isUUID()
        .withMessage('Product ID is required and must be a valid UUID'),
      
      body('bom_id')
        .notEmpty()
        .isUUID()
        .withMessage('BOM ID is required and must be a valid UUID'),
      
      body('quantity')
        .notEmpty()
        .isFloat({ min: 0.01 })
        .withMessage('Quantity is required and must be a positive number'),
      
      body('quantity_unit')
        .notEmpty()
        .isString()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Quantity unit is required and must be between 1 and 20 characters'),
      
      body('status')
        .optional()
        .isIn(['draft', 'planned', 'released', 'in_progress', 'paused', 'completed', 'cancelled'])
        .withMessage('Status must be one of: draft, planned, released, in_progress, paused, completed, cancelled'),
      
      body('priority')
        .optional()
        .isIn(['low', 'normal', 'high', 'urgent'])
        .withMessage('Priority must be one of: low, normal, high, urgent'),
      
      body('planned_start_date')
        .optional()
        .isISO8601()
        .withMessage('Planned start date must be a valid ISO 8601 date'),
      
      body('planned_end_date')
        .optional()
        .isISO8601()
        .withMessage('Planned end date must be a valid ISO 8601 date'),
      
      body('actual_start_date')
        .optional()
        .isISO8601()
        .withMessage('Actual start date must be a valid ISO 8601 date'),
      
      body('actual_end_date')
        .optional()
        .isISO8601()
        .withMessage('Actual end date must be a valid ISO 8601 date'),
      
      body('created_by')
        .notEmpty()
        .isUUID()
        .withMessage('Created by is required and must be a valid UUID'),
      
      body('assigned_to')
        .optional()
        .isUUID()
        .withMessage('Assigned to must be a valid UUID'),
      
      body('notes')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Notes must be at most 2000 characters'),
      
      body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
    ];
  }

  /**
   * Validation for PUT /api/v1/manufacturing-orders/:id
   */
  static updateManufacturingOrderValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('Manufacturing order ID must be a valid UUID'),
      
      body('mo_number')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Manufacturing order number must be between 1 and 50 characters'),
      
      body('product_id')
        .optional()
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
      
      body('bom_id')
        .optional()
        .isUUID()
        .withMessage('BOM ID must be a valid UUID'),
      
      body('quantity')
        .optional()
        .isFloat({ min: 0.01 })
        .withMessage('Quantity must be a positive number'),
      
      body('quantity_unit')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Quantity unit must be between 1 and 20 characters'),
      
      body('status')
        .optional()
        .isIn(['draft', 'planned', 'released', 'in_progress', 'paused', 'completed', 'cancelled'])
        .withMessage('Status must be one of: draft, planned, released, in_progress, paused, completed, cancelled'),
      
      body('priority')
        .optional()
        .isIn(['low', 'normal', 'high', 'urgent'])
        .withMessage('Priority must be one of: low, normal, high, urgent'),
      
      body('planned_start_date')
        .optional()
        .isISO8601()
        .withMessage('Planned start date must be a valid ISO 8601 date'),
      
      body('planned_end_date')
        .optional()
        .isISO8601()
        .withMessage('Planned end date must be a valid ISO 8601 date'),
      
      body('actual_start_date')
        .optional()
        .isISO8601()
        .withMessage('Actual start date must be a valid ISO 8601 date'),
      
      body('actual_end_date')
        .optional()
        .isISO8601()
        .withMessage('Actual end date must be a valid ISO 8601 date'),
      
      body('created_by')
        .optional()
        .isUUID()
        .withMessage('Created by must be a valid UUID'),
      
      body('assigned_to')
        .optional()
        .isUUID()
        .withMessage('Assigned to must be a valid UUID'),
      
      body('notes')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Notes must be at most 2000 characters'),
      
      body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
    ];
  }

  /**
   * Validation for DELETE /api/v1/manufacturing-orders/:id
   */
  static deleteManufacturingOrderValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('Manufacturing order ID must be a valid UUID'),
    ];
  }
}
