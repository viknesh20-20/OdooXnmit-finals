import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { WorkOrderModel } from '@infrastructure/database/models/WorkOrderModel';
import { ManufacturingOrderModel } from '@infrastructure/database/models/ManufacturingOrderModel';
import { WorkCenterModel } from '@infrastructure/database/models/WorkCenterModel';
import { Logger } from '@infrastructure/logging/Logger';

export class WorkOrderController {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('WorkOrderController');
  }

  // GET /api/v1/work-orders
  public async getWorkOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        work_center_id,
        manufacturing_order_id,
        assigned_to,
        priority,
        sortBy = 'sequence',
        sortOrder = 'asc',
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // Apply filters
      if (search) {
        whereClause[Op.or] = [
          { wo_number: { [Op.iLike]: `%${search}%` } },
          { operation: { [Op.iLike]: `%${search}%` } },
          { instructions: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (status) {
        whereClause.status = status;
      }

      if (work_center_id) {
        whereClause.work_center_id = work_center_id;
      }

      if (manufacturing_order_id) {
        whereClause.manufacturing_order_id = manufacturing_order_id;
      }

      if (assigned_to) {
        whereClause.assigned_to = assigned_to;
      }

      if (priority) {
        whereClause.priority = priority;
      }

      const { count, rows } = await WorkOrderModel.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: ManufacturingOrderModel,
            as: 'manufacturingOrder',
            attributes: ['id', 'mo_number', 'product_id', 'status'],
          },
          {
            model: WorkCenterModel,
            as: 'workCenter',
            attributes: ['id', 'code', 'name', 'status'],
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
          workOrders: rows.map(workOrder => this.formatWorkOrderResponse(workOrder)),
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
      this.logger.error('Error fetching work orders', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // GET /api/v1/work-orders/:id
  public async getWorkOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid work order ID',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;

      const workOrder = await WorkOrderModel.findByPk(id, {
        include: [
          {
            model: ManufacturingOrderModel,
            as: 'manufacturingOrder',
            attributes: ['id', 'mo_number', 'product_id', 'status', 'quantity'],
          },
          {
            model: WorkCenterModel,
            as: 'workCenter',
            attributes: ['id', 'code', 'name', 'status', 'cost_per_hour'],
          },
        ],
      });

      if (!workOrder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WORK_ORDER_NOT_FOUND',
            message: 'Work order not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          workOrder: this.formatWorkOrderResponse(workOrder),
        },
      });
    } catch (error) {
      this.logger.error('Error fetching work order', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // POST /api/v1/work-orders
  public async createWorkOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid work order data',
            details: errors.array(),
          },
        });
        return;
      }

      const workOrderData = req.body;

      // Verify manufacturing order exists
      const manufacturingOrder = await ManufacturingOrderModel.findByPk(workOrderData.manufacturing_order_id);
      if (!manufacturingOrder) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MANUFACTURING_ORDER_NOT_FOUND',
            message: 'Manufacturing order not found',
          },
        });
        return;
      }

      // Verify work center exists
      const workCenter = await WorkCenterModel.findByPk(workOrderData.work_center_id);
      if (!workCenter) {
        res.status(400).json({
          success: false,
          error: {
            code: 'WORK_CENTER_NOT_FOUND',
            message: 'Work center not found',
          },
        });
        return;
      }

      // Generate work order number if not provided
      if (!workOrderData.wo_number) {
        const count = await WorkOrderModel.count();
        workOrderData.wo_number = `WO-${String(count + 1).padStart(6, '0')}`;
      }

      const workOrder = await WorkOrderModel.create(workOrderData);

      res.status(201).json({
        success: true,
        data: {
          workOrder: this.formatWorkOrderResponse(workOrder),
        },
        message: 'Work order created successfully',
      });
    } catch (error) {
      this.logger.error('Error creating work order', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // PUT /api/v1/work-orders/:id
  public async updateWorkOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid work order data',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const workOrder = await WorkOrderModel.findByPk(id);

      if (!workOrder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WORK_ORDER_NOT_FOUND',
            message: 'Work order not found',
          },
        });
        return;
      }

      await workOrder.update(updateData);

      res.status(200).json({
        success: true,
        data: {
          workOrder: this.formatWorkOrderResponse(workOrder),
        },
        message: 'Work order updated successfully',
      });
    } catch (error) {
      this.logger.error('Error updating work order', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // DELETE /api/v1/work-orders/:id
  public async deleteWorkOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid work order ID',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;

      const workOrder = await WorkOrderModel.findByPk(id);

      if (!workOrder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WORK_ORDER_NOT_FOUND',
            message: 'Work order not found',
          },
        });
        return;
      }

      await workOrder.destroy();

      res.status(200).json({
        success: true,
        message: 'Work order deleted successfully',
      });
    } catch (error) {
      this.logger.error('Error deleting work order', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // PUT /api/v1/work-orders/:id/status
  public async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid status update data',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;
      const { status, comments } = req.body;

      const workOrder = await WorkOrderModel.findByPk(id);

      if (!workOrder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WORK_ORDER_NOT_FOUND',
            message: 'Work order not found',
          },
        });
        return;
      }

      const updateData: any = { status };

      // Handle status-specific logic
      if (status === 'in_progress' && !workOrder.start_time) {
        updateData.start_time = new Date();
      } else if (status === 'completed' && !workOrder.end_time) {
        updateData.end_time = new Date();

        // Calculate actual duration if start time exists
        if (workOrder.start_time) {
          const startTime = new Date(workOrder.start_time);
          const endTime = new Date();
          const durationMs = endTime.getTime() - startTime.getTime();
          updateData.actual_duration = Math.round(durationMs / (1000 * 60)); // Convert to minutes
        }
      }

      if (comments) {
        updateData.comments = workOrder.comments
          ? `${workOrder.comments}\n[${new Date().toISOString()}] ${comments}`
          : `[${new Date().toISOString()}] ${comments}`;
      }

      await workOrder.update(updateData);

      res.status(200).json({
        success: true,
        data: {
          workOrder: this.formatWorkOrderResponse(workOrder),
        },
        message: `Work order status updated to ${status}`,
      });
    } catch (error) {
      this.logger.error('Error updating work order status', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // POST /api/v1/work-orders/:id/time-entries
  public async addTimeEntry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid time entry data',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;
      const { start_time, end_time, duration, description, user_id } = req.body;

      const workOrder = await WorkOrderModel.findByPk(id);

      if (!workOrder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WORK_ORDER_NOT_FOUND',
            message: 'Work order not found',
          },
        });
        return;
      }

      const timeEntry = {
        id: require('crypto').randomUUID(),
        start_time,
        end_time,
        duration,
        description,
        user_id,
        created_at: new Date().toISOString(),
      };

      const updatedTimeEntries = [...workOrder.time_entries, timeEntry];

      // Update total actual duration
      const totalDuration = updatedTimeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

      await workOrder.update({
        time_entries: updatedTimeEntries,
        actual_duration: totalDuration,
      });

      res.status(201).json({
        success: true,
        data: {
          timeEntry,
          workOrder: this.formatWorkOrderResponse(workOrder),
        },
        message: 'Time entry added successfully',
      });
    } catch (error) {
      this.logger.error('Error adding time entry', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // PATCH /api/v1/work-orders/:id/start
  public async startWorkOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const workOrder = await WorkOrderModel.findByPk(id);

      if (!workOrder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WORK_ORDER_NOT_FOUND',
            message: 'Work order not found',
          },
        });
        return;
      }

      const updateData = {
        status: 'in-progress',
        start_time: new Date(),
        updated_at: new Date(),
      };

      await workOrder.update(updateData);

      res.status(200).json({
        success: true,
        data: this.formatWorkOrderResponse(workOrder),
        message: 'Work order started successfully',
      });
    } catch (error) {
      this.logger.error('Error starting work order', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // PATCH /api/v1/work-orders/:id/pause
  public async pauseWorkOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { comments } = req.body;

      const workOrder = await WorkOrderModel.findByPk(id);

      if (!workOrder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WORK_ORDER_NOT_FOUND',
            message: 'Work order not found',
          },
        });
        return;
      }

      const updateData: any = {
        status: 'paused',
        updated_at: new Date(),
      };

      if (comments) {
        updateData.comments = comments;
      }

      await workOrder.update(updateData);

      res.status(200).json({
        success: true,
        data: this.formatWorkOrderResponse(workOrder),
        message: 'Work order paused successfully',
      });
    } catch (error) {
      this.logger.error('Error pausing work order', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // PATCH /api/v1/work-orders/:id/complete
  public async completeWorkOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { comments } = req.body;

      const workOrder = await WorkOrderModel.findByPk(id);

      if (!workOrder) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WORK_ORDER_NOT_FOUND',
            message: 'Work order not found',
          },
        });
        return;
      }

      const updateData: any = {
        status: 'completed',
        end_time: new Date(),
        updated_at: new Date(),
      };

      if (comments) {
        updateData.comments = comments;
      }

      // Calculate actual duration if start_time exists
      if (workOrder.start_time) {
        const startTime = new Date(workOrder.start_time);
        const endTime = new Date();
        const durationMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60));
        updateData.actual_duration = durationMinutes;
      }

      await workOrder.update(updateData);

      res.status(200).json({
        success: true,
        data: this.formatWorkOrderResponse(workOrder),
        message: 'Work order completed successfully',
      });
    } catch (error) {
      this.logger.error('Error completing work order', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  private formatWorkOrderResponse(workOrder: WorkOrderModel): any {
    return {
      id: workOrder.id,
      reference: workOrder.wo_number,
      woNumber: workOrder.wo_number,
      manufacturingOrderId: workOrder.manufacturing_order_id,
      manufacturingOrderRef: workOrder.manufacturingOrder?.mo_number,
      workCenterId: workOrder.work_center_id,
      workCenterName: workOrder.workCenter?.name,
      workCenter: workOrder.workCenter?.name, // For backward compatibility
      operation: workOrder.operation,
      operationType: workOrder.operation_type,
      duration: workOrder.duration,
      estimatedDuration: workOrder.estimated_duration,
      actualDuration: workOrder.actual_duration,
      status: workOrder.status,
      priority: workOrder.priority,
      assigneeId: workOrder.assigned_to,
      assignee: workOrder.assigned_to || '', // For backward compatibility
      assigneeName: '', // TODO: Add user lookup if needed
      sequence: workOrder.sequence,
      startTime: workOrder.start_time?.toISOString(),
      endTime: workOrder.end_time?.toISOString(),
      pauseTime: workOrder.pause_time,
      dependencies: workOrder.dependencies || [],
      instructions: workOrder.instructions,
      comments: workOrder.comments,
      qualityChecks: workOrder.quality_checks || [],
      timeEntries: workOrder.time_entries || [],
      metadata: workOrder.metadata,
      manufacturingOrder: workOrder.manufacturingOrder,
      createdAt: workOrder.created_at?.toISOString(),
      updatedAt: workOrder.updated_at?.toISOString(),
    };
  }
}
