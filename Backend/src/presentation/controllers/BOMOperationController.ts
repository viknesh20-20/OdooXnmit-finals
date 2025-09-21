import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { BOMOperationModel } from '@infrastructure/database/models/BOMModel';
import { WorkCenterModel } from '@infrastructure/database/models/WorkCenterModel';
import { BOMModel } from '@infrastructure/database/models/BOMModel';
import { Logger } from '@infrastructure/logging/Logger';

export class BOMOperationController {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('BOMOperationController');
  }

  // GET /api/v1/bom-operations
  public async getBOMOperations(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        bom_id,
        operation_type,
        work_center_id,
        sortBy = 'sequence',
        sortOrder = 'asc',
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // Apply filters
      if (search) {
        whereClause[Op.or] = [
          { operation: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { instructions: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (bom_id) whereClause.bom_id = bom_id;
      if (operation_type) whereClause.operation_type = operation_type;
      if (work_center_id) whereClause.work_center_id = work_center_id;

      const { count, rows: operations } = await BOMOperationModel.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: BOMModel,
            as: 'bom',
            attributes: ['id', 'name', 'version'],
          },
          {
            model: WorkCenterModel,
            as: 'workCenter',
            attributes: ['id', 'name', 'type'],
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
          operations: operations.map(op => this.formatBOMOperationResponse(op)),
          pagination: {
            currentPage: Number(page),
            totalPages,
            totalItems: count,
            itemsPerPage: Number(limit),
            hasNextPage: Number(page) < totalPages,
            hasPreviousPage: Number(page) > 1,
          },
        },
      });
    } catch (error) {
      this.logger.error('Error fetching BOM operations', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // GET /api/v1/bom-operations/:id
  public async getBOMOperation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid BOM operation ID',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;

      const operation = await BOMOperationModel.findByPk(id, {
        include: [
          {
            model: BOMModel,
            as: 'bom',
            attributes: ['id', 'name', 'version'],
          },
          {
            model: WorkCenterModel,
            as: 'workCenter',
            attributes: ['id', 'name', 'type'],
          },
        ],
      });

      if (!operation) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BOM_OPERATION_NOT_FOUND',
            message: 'BOM operation not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          operation: this.formatBOMOperationResponse(operation),
        },
      });
    } catch (error) {
      this.logger.error('Error fetching BOM operation', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // GET /api/v1/bom-operations/bom/:bomId
  public async getBOMOperationsByBOM(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid BOM ID',
            details: errors.array(),
          },
        });
        return;
      }

      const { bomId } = req.params;

      const operations = await BOMOperationModel.findAll({
        where: { bom_id: bomId },
        include: [
          {
            model: WorkCenterModel,
            as: 'workCenter',
            attributes: ['id', 'name', 'type'],
          },
        ],
        order: [['sequence', 'ASC']],
      });

      res.status(200).json({
        success: true,
        data: {
          operations: operations.map(op => this.formatBOMOperationResponse(op)),
        },
      });
    } catch (error) {
      this.logger.error('Error fetching BOM operations by BOM', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // POST /api/v1/bom-operations
  public async createBOMOperation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid BOM operation data',
            details: errors.array(),
          },
        });
        return;
      }

      const operationData = req.body;

      // Calculate total cost if not provided
      if (!operationData.total_cost && operationData.cost_per_hour) {
        const totalDuration = (operationData.duration || 0) + (operationData.setup_time || 0) + (operationData.teardown_time || 0);
        operationData.total_cost = (totalDuration / 60) * operationData.cost_per_hour;
      }

      const operation = await BOMOperationModel.create(operationData);

      const createdOperation = await BOMOperationModel.findByPk(operation.id, {
        include: [
          {
            model: BOMModel,
            as: 'bom',
            attributes: ['id', 'name', 'version'],
          },
          {
            model: WorkCenterModel,
            as: 'workCenter',
            attributes: ['id', 'name', 'type'],
          },
        ],
      });

      res.status(201).json({
        success: true,
        data: {
          operation: this.formatBOMOperationResponse(createdOperation!),
        },
        message: 'BOM operation created successfully',
      });
    } catch (error) {
      this.logger.error('Error creating BOM operation', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // PUT /api/v1/bom-operations/:id
  public async updateBOMOperation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid BOM operation data',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const operation = await BOMOperationModel.findByPk(id);
      if (!operation) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BOM_OPERATION_NOT_FOUND',
            message: 'BOM operation not found',
          },
        });
        return;
      }

      // Calculate total cost if cost_per_hour or duration changed
      if (updateData.cost_per_hour || updateData.duration || updateData.setup_time || updateData.teardown_time) {
        const duration = updateData.duration || operation.duration;
        const setupTime = updateData.setup_time || operation.setup_time;
        const teardownTime = updateData.teardown_time || operation.teardown_time;
        const costPerHour = updateData.cost_per_hour || operation.cost_per_hour;

        const totalDuration = duration + setupTime + teardownTime;
        updateData.total_cost = (totalDuration / 60) * costPerHour;
      }

      await operation.update(updateData);

      const updatedOperation = await BOMOperationModel.findByPk(id, {
        include: [
          {
            model: BOMModel,
            as: 'bom',
            attributes: ['id', 'name', 'version'],
          },
          {
            model: WorkCenterModel,
            as: 'workCenter',
            attributes: ['id', 'name', 'type'],
          },
        ],
      });

      res.status(200).json({
        success: true,
        data: {
          operation: this.formatBOMOperationResponse(updatedOperation!),
        },
        message: 'BOM operation updated successfully',
      });
    } catch (error) {
      this.logger.error('Error updating BOM operation', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // DELETE /api/v1/bom-operations/:id
  public async deleteBOMOperation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid BOM operation ID',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;

      const operation = await BOMOperationModel.findByPk(id);
      if (!operation) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BOM_OPERATION_NOT_FOUND',
            message: 'BOM operation not found',
          },
        });
        return;
      }

      await operation.destroy();

      res.status(200).json({
        success: true,
        message: 'BOM operation deleted successfully',
      });
    } catch (error) {
      this.logger.error('Error deleting BOM operation', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // PUT /api/v1/bom-operations/bom/:bomId/reorder
  public async reorderBOMOperations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid reorder data',
            details: errors.array(),
          },
        });
        return;
      }

      const { bomId } = req.params;
      const { operations } = req.body;

      // Update sequences in a transaction
      const sequelize = BOMOperationModel.sequelize!;
      await sequelize.transaction(async (transaction) => {
        for (const op of operations) {
          await BOMOperationModel.update(
            { sequence: op.sequence },
            {
              where: { id: op.id, bom_id: bomId },
              transaction
            }
          );
        }
      });

      const reorderedOperations = await BOMOperationModel.findAll({
        where: { bom_id: bomId },
        include: [
          {
            model: WorkCenterModel,
            as: 'workCenter',
            attributes: ['id', 'name', 'type'],
          },
        ],
        order: [['sequence', 'ASC']],
      });

      res.status(200).json({
        success: true,
        data: {
          operations: reorderedOperations.map(op => this.formatBOMOperationResponse(op)),
        },
        message: 'BOM operations reordered successfully',
      });
    } catch (error) {
      this.logger.error('Error reordering BOM operations', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  private formatBOMOperationResponse(operation: BOMOperationModel): any {
    return {
      id: operation.id,
      bomId: operation.bom_id,
      operation: operation.operation,
      operationType: operation.operation_type,
      workCenterId: operation.work_center_id,
      duration: operation.duration,
      setupTime: operation.setup_time,
      teardownTime: operation.teardown_time,
      costPerHour: operation.cost_per_hour,
      totalCost: operation.total_cost,
      sequence: operation.sequence,
      description: operation.description,
      instructions: operation.instructions,
      qualityRequirements: operation.quality_requirements,
      toolsRequired: operation.tools_required,
      skillsRequired: operation.skills_required,
      metadata: operation.metadata,
      bom: operation.bom,
      workCenter: operation.workCenter,
      createdAt: operation.created_at,
      updatedAt: operation.updated_at,
    };
  }
}
