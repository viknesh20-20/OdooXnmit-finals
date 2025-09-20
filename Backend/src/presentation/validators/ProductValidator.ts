import { body, query, param } from 'express-validator';

export class ProductValidator {
  // Validation for GET /api/v1/products
  public static getProductsValidation() {
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
      query('category')
        .optional()
        .isUUID()
        .withMessage('Category must be a valid UUID'),
      query('type')
        .optional()
        .isIn(['raw_material', 'work_in_progress', 'finished_good'])
        .withMessage('Type must be one of: raw_material, work_in_progress, finished_good'),
      query('status')
        .optional()
        .isIn(['active', 'inactive', 'all'])
        .withMessage('Status must be one of: active, inactive, all'),
      query('sortBy')
        .optional()
        .isIn(['name', 'sku', 'type', 'cost_price', 'selling_price', 'created_at'])
        .withMessage('SortBy must be one of: name, sku, type, cost_price, selling_price, created_at'),
      query('sortOrder')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('SortOrder must be either asc or desc'),
    ];
  }

  // Validation for GET /api/v1/products/:id
  public static getProductValidation() {
    return [
      param('id')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    ];
  }

  // Validation for POST /api/v1/products
  public static createProductValidation() {
    return [
      body('sku')
        .notEmpty()
        .withMessage('SKU is required')
        .isLength({ min: 1, max: 50 })
        .withMessage('SKU must be between 1 and 50 characters')
        .matches(/^[A-Z0-9-_]+$/)
        .withMessage('SKU must contain only uppercase letters, numbers, hyphens, and underscores'),
      body('name')
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 1, max: 255 })
        .withMessage('Name must be between 1 and 255 characters'),
      body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
      body('category_id')
        .optional()
        .isUUID()
        .withMessage('Category ID must be a valid UUID'),
      body('uom_id')
        .optional()
        .isUUID()
        .withMessage('Unit of Measure ID must be a valid UUID'),
      body('type')
        .notEmpty()
        .withMessage('Type is required')
        .isIn(['raw_material', 'work_in_progress', 'finished_good'])
        .withMessage('Type must be one of: raw_material, work_in_progress, finished_good'),
      body('cost_price')
        .notEmpty()
        .withMessage('Cost price is required')
        .isFloat({ min: 0 })
        .withMessage('Cost price must be a positive number'),
      body('selling_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Selling price must be a positive number'),
      body('min_stock_level')
        .notEmpty()
        .withMessage('Minimum stock level is required')
        .isFloat({ min: 0 })
        .withMessage('Minimum stock level must be a positive number'),
      body('max_stock_level')
        .notEmpty()
        .withMessage('Maximum stock level is required')
        .isFloat({ min: 0 })
        .withMessage('Maximum stock level must be a positive number'),
      body('reorder_point')
        .notEmpty()
        .withMessage('Reorder point is required')
        .isFloat({ min: 0 })
        .withMessage('Reorder point must be a positive number'),
      body('lead_time_days')
        .notEmpty()
        .withMessage('Lead time days is required')
        .isInt({ min: 0 })
        .withMessage('Lead time days must be a non-negative integer'),
      body('is_active')
        .optional()
        .isBoolean()
        .withMessage('Is active must be a boolean'),
      body('specifications')
        .optional()
        .isObject()
        .withMessage('Specifications must be an object'),
      body('attachments')
        .optional()
        .isArray()
        .withMessage('Attachments must be an array'),
      // Custom validation to ensure max_stock_level >= min_stock_level
      body('max_stock_level').custom((value, { req }) => {
        if (parseFloat(value) < parseFloat(req.body.min_stock_level)) {
          throw new Error('Maximum stock level must be greater than or equal to minimum stock level');
        }
        return true;
      }),
      // Custom validation to ensure reorder_point is between min and max stock levels
      body('reorder_point').custom((value, { req }) => {
        const reorderPoint = parseFloat(value);
        const minStock = parseFloat(req.body.min_stock_level);
        const maxStock = parseFloat(req.body.max_stock_level);
        
        if (reorderPoint < minStock || reorderPoint > maxStock) {
          throw new Error('Reorder point must be between minimum and maximum stock levels');
        }
        return true;
      }),
    ];
  }

  // Validation for PUT /api/v1/products/:id
  public static updateProductValidation() {
    return [
      param('id')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
      body('sku')
        .optional()
        .isLength({ min: 1, max: 50 })
        .withMessage('SKU must be between 1 and 50 characters')
        .matches(/^[A-Z0-9-_]+$/)
        .withMessage('SKU must contain only uppercase letters, numbers, hyphens, and underscores'),
      body('name')
        .optional()
        .isLength({ min: 1, max: 255 })
        .withMessage('Name must be between 1 and 255 characters'),
      body('description')
        .optional()
        .isLength({ max: 1000 })
        .withMessage('Description must not exceed 1000 characters'),
      body('category_id')
        .optional()
        .isUUID()
        .withMessage('Category ID must be a valid UUID'),
      body('uom_id')
        .optional()
        .isUUID()
        .withMessage('Unit of Measure ID must be a valid UUID'),
      body('type')
        .optional()
        .isIn(['raw_material', 'work_in_progress', 'finished_good'])
        .withMessage('Type must be one of: raw_material, work_in_progress, finished_good'),
      body('cost_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Cost price must be a positive number'),
      body('selling_price')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Selling price must be a positive number'),
      body('min_stock_level')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Minimum stock level must be a positive number'),
      body('max_stock_level')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Maximum stock level must be a positive number'),
      body('reorder_point')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Reorder point must be a positive number'),
      body('lead_time_days')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Lead time days must be a non-negative integer'),
      body('is_active')
        .optional()
        .isBoolean()
        .withMessage('Is active must be a boolean'),
      body('specifications')
        .optional()
        .isObject()
        .withMessage('Specifications must be an object'),
      body('attachments')
        .optional()
        .isArray()
        .withMessage('Attachments must be an array'),
    ];
  }

  // Validation for DELETE /api/v1/products/:id
  public static deleteProductValidation() {
    return [
      param('id')
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    ];
  }
}
