import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op, QueryTypes } from 'sequelize';
import { WorkCenterModel } from '@infrastructure/database/models/WorkCenterModel';
import { WorkOrderModel } from '@infrastructure/database/models/WorkOrderModel';
import { ManufacturingOrderModel } from '@infrastructure/database/models/ManufacturingOrderModel';
import { ProductModel } from '@infrastructure/database/models/ProductModel';
import { StockMovementModel } from '@infrastructure/database/models/StockMovementModel';
import { sequelize } from '@infrastructure/database/connection';
import { Logger } from '@infrastructure/logging/Logger';

export class ReportsController {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ReportsController');
  }

  // GET /api/v1/reports/production-summary
  public async getProductionSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: errors.array(),
          },
        });
        return;
      }

      const { start_date, end_date } = req.query;

      const dateFilter: any = {};
      if (start_date) {
        dateFilter[Op.gte] = new Date(start_date as string);
      }
      if (end_date) {
        dateFilter[Op.lte] = new Date(end_date as string);
      }

      // Get manufacturing order statistics
      const moStats = await ManufacturingOrderModel.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
        ],
        where: start_date || end_date ? { created_at: dateFilter } : {},
        group: ['status'],
        raw: true,
      });

      // Get work order statistics
      const woStats = await WorkOrderModel.findAll({
        attributes: [
          'status',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('AVG', sequelize.col('actual_duration')), 'avg_duration'],
        ],
        where: start_date || end_date ? { created_at: dateFilter } : {},
        group: ['status'],
        raw: true,
      });

      // Get top products by production volume
      const topProducts = await sequelize.query(`
        SELECT 
          p.id,
          p.sku,
          p.name,
          COUNT(mo.id) as order_count,
          SUM(mo.quantity) as total_quantity
        FROM products p
        JOIN manufacturing_orders mo ON p.id = mo.product_id
        ${start_date || end_date ? 'WHERE mo.created_at BETWEEN :start_date AND :end_date' : ''}
        GROUP BY p.id, p.sku, p.name
        ORDER BY total_quantity DESC
        LIMIT 10
      `, {
        replacements: {
          start_date: start_date || '1900-01-01',
          end_date: end_date || '2100-01-01',
        },
        type: QueryTypes.SELECT,
      });

      res.status(200).json({
        success: true,
        data: {
          manufacturingOrderStats: moStats,
          workOrderStats: woStats,
          topProducts,
          reportGeneratedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Error generating production summary', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // GET /api/v1/reports/work-center-utilization
  public async getWorkCenterUtilization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: errors.array(),
          },
        });
        return;
      }

      const { start_date, end_date, work_center_id } = req.query;

      const dateFilter: any = {};
      if (start_date) {
        dateFilter[Op.gte] = new Date(start_date as string);
      }
      if (end_date) {
        dateFilter[Op.lte] = new Date(end_date as string);
      }

      const workCenterFilter: any = {};
      if (work_center_id) {
        workCenterFilter.id = work_center_id;
      }

      // Get work center utilization data
      const utilizationData = await sequelize.query(`
        SELECT 
          wc.id,
          wc.name,
          wc.capacity_per_hour,
          COUNT(wo.id) as total_work_orders,
          SUM(CASE WHEN wo.status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          SUM(CASE WHEN wo.status = 'in_progress' THEN 1 ELSE 0 END) as active_orders,
          AVG(wo.actual_duration) as avg_duration,
          SUM(wo.actual_duration) as total_duration,
          ROUND(
            (SUM(wo.actual_duration) / NULLIF(wc.capacity_per_hour * 
              EXTRACT(EPOCH FROM (:end_date::timestamp - :start_date::timestamp)) / 3600, 0)) * 100, 2
          ) as utilization_percentage
        FROM work_centers wc
        LEFT JOIN work_orders wo ON wc.id = wo.work_center_id
        ${start_date || end_date ? 'AND wo.created_at BETWEEN :start_date AND :end_date' : ''}
        ${work_center_id ? 'WHERE wc.id = :work_center_id' : ''}
        GROUP BY wc.id, wc.name, wc.capacity_per_hour
        ORDER BY utilization_percentage DESC
      `, {
        replacements: {
          start_date: start_date || '1900-01-01',
          end_date: end_date || new Date().toISOString(),
          work_center_id: work_center_id || null,
        },
        type: QueryTypes.SELECT,
      });

      res.status(200).json({
        success: true,
        data: {
          utilizationData,
          reportGeneratedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Error generating work center utilization report', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // GET /api/v1/reports/inventory-summary
  public async getInventorySummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: errors.array(),
          },
        });
        return;
      }

      const { product_id } = req.query;

      // Get current stock levels for all products
      const inventoryData = await sequelize.query(`
        SELECT 
          p.id,
          p.sku,
          p.name,
          p.type,
          p.cost_price,
          COALESCE(latest_movement.running_balance, 0) as current_stock,
          COALESCE(latest_movement.running_balance * p.cost_price, 0) as stock_value,
          latest_movement.timestamp as last_movement_date
        FROM products p
        LEFT JOIN LATERAL (
          SELECT 
            running_balance,
            timestamp
          FROM stock_movements sm
          WHERE sm.product_id = p.id
          ORDER BY sm.timestamp DESC
          LIMIT 1
        ) latest_movement ON true
        ${product_id ? 'WHERE p.id = :product_id' : ''}
        ORDER BY stock_value DESC
      `, {
        replacements: {
          product_id: product_id || null,
        },
        type: QueryTypes.SELECT,
      });

      // Get stock movement summary
      const movementSummary = await StockMovementModel.findAll({
        attributes: [
          'type',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
          [sequelize.fn('SUM', sequelize.col('quantity')), 'total_quantity'],
          [sequelize.fn('SUM', sequelize.col('total_value')), 'total_value'],
        ],
        where: product_id ? { product_id: product_id as string } : {},
        group: ['type'],
        raw: true,
      });

      const totalStockValue = inventoryData.reduce((sum: number, item: any) => sum + (item.stock_value || 0), 0);

      res.status(200).json({
        success: true,
        data: {
          inventoryData,
          movementSummary,
          totalStockValue,
          reportGeneratedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Error generating inventory summary', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // GET /api/v1/reports/production-efficiency
  public async getProductionEfficiency(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request parameters',
            details: errors.array(),
          },
        });
        return;
      }

      const { start_date, end_date } = req.query;

      const dateFilter: any = {};
      if (start_date) {
        dateFilter[Op.gte] = new Date(start_date as string);
      }
      if (end_date) {
        dateFilter[Op.lte] = new Date(end_date as string);
      }

      // Get efficiency metrics
      const efficiencyData = await sequelize.query(`
        SELECT 
          DATE_TRUNC('day', wo.created_at) as date,
          COUNT(wo.id) as total_orders,
          SUM(CASE WHEN wo.status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          AVG(wo.estimated_duration) as avg_estimated_duration,
          AVG(wo.actual_duration) as avg_actual_duration,
          ROUND(
            AVG(wo.estimated_duration) / NULLIF(AVG(wo.actual_duration), 0) * 100, 2
          ) as efficiency_percentage,
          SUM(CASE WHEN wo.actual_duration <= wo.estimated_duration THEN 1 ELSE 0 END) as on_time_orders
        FROM work_orders wo
        ${start_date || end_date ? 'WHERE wo.created_at BETWEEN :start_date AND :end_date' : ''}
        GROUP BY DATE_TRUNC('day', wo.created_at)
        ORDER BY date DESC
        LIMIT 30
      `, {
        replacements: {
          start_date: start_date || '1900-01-01',
          end_date: end_date || new Date().toISOString(),
        },
        type: QueryTypes.SELECT,
      });

      // Get overall efficiency metrics
      const overallMetrics = await sequelize.query(`
        SELECT 
          COUNT(wo.id) as total_work_orders,
          SUM(CASE WHEN wo.status = 'completed' THEN 1 ELSE 0 END) as completed_orders,
          ROUND(
            SUM(CASE WHEN wo.status = 'completed' THEN 1 ELSE 0 END)::numeric / 
            NULLIF(COUNT(wo.id), 0) * 100, 2
          ) as completion_rate,
          AVG(wo.estimated_duration) as avg_estimated_duration,
          AVG(wo.actual_duration) as avg_actual_duration,
          ROUND(
            AVG(wo.estimated_duration) / NULLIF(AVG(wo.actual_duration), 0) * 100, 2
          ) as overall_efficiency
        FROM work_orders wo
        ${start_date || end_date ? 'WHERE wo.created_at BETWEEN :start_date AND :end_date' : ''}
      `, {
        replacements: {
          start_date: start_date || '1900-01-01',
          end_date: end_date || new Date().toISOString(),
        },
        type: QueryTypes.SELECT,
      });

      res.status(200).json({
        success: true,
        data: {
          dailyEfficiency: efficiencyData,
          overallMetrics: overallMetrics[0],
          reportGeneratedAt: new Date(),
        },
      });
    } catch (error) {
      this.logger.error('Error generating production efficiency report', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // GET /api/v1/reports/export/:reportType
  public async exportReport(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid export parameters',
            details: errors.array(),
          },
        });
        return;
      }

      const { reportType } = req.params;
      const { format = 'json' } = req.query;

      let reportData: any;
      let filename: string;

      // Generate report data based on type
      switch (reportType) {
        case 'production-summary':
          // Reuse the production summary logic
          const mockReq = { query: req.query } as Request;
          const mockRes = {
            status: () => ({ json: (data: any) => { reportData = data; } })
          } as any;
          await this.getProductionSummary(mockReq, mockRes, next);
          filename = `production-summary-${new Date().toISOString().split('T')[0]}`;
          break;

        case 'work-center-utilization':
          const mockReq2 = { query: req.query } as Request;
          const mockRes2 = {
            status: () => ({ json: (data: any) => { reportData = data; } })
          } as any;
          await this.getWorkCenterUtilization(mockReq2, mockRes2, next);
          filename = `work-center-utilization-${new Date().toISOString().split('T')[0]}`;
          break;

        case 'inventory-summary':
          const mockReq3 = { query: req.query } as Request;
          const mockRes3 = {
            status: () => ({ json: (data: any) => { reportData = data; } })
          } as any;
          await this.getInventorySummary(mockReq3, mockRes3, next);
          filename = `inventory-summary-${new Date().toISOString().split('T')[0]}`;
          break;

        default:
          res.status(400).json({
            success: false,
            error: {
              code: 'INVALID_REPORT_TYPE',
              message: 'Invalid report type',
            },
          });
          return;
      }

      // Set appropriate headers for download
      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
        
        // Convert to CSV (simplified implementation)
        const csvData = this.convertToCSV(reportData.data);
        res.send(csvData);
      } else {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
        res.json(reportData);
      }
    } catch (error) {
      this.logger.error('Error exporting report', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion - in production, use a proper CSV library
    if (!data || typeof data !== 'object') {
      return '';
    }

    const firstKey = Object.keys(data)[0];
    if (!firstKey) return '';
    const firstArray = data[firstKey];
    
    if (!Array.isArray(firstArray) || firstArray.length === 0) {
      return '';
    }

    const headers = Object.keys(firstArray[0]);
    const csvRows = [headers.join(',')];

    for (const row of firstArray) {
      const values = headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    }

    return csvRows.join('\n');
  }
}
