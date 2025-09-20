import { body, param, query, ValidationChain } from 'express-validator';

export class BOMValidator {
  /**
   * Validation for GET /api/v1/boms
   */
  static getBOMsValidation(): ValidationChain[] {
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
      
      query('is_active')
        .optional()
        .isBoolean()
        .withMessage('Is active must be a boolean'),
      
      query('is_default')
        .optional()
        .isBoolean()
        .withMessage('Is default must be a boolean'),
      
      query('created_by')
        .optional()
        .isUUID()
        .withMessage('Created by must be a valid UUID'),
      
      query('approved_by')
        .optional()
        .isUUID()
        .withMessage('Approved by must be a valid UUID'),
      
      query('sortBy')
        .optional()
        .isIn(['name', 'version', 'is_active', 'is_default', 'created_at', 'approved_at'])
        .withMessage('Sort by must be a valid field'),
      
      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Sort order must be asc or desc'),
    ];
  }

  /**
   * Validation for GET /api/v1/boms/:id
   */
  static getBOMValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('BOM ID must be a valid UUID'),
    ];
  }

  /**
   * Validation for POST /api/v1/boms
   */
  static createBOMValidation(): ValidationChain[] {
    return [
      body('product_id')
        .notEmpty()
        .isUUID()
        .withMessage('Product ID is required and must be a valid UUID'),
      
      body('version')
        .notEmpty()
        .isString()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Version is required and must be between 1 and 20 characters'),
      
      body('name')
        .notEmpty()
        .isString()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Name is required and must be between 1 and 255 characters'),
      
      body('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must be at most 2000 characters'),
      
      body('is_active')
        .optional()
        .isBoolean()
        .withMessage('Is active must be a boolean'),
      
      body('is_default')
        .optional()
        .isBoolean()
        .withMessage('Is default must be a boolean'),
      
      body('created_by')
        .notEmpty()
        .isUUID()
        .withMessage('Created by is required and must be a valid UUID'),
      
      body('approved_by')
        .optional()
        .isUUID()
        .withMessage('Approved by must be a valid UUID'),
      
      body('approved_at')
        .optional()
        .isISO8601()
        .withMessage('Approved at must be a valid ISO 8601 date'),
      
      body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
    ];
  }

  /**
   * Validation for PUT /api/v1/boms/:id
   */
  static updateBOMValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('BOM ID must be a valid UUID'),
      
      body('product_id')
        .optional()
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
      
      body('version')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 20 })
        .withMessage('Version must be between 1 and 20 characters'),
      
      body('name')
        .optional()
        .isString()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Name must be between 1 and 255 characters'),
      
      body('description')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description must be at most 2000 characters'),
      
      body('is_active')
        .optional()
        .isBoolean()
        .withMessage('Is active must be a boolean'),
      
      body('is_default')
        .optional()
        .isBoolean()
        .withMessage('Is default must be a boolean'),
      
      body('created_by')
        .optional()
        .isUUID()
        .withMessage('Created by must be a valid UUID'),
      
      body('approved_by')
        .optional()
        .isUUID()
        .withMessage('Approved by must be a valid UUID'),
      
      body('approved_at')
        .optional()
        .isISO8601()
        .withMessage('Approved at must be a valid ISO 8601 date'),
      
      body('metadata')
        .optional()
        .isObject()
        .withMessage('Metadata must be an object'),
    ];
  }

  /**
   * Validation for DELETE /api/v1/boms/:id
   */
  static deleteBOMValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('BOM ID must be a valid UUID'),
    ];
  }

  /**
   * Validation for PUT /api/v1/boms/:id/approve
   */
  static approveBOMValidation(): ValidationChain[] {
    return [
      param('id')
        .isUUID()
        .withMessage('BOM ID must be a valid UUID'),
      
      body('approved_by')
        .notEmpty()
        .isUUID()
        .withMessage('Approved by is required and must be a valid UUID'),
    ];
  }
}
