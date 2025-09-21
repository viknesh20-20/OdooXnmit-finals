import { body, param, query, ValidationChain } from 'express-validator';

export class BOMOperationValidator {
  public static getBOMOperationsValidation(): ValidationChain[] {
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
      query('bom_id')
        .optional()
        .isUUID()
        .withMessage('BOM ID must be a valid UUID'),
      query('operation_type')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Operation type must be between 1 and 100 characters'),
      query('work_center_id')
        .optional()
        .isUUID()
        .withMessage('Work center ID must be a valid UUID'),
      query('sortBy')
        .optional()
        .isIn(['sequence', 'operation', 'operation_type', 'duration', 'total_cost', 'created_at'])
        .withMessage('Invalid sort field'),
      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),
    ];
  }

  public static getBOMOperationValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('BOM operation ID must be a valid UUID'),
    ];
  }

  public static getBOMOperationsByBOMValidation(): ValidationChain[] {
    return [
      param('bomId')
        .isUUID()
        .withMessage('BOM ID must be a valid UUID'),
    ];
  }

  public static createBOMOperationValidation(): ValidationChain[] {
    return [
      body('bom_id')
        .isUUID()
        .withMessage('BOM ID is required and must be a valid UUID'),
      body('operation')
        .isString()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Operation name is required and must be between 1 and 255 characters'),
      body('operation_type')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Operation type must be between 1 and 100 characters'),
      body('work_center_id')
        .optional()
        .isUUID()
        .withMessage('Work center ID must be a valid UUID'),
      body('duration')
        .isInt({ min: 1 })
        .withMessage('Duration is required and must be at least 1 minute'),
      body('setup_time')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Setup time must be 0 or greater'),
      body('teardown_time')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Teardown time must be 0 or greater'),
      body('cost_per_hour')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Cost per hour must be 0 or greater'),
      body('total_cost')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Total cost must be 0 or greater'),
      body('sequence')
        .isInt({ min: 1 })
        .withMessage('Sequence is required and must be at least 1'),
      body('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be 1000 characters or less'),
      body('instructions')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Instructions must be 2000 characters or less'),
      body('quality_requirements')
        .optional()
        .isArray()
        .withMessage('Quality requirements must be an array'),
      body('tools_required')
        .optional()
        .isArray()
        .withMessage('Tools required must be an array'),
      body('skills_required')
        .optional()
        .isArray()
        .withMessage('Skills required must be an array'),
      body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
    ];
  }

  public static updateBOMOperationValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('BOM operation ID must be a valid UUID'),
      body('bom_id')
        .optional()
        .isUUID()
        .withMessage('BOM ID must be a valid UUID'),
      body('operation')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Operation name must be between 1 and 255 characters'),
      body('operation_type')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Operation type must be between 1 and 100 characters'),
      body('work_center_id')
        .optional()
        .isUUID()
        .withMessage('Work center ID must be a valid UUID'),
      body('duration')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Duration must be at least 1 minute'),
      body('setup_time')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Setup time must be 0 or greater'),
      body('teardown_time')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Teardown time must be 0 or greater'),
      body('cost_per_hour')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Cost per hour must be 0 or greater'),
      body('total_cost')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Total cost must be 0 or greater'),
      body('sequence')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Sequence must be at least 1'),
      body('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be 1000 characters or less'),
      body('instructions')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Instructions must be 2000 characters or less'),
      body('quality_requirements')
        .optional()
        .isArray()
        .withMessage('Quality requirements must be an array'),
      body('tools_required')
        .optional()
        .isArray()
        .withMessage('Tools required must be an array'),
      body('skills_required')
        .optional()
        .isArray()
        .withMessage('Skills required must be an array'),
      body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
    ];
  }

  public static deleteBOMOperationValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('BOM operation ID must be a valid UUID'),
    ];
  }

  public static reorderBOMOperationsValidation(): ValidationChain[] {
    return [
      param('bomId')
        .isUUID()
        .withMessage('BOM ID must be a valid UUID'),
      body('operations')
        .isArray({ min: 1 })
        .withMessage('Operations array is required and must contain at least one operation'),
      body('operations.*.id')
        .isUUID()
        .withMessage('Each operation ID must be a valid UUID'),
      body('operations.*.sequence')
        .isInt({ min: 1 })
        .withMessage('Each operation sequence must be at least 1'),
    ];
  }
}
