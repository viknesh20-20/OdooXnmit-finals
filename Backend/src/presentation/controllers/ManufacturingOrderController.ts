import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { ManufacturingOrderModel } from '@infrastructure/database/models/ManufacturingOrderModel';
import { ProductModel } from '@infrastructure/database/models/ProductModel';
import { BOMModel } from '@infrastructure/database/models/BOMModel';
import { WorkOrderModel } from '@infrastructure/database/models/WorkOrderModel';
import { Logger } from '@infrastructure/logging/Logger';

export class ManufacturingOrderController {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('ManufacturingOrderController');
  }

  // GET /api/v1/manufacturing-orders
  public async getManufacturingOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const {
        page = 1,
        limit = 20,
        search,
        status,
        product_id,
        priority,
        created_by,
        assigned_to,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // Apply filters
      if (search) {
        whereClause[Op.or] = [
          { mo_number: { [Op.iLike]: `%${search}%` } },
          { notes: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (status) {
        whereClause.status = status;
      }

      if (product_id) {
        whereClause.product_id = product_id;
      }

      if (priority) {
        whereClause.priority = priority;
      }

      if (created_by) {
        whereClause.created_by = created_by;
      }

      if (assigned_to) {
        whereClause.assigned_to = assigned_to;
      }

      const { count, rows } = await ManufacturingOrderModel.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: ProductModel,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type'],
          },
          {
            model: BOMModel,
            as: 'bom',
            attributes: ['id', 'name', 'version', 'is_active'],
          },
        ],
        limit: Number(limit),
        offset,
        order: [[sortBy as string, sortOrder as string]],
      });

      const totalPages = Math.ceil(count / Number(limit));

      res.status(200).json({
        success: true,
        data: {
          manufacturingOrders: rows.map(mo => this.formatManufacturingOrderResponse(mo)),
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total: count,
            totalPages,
            hasNext: Number(page) < totalPages,
            hasPrev: Number(page) > 1,
          },
        },
      });
    } catch (error) {
      this.logger.error('Error fetching manufacturing orders', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // GET /api/v1/manufacturing-orders/:id
  public async getManufacturingOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid manufacturing order ID',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;

      const manufacturingOrder = await ManufacturingOrderModel.findByPk(id, {
        include: [
          {
            model: ProductModel,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type', 'cost_price'],
          },
          {
            model: BOMModel,
            as: 'bom',
            attributes: ['id', 'name', 'version', 'is_active', 'description'],
          },
        ],
      });

      if (!manufacturingOrder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'MANUFACTURING_ORDER_NOT_FOUND',
            message: 'Manufacturing order not found',
          },
        });
        return;
      }

      // Get associated work orders
      const workOrders = await WorkOrderModel.findAll({
        where: { manufacturing_order_id: id },
        order: [['sequence', 'ASC']],
      });

      const response = this.formatManufacturingOrderResponse(manufacturingOrder);
      response.workOrders = workOrders.map(wo => ({
        id: wo.id,
        reference: wo.wo_number, // Map wo_number to reference for frontend compatibility
        woNumber: wo.wo_number, // Keep original for backward compatibility
        manufacturingOrderId: wo.manufacturing_order_id,
        manufacturingOrderRef: manufacturingOrder.mo_number,
        operation: wo.operation,
        operationType: wo.operation_type || wo.operation, // Map operation_type
        workCenterId: wo.work_center_id,
        workCenterName: '', // TODO: Get from work center association
        workCenter: '', // Keep for backward compatibility
        status: wo.status,
        sequence: wo.sequence,
        estimatedDuration: wo.estimated_duration,
        actualDuration: wo.actual_duration,
        startDate: wo.start_time,
        endDate: wo.end_time,
        assigneeId: wo.assigned_to,
        assigneeName: '', // TODO: Get from user association
        assignee: '', // Keep for backward compatibility
        progress: 0, // TODO: Calculate progress
        notes: wo.instructions || '',
        createdAt: wo.created_at,
        updatedAt: wo.updated_at,
      }));

      res.status(200).json({
        success: true,
        data: {
          manufacturingOrder: response,
        },
      });
    } catch (error) {
      this.logger.error('Error fetching manufacturing order', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // POST /api/v1/manufacturing-orders
  public async createManufacturingOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid manufacturing order data',
            details: errors.array(),
          },
        });
        return;
      }

      const moData = req.body;

      // Verify product exists
      const product = await ProductModel.findByPk(moData.product_id);
      if (!product) {
        res.status(400).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        });
        return;
      }

      // Verify BOM exists
      const bom = await BOMModel.findByPk(moData.bom_id);
      if (!bom) {
        res.status(400).json({
          success: false,
          error: {
            code: 'BOM_NOT_FOUND',
            message: 'Bill of Materials not found',
          },
        });
        return;
      }

      // Generate MO number if not provided
      if (!moData.mo_number) {
        const count = await ManufacturingOrderModel.count();
        moData.mo_number = `MO-${String(count + 1).padStart(6, '0')}`;
      }

      const manufacturingOrder = await ManufacturingOrderModel.create(moData);

      res.status(201).json({
        success: true,
        data: {
          manufacturingOrder: this.formatManufacturingOrderResponse(manufacturingOrder),
        },
        message: 'Manufacturing order created successfully',
      });
    } catch (error) {
      this.logger.error('Error creating manufacturing order', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // PUT /api/v1/manufacturing-orders/:id
  public async updateManufacturingOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid manufacturing order data',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const manufacturingOrder = await ManufacturingOrderModel.findByPk(id);

      if (!manufacturingOrder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'MANUFACTURING_ORDER_NOT_FOUND',
            message: 'Manufacturing order not found',
          },
        });
        return;
      }

      await manufacturingOrder.update(updateData);

      res.status(200).json({
        success: true,
        data: {
          manufacturingOrder: this.formatManufacturingOrderResponse(manufacturingOrder),
        },
        message: 'Manufacturing order updated successfully',
      });
    } catch (error) {
      this.logger.error('Error updating manufacturing order', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // DELETE /api/v1/manufacturing-orders/:id
  public async deleteManufacturingOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid manufacturing order ID',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;

      const manufacturingOrder = await ManufacturingOrderModel.findByPk(id);

      if (!manufacturingOrder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'MANUFACTURING_ORDER_NOT_FOUND',
            message: 'Manufacturing order not found',
          },
        });
        return;
      }

      // Check if there are associated work orders
      const workOrderCount = await WorkOrderModel.count({
        where: { manufacturing_order_id: id }
      });

      if (workOrderCount > 0) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MANUFACTURING_ORDER_HAS_WORK_ORDERS',
            message: 'Cannot delete manufacturing order with associated work orders',
          },
        });
        return;
      }

      await manufacturingOrder.destroy();

      res.status(200).json({
        success: true,
        message: 'Manufacturing order deleted successfully',
      });
    } catch (error) {
      this.logger.error('Error deleting manufacturing order', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  private formatManufacturingOrderResponse(mo: ManufacturingOrderModel): any {
    return {
      id: mo.id,
      reference: mo.mo_number, // Map mo_number to reference for frontend compatibility
      moNumber: mo.mo_number, // Keep original for backward compatibility
      productId: mo.product_id,
      productName: mo.product?.name || '', // Add product name from association
      bomId: mo.bom_id,
      bomName: mo.bom?.name || '', // Add BOM name from association
      quantity: mo.quantity,
      quantityUnit: mo.quantity_unit,
      status: mo.status,
      priority: mo.priority,
      startDate: mo.planned_start_date, // Map planned_start_date to startDate
      dueDate: mo.planned_end_date, // Map planned_end_date to dueDate
      plannedStartDate: mo.planned_start_date, // Keep original for backward compatibility
      plannedEndDate: mo.planned_end_date, // Keep original for backward compatibility
      actualStartDate: mo.actual_start_date,
      actualEndDate: mo.actual_end_date,
      createdBy: mo.created_by,
      assignedTo: mo.assigned_to,
      assigneeId: mo.assigned_to, // Map assigned_to to assigneeId for frontend compatibility
      assigneeName: '', // TODO: Get from user association
      assignee: '', // Keep for backward compatibility
      workCenterId: '', // TODO: Get from work center association
      workCenterName: '', // TODO: Get from work center association
      workOrders: [], // Will be populated separately
      totalDuration: 0, // TODO: Calculate from work orders
      completedQuantity: 0, // TODO: Calculate from work order progress
      scrapQuantity: 0, // TODO: Get from quality records
      progress: 0, // TODO: Calculate based on work order completion
      notes: mo.notes,
      metadata: mo.metadata,
      product: mo.product,
      bom: mo.bom,
      createdAt: mo.created_at,
      updatedAt: mo.updated_at,
    };
  }
}
