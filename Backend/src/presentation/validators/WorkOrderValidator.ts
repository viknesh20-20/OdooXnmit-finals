import { body, param, query, ValidationChain } from 'express-validator';

export class WorkOrderValidator {
  /**
   * Validation for GET /api/v1/work-orders
   */
  static getWorkOrdersValidation(): ValidationChain[] {
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
        .isIn(['pending', 'in-progress', 'paused', 'completed', 'cancelled'])
        .withMessage('Status must be one of: pending, in-progress, paused, completed, cancelled'),
      
      query('work_center_id')
        .optional()
        .isUUID()
        .withMessage('Work center ID must be a valid UUID'),
      
      query('manufacturing_order_id')
        .optional()
        .isUUID()
        .withMessage('Manufacturing order ID must be a valid UUID'),
      
      query('assigned_to')
        .optional()
        .isUUID()
        .withMessage('Assigned to must be a valid UUID'),
      
      query('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be one of: low, medium, high, urgent'),
      
      query('sortBy')
        .optional()
        .isIn(['wo_number', 'operation', 'status', 'priority', 'sequence', 'start_time', 'end_time', 'created_at'])
        .withMessage('Sort by must be a valid field'),
      
      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),
    ];
  }

  /**
   * Validation for GET /api/v1/work-orders/:id
   */
  static getWorkOrderValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('Work order ID must be a valid UUID'),
    ];
  }

  /**
   * Validation for POST /api/v1/work-orders
   */
  static createWorkOrderValidation(): ValidationChain[] {
    return [
      body('wo_number')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Work order number must be between 1 and 50 characters'),
      
      body('manufacturing_order_id')
        .notEmpty()
        .isUUID()
        .withMessage('Manufacturing order ID is required and must be a valid UUID'),
      
      body('work_center_id')
        .notEmpty()
        .isUUID()
        .withMessage('Work center ID is required and must be a valid UUID'),
      
      body('operation')
        .notEmpty()
        .isString()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Operation is required and must be between 1 and 255 characters'),
      
      body('operation_type')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Operation type must be at most 100 characters'),
      
      body('duration')
        .notEmpty()
        .isFloat({ min: 0 })
        .withMessage('Duration is required and must be a positive number'),
      
      body('estimated_duration')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Estimated duration must be a positive number'),
      
      body('actual_duration')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Actual duration must be a positive number'),
      
      body('status')
        .optional()
        .isIn(['pending', 'in-progress', 'paused', 'completed', 'cancelled'])
        .withMessage('Status must be one of: pending, in-progress, paused, completed, cancelled'),
      
      body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be one of: low, medium, high, urgent'),
      
      body('assigned_to')
        .optional()
        .isUUID()
        .withMessage('Assigned to must be a valid UUID'),
      
      body('sequence')
        .notEmpty()
        .isInt({ min: 1 })
        .withMessage('Sequence is required and must be a positive integer'),
      
      body('start_time')
        .optional()
        .isISO8601()
        .withMessage('Start time must be a valid ISO 8601 date'),
      
      body('end_time')
        .optional()
        .isISO8601()
        .withMessage('End time must be a valid ISO 8601 date'),
      
      body('pause_time')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Pause time must be a positive number'),
      
      body('dependencies')
        .optional()
        .isArray()
        .withMessage('Dependencies must be an array'),
      
      body('dependencies.*')
        .optional()
        .isUUID()
        .withMessage('Each dependency must be a valid UUID'),
      
      body('instructions')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Instructions must be at most 2000 characters'),
      
      body('comments')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Comments must be at most 2000 characters'),
      
      body('quality_checks')
        .optional()
        .isArray()
        .withMessage('Quality checks must be an array'),
      
      body('time_entries')
        .optional()
        .isArray()
        .withMessage('Time entries must be an array'),
      
      body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
    ];
  }

  /**
   * Validation for PUT /api/v1/work-orders/:id
   */
  static updateWorkOrderValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('Work order ID must be a valid UUID'),
      
      body('wo_number')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('Work order number must be between 1 and 50 characters'),
      
      body('manufacturing_order_id')
        .optional()
        .isUUID()
        .withMessage('Manufacturing order ID must be a valid UUID'),
      
      body('work_center_id')
        .optional()
        .isUUID()
        .withMessage('Work center ID must be a valid UUID'),
      
      body('operation')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Operation must be between 1 and 255 characters'),
      
      body('operation_type')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Operation type must be at most 100 characters'),
      
      body('duration')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Duration must be a positive number'),
      
      body('estimated_duration')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Estimated duration must be a positive number'),
      
      body('actual_duration')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Actual duration must be a positive number'),
      
      body('status')
        .optional()
        .isIn(['pending', 'in-progress', 'paused', 'completed', 'cancelled'])
        .withMessage('Status must be one of: pending, in-progress, paused, completed, cancelled'),
      
      body('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'urgent'])
        .withMessage('Priority must be one of: low, medium, high, urgent'),
      
      body('assigned_to')
        .optional()
        .isUUID()
        .withMessage('Assigned to must be a valid UUID'),
      
      body('sequence')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Sequence must be a positive integer'),
      
      body('start_time')
        .optional()
        .isISO8601()
        .withMessage('Start time must be a valid ISO 8601 date'),
      
      body('end_time')
        .optional()
        .isISO8601()
        .withMessage('End time must be a valid ISO 8601 date'),
      
      body('pause_time')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Pause time must be a positive number'),
      
      body('dependencies')
        .optional()
        .isArray()
        .withMessage('Dependencies must be an array'),
      
      body('dependencies.*')
        .optional()
        .isUUID()
        .withMessage('Each dependency must be a valid UUID'),
      
      body('instructions')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Instructions must be at most 2000 characters'),
      
      body('comments')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Comments must be at most 2000 characters'),
      
      body('quality_checks')
        .optional()
        .isArray()
        .withMessage('Quality checks must be an array'),
      
      body('time_entries')
        .optional()
        .isArray()
        .withMessage('Time entries must be an array'),
      
      body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
    ];
  }

  /**
   * Validation for DELETE /api/v1/work-orders/:id
   */
  static deleteWorkOrderValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('Work order ID must be a valid UUID'),
    ];
  }

  /**
   * Validation for PUT /api/v1/work-orders/:id/status
   */
  static updateStatusValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('Work order ID must be a valid UUID'),

      body('status')
        .notEmpty()
        .isIn(['pending', 'in-progress', 'paused', 'completed', 'cancelled'])
        .withMessage('Status is required and must be one of: pending, in-progress, paused, completed, cancelled'),

      body('comments')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Comments must be at most 1000 characters'),
    ];
  }

  /**
   * Validation for POST /api/v1/work-orders/:id/time-entries
   */
  static addTimeEntryValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('Work order ID must be a valid UUID'),

      body('start_time')
        .notEmpty()
        .isISO8601()
        .withMessage('Start time is required and must be a valid ISO 8601 date'),

      body('end_time')
        .notEmpty()
        .isISO8601()
        .withMessage('End time is required and must be a valid ISO 8601 date'),

      body('duration')
        .notEmpty()
        .isFloat({ min: 0 })
        .withMessage('Duration is required and must be a positive number'),

      body('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Description must be at most 500 characters'),

      body('user_id')
        .notEmpty()
        .isUUID()
        .withMessage('User ID is required and must be a valid UUID'),
    ];
  }
}
