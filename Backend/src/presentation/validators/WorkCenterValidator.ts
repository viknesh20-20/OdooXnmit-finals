import { body, query, param } from 'express-validator';

export class WorkCenterValidator {
  // Validation for GET /api/v1/work-centers
  public static getWorkCentersValidation() {
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
        .isLength({ min: 1, max: 255 })
        .withMessage('Search term must be between 1 and 255 characters'),
      query('status')
        .optional()
        .isIn(['active', 'inactive', 'maintenance'])
        .withMessage('Status must be one of: active, inactive, maintenance'),
      query('location')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('Location must be between 1 and 255 characters'),
      query('sortBy')
        .optional()
        .isIn(['name', 'code', 'status', 'utilization', 'efficiency', 'created_at'])
        .withMessage('SortBy must be one of: name, code, status, utilization, efficiency, created_at'),
      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('SortOrder must be either asc or desc'),
    ];
  }

  // Validation for GET /api/v1/work-centers/:id
  public static getWorkCenterValidation() {
    return [
      param('id')
        .isUUID()
        .withMessage('Work center ID must be a valid UUID'),
    ];
  }

  // Validation for POST /api/v1/work-centers
  public static createWorkCenterValidation() {
    return [
      body('code')
        .notEmpty()
        .withMessage('Code is required')
        .isLength({ min: 1, max: 20 })
        .withMessage('Code must be between 1 and 20 characters')
        .matches(/^[A-Z0-9-_]+$/)
        .withMessage('Code must contain only uppercase letters, numbers, hyphens, and underscores'),
      body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 1, max: 255 })
        .withMessage('Name must be between 1 and 255 characters'),
      body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
      body('cost_per_hour')
        .notEmpty()
        .withMessage('Cost per hour is required')
        .isFloat({ min: 0 })
        .withMessage('Cost per hour must be a positive number'),
      body('capacity')
        .notEmpty()
        .withMessage('Capacity is required')
        .isInt({ min: 1 })
        .withMessage('Capacity must be a positive integer'),
      body('efficiency')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Efficiency must be between 0 and 100'),
      body('status')
        .optional()
        .isIn(['active', 'inactive', 'maintenance'])
        .withMessage('Status must be one of: active, inactive, maintenance'),
      body('utilization')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Utilization must be between 0 and 100'),
      body('location')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('Location must be between 1 and 255 characters'),
      body('availability')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Availability must be between 0 and 100'),
      body('maintenance_schedule')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('Maintenance schedule must be between 1 and 255 characters'),
      body('next_maintenance')
        .optional()
        .isISO8601()
        .withMessage('Next maintenance must be a valid date'),
      body('operator_ids')
        .optional()
        .isArray()
        .withMessage('Operator IDs must be an array'),
      body('operator_ids.*')
        .optional()
        .isUUID()
        .withMessage('Each operator ID must be a valid UUID'),
      body('capabilities')
        .optional()
        .isArray()
        .withMessage('Capabilities must be an array'),
      body('capabilities.*')
        .optional()
        .isString()
        .withMessage('Each capability must be a string'),
      body('working_hours')
        .optional()
        .isObject()
        .withMessage('Working hours must be an object'),
      body('oee_score')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('OEE score must be between 0 and 100'),
      body('downtime_hours')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Downtime hours must be a positive number'),
      body('productive_hours')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Productive hours must be a positive number'),
      body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
    ];
  }

  // Validation for PUT /api/v1/work-centers/:id
  public static updateWorkCenterValidation() {
    return [
      param('id')
        .isUUID()
        .withMessage('Work center ID must be a valid UUID'),
      body('code')
        .optional()
        .isLength({ min: 1, max: 20 })
        .withMessage('Code must be between 1 and 20 characters')
        .matches(/^[A-Z0-9-_]+$/)
        .withMessage('Code must contain only uppercase letters, numbers, hyphens, and underscores'),
      body('name')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('Name must be between 1 and 255 characters'),
      body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
      body('cost_per_hour')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Cost per hour must be a positive number'),
      body('capacity')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Capacity must be a positive integer'),
      body('efficiency')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Efficiency must be between 0 and 100'),
      body('status')
        .optional()
        .isIn(['active', 'inactive', 'maintenance'])
        .withMessage('Status must be one of: active, inactive, maintenance'),
      body('utilization')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Utilization must be between 0 and 100'),
      body('location')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('Location must be between 1 and 255 characters'),
      body('availability')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('Availability must be between 0 and 100'),
      body('maintenance_schedule')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('Maintenance schedule must be between 1 and 255 characters'),
      body('next_maintenance')
        .optional()
        .isISO8601()
        .withMessage('Next maintenance must be a valid date'),
      body('operator_ids')
        .optional()
        .isArray()
        .withMessage('Operator IDs must be an array'),
      body('operator_ids.*')
        .optional()
        .isUUID()
        .withMessage('Each operator ID must be a valid UUID'),
      body('capabilities')
        .optional()
        .isArray()
        .withMessage('Capabilities must be an array'),
      body('capabilities.*')
        .optional()
        .isString()
        .withMessage('Each capability must be a string'),
      body('working_hours')
        .optional()
        .isObject()
        .withMessage('Working hours must be an object'),
      body('oee_score')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('OEE score must be between 0 and 100'),
      body('downtime_hours')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Downtime hours must be a positive number'),
      body('productive_hours')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Productive hours must be a positive number'),
      body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
    ];
  }

  // Validation for DELETE /api/v1/work-centers/:id
  public static deleteWorkCenterValidation() {
    return [
      param('id')
        .isUUID()
        .withMessage('Work center ID must be a valid UUID'),
    ];
  }

  // Validation for PUT /api/v1/work-centers/:id/utilization
  public static updateUtilizationValidation() {
    return [
      param('id')
        .isUUID()
        .withMessage('Work center ID must be a valid UUID'),
      body('utilization')
        .notEmpty()
        .withMessage('Utilization is required')
        .isFloat({ min: 0, max: 100 })
        .withMessage('Utilization must be between 0 and 100'),
      body('oee_score')
        .optional()
        .isFloat({ min: 0, max: 100 })
        .withMessage('OEE score must be between 0 and 100'),
      body('downtime_hours')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Downtime hours must be a positive number'),
      body('productive_hours')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Productive hours must be a positive number'),
    ];
  }
}
