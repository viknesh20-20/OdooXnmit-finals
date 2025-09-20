import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { resolve } from '@infrastructure/di/Container';
import { ILogger } from '@application/interfaces/IPasswordService';
import { WorkCenterModel } from '@infrastructure/database/models/WorkCenterModel';

export class WorkCenterController {
  private logger: ILogger;

  constructor() {
    this.logger = resolve<ILogger>('ILogger');
  }

  // GET /api/v1/work-centers
  public async getWorkCenters(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        location,
        sortBy = 'name',
        sortOrder = 'asc',
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // Apply filters
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { code: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (status) {
        whereClause.status = status;
      }

      if (location) {
        whereClause.location = { [Op.iLike]: `%${location}%` };
      }

      const { count, rows } = await WorkCenterModel.findAndCountAll({
        where: whereClause,
        limit: Number(limit),
        offset,
        order: [[sortBy as string, sortOrder as string]],
      });

      const totalPages = Math.ceil(count / Number(limit));

      res.status(200).json({
        success: true,
        data: {
          workCenters: rows.map(workCenter => this.formatWorkCenterResponse(workCenter)),
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
      this.logger.error(`Error fetching work centers: ${(error as Error).message}`);
      next(error);
    }
  }

  // GET /api/v1/work-centers/:id
  public async getWorkCenter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid work center ID',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;

      const workCenter = await WorkCenterModel.findByPk(id);

      if (!workCenter) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WORK_CENTER_NOT_FOUND',
            message: 'Work center not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          workCenter: this.formatWorkCenterResponse(workCenter),
        },
      });
    } catch (error) {
      this.logger.error(`Error fetching work center: ${(error as Error).message}`);
      next(error);
    }
  }

  // POST /api/v1/work-centers
  public async createWorkCenter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid work center data',
            details: errors.array(),
          },
        });
        return;
      }

      const workCenterData = req.body;

      // Check if code already exists
      const existingWorkCenter = await WorkCenterModel.findOne({
        where: { code: workCenterData.code },
      });

      if (existingWorkCenter) {
        res.status(409).json({
          success: false,
          error: {
            code: 'CODE_ALREADY_EXISTS',
            message: 'A work center with this code already exists',
          },
        });
        return;
      }

      const workCenter = await WorkCenterModel.create(workCenterData);

      this.logger.info('Work center created successfully', { workCenterId: workCenter.id, code: workCenter.code });

      res.status(201).json({
        success: true,
        data: {
          workCenter: this.formatWorkCenterResponse(workCenter),
        },
        message: 'Work center created successfully',
      });
    } catch (error) {
      this.logger.error(`Error creating work center: ${(error as Error).message}`);
      next(error);
    }
  }

  // PUT /api/v1/work-centers/:id
  public async updateWorkCenter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid work center data',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const workCenter = await WorkCenterModel.findByPk(id);

      if (!workCenter) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WORK_CENTER_NOT_FOUND',
            message: 'Work center not found',
          },
        });
        return;
      }

      // Check if code already exists (excluding current work center)
      if (updateData.code && updateData.code !== workCenter.code) {
        const existingWorkCenter = await WorkCenterModel.findOne({
          where: { code: updateData.code },
        });

        if (existingWorkCenter) {
          res.status(409).json({
            success: false,
            error: {
              code: 'CODE_ALREADY_EXISTS',
              message: 'A work center with this code already exists',
            },
          });
          return;
        }
      }

      await workCenter.update(updateData);

      this.logger.info('Work center updated successfully', { workCenterId: id });

      res.status(200).json({
        success: true,
        data: {
          workCenter: this.formatWorkCenterResponse(workCenter),
        },
        message: 'Work center updated successfully',
      });
    } catch (error) {
      this.logger.error(`Error updating work center: ${(error as Error).message}`);
      next(error);
    }
  }

  // DELETE /api/v1/work-centers/:id
  public async deleteWorkCenter(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid work center ID',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;

      const workCenter = await WorkCenterModel.findByPk(id);

      if (!workCenter) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WORK_CENTER_NOT_FOUND',
            message: 'Work center not found',
          },
        });
        return;
      }

      // Set status to inactive instead of hard delete
      await workCenter.update({ status: 'inactive' });

      this.logger.info('Work center deleted successfully', { workCenterId: id });

      res.status(200).json({
        success: true,
        message: 'Work center deleted successfully',
      });
    } catch (error) {
      this.logger.error(`Error deleting work center: ${(error as Error).message}`);
      next(error);
    }
  }

  // PUT /api/v1/work-centers/:id/utilization
  public async updateUtilization(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid utilization data',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;
      const { utilization, oee_score, downtime_hours, productive_hours } = req.body;

      const workCenter = await WorkCenterModel.findByPk(id);

      if (!workCenter) {
        res.status(404).json({
          success: false,
          error: {
            code: 'WORK_CENTER_NOT_FOUND',
            message: 'Work center not found',
          },
        });
        return;
      }

      await workCenter.update({
        utilization,
        oee_score,
        downtime_hours,
        productive_hours,
      });

      this.logger.info('Work center utilization updated successfully', { workCenterId: id });

      res.status(200).json({
        success: true,
        data: {
          workCenter: this.formatWorkCenterResponse(workCenter),
        },
        message: 'Work center utilization updated successfully',
      });
    } catch (error) {
      this.logger.error(`Error updating work center utilization: ${(error as Error).message}`);
      next(error);
    }
  }

  private formatWorkCenterResponse(workCenter: any): any {
    return {
      id: workCenter.id,
      code: workCenter.code,
      name: workCenter.name,
      description: workCenter.description,
      costPerHour: parseFloat(workCenter.cost_per_hour || '0'),
      capacity: workCenter.capacity,
      efficiency: parseFloat(workCenter.efficiency || '0'),
      status: workCenter.status,
      utilization: parseFloat(workCenter.utilization || '0'),
      location: workCenter.location,
      availability: parseFloat(workCenter.availability || '0'),
      maintenanceSchedule: workCenter.maintenance_schedule,
      nextMaintenance: workCenter.next_maintenance,
      operatorIds: workCenter.operator_ids,
      capabilities: workCenter.capabilities,
      workingHours: workCenter.working_hours,
      oeeScore: parseFloat(workCenter.oee_score || '0'),
      downtimeHours: parseFloat(workCenter.downtime_hours || '0'),
      productiveHours: parseFloat(workCenter.productive_hours || '0'),
      metadata: workCenter.metadata,
      createdAt: workCenter.created_at,
      updatedAt: workCenter.updated_at,
    };
  }
}
