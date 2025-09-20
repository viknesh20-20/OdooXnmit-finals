import { param, query, ValidationChain } from 'express-validator';

export class ReportsValidator {
  /**
   * Validation for GET /api/v1/reports/production-summary
   */
  static getProductionSummaryValidation(): ValidationChain[] {
    return [
      query('start_date')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
      
      query('end_date')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date'),
    ];
  }

  /**
   * Validation for GET /api/v1/reports/work-center-utilization
   */
  static getWorkCenterUtilizationValidation(): ValidationChain[] {
    return [
      query('start_date')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
      
      query('end_date')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date'),
      
      query('work_center_id')
        .optional()
        .isUUID()
        .withMessage('Work center ID must be a valid UUID'),
    ];
  }

  /**
   * Validation for GET /api/v1/reports/inventory-summary
   */
  static getInventorySummaryValidation(): ValidationChain[] {
    return [
      query('product_id')
        .optional()
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    ];
  }

  /**
   * Validation for GET /api/v1/reports/production-efficiency
   */
  static getProductionEfficiencyValidation(): ValidationChain[] {
    return [
      query('start_date')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
      
      query('end_date')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date'),
    ];
  }

  /**
   * Validation for GET /api/v1/reports/export/:reportType
   */
  static exportReportValidation(): ValidationChain[] {
    return [
      param('reportType')
        .isIn(['production-summary', 'work-center-utilization', 'inventory-summary', 'production-efficiency'])
        .withMessage('Report type must be one of: production-summary, work-center-utilization, inventory-summary, production-efficiency'),
      
      query('format')
        .optional()
        .isIn(['json', 'csv'])
        .withMessage('Format must be json or csv'),
      
      query('start_date')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid ISO 8601 date'),
      
      query('end_date')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid ISO 8601 date'),
      
      query('work_center_id')
        .optional()
        .isUUID()
        .withMessage('Work center ID must be a valid UUID'),
      
      query('product_id')
        .optional()
        .isUUID()
        .withMessage('Product ID must be a valid UUID'),
    ];
  }
}
