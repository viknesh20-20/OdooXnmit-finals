import { inject, injectable } from 'inversify';
import { Op } from 'sequelize';

import { UUID, PaginatedResult, Pagination } from '@/types/common';
import { IWorkOrderRepository } from '@domain/repositories/IUserRepository';
import { DatabaseConnection } from '@infrastructure/database/config/DatabaseConfig';
import { ILogger } from '@application/interfaces/IPasswordService';

// Simple WorkOrder interface for dashboard data
export interface WorkOrder {
  id: string;
  woNumber?: string;
  manufacturingOrderId?: string;
  operation?: string;
  workCenterName?: string;
  status: string;
  assignedTo?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  createdAt?: string;
  updatedAt?: string;
}

@injectable()
export class WorkOrderRepository implements IWorkOrderRepository {
  constructor(
    @inject('DatabaseConnection') private readonly databaseConnection: DatabaseConnection,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async findById(id: UUID): Promise<WorkOrder | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkOrderModel = sequelize.models.WorkOrder as any;

      const record = await WorkOrderModel.findByPk(id);
      if (!record) return null;

      return this.mapToWorkOrder(record);
    } catch (error) {
      this.logger.error('Error finding work order by ID', { id, error });
      throw error;
    }
  }

  public async findAll(options?: { limit?: number; offset?: number }): Promise<WorkOrder[]> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkOrderModel = sequelize.models.WorkOrder as any;

      const records = await WorkOrderModel.findAll({
        limit: options?.limit || 100,
        offset: options?.offset || 0,
        order: [['created_at', 'DESC']]
      });

      return records.map((record: any) => this.mapToWorkOrder(record));
    } catch (error) {
      this.logger.error('Error finding all work orders', { error });
      throw error;
    }
  }

  public async save(workOrder: WorkOrder): Promise<WorkOrder> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkOrderModel = sequelize.models.WorkOrder as any;

      const [record] = await WorkOrderModel.upsert({
        id: workOrder.id,
        wo_number: workOrder.woNumber,
        manufacturing_order_id: workOrder.manufacturingOrderId,
        operation: workOrder.operation,
        work_center_name: workOrder.workCenterName,
        status: workOrder.status,
        assigned_to: workOrder.assignedTo,
        start_time: workOrder.startTime,
        end_time: workOrder.endTime,
        duration: workOrder.duration,
        updated_at: new Date()
      });

      return this.mapToWorkOrder(record);
    } catch (error) {
      this.logger.error('Error saving work order', { workOrder, error });
      throw error;
    }
  }

  public async delete(id: UUID): Promise<void> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkOrderModel = sequelize.models.WorkOrder as any;

      await WorkOrderModel.destroy({ where: { id } });
    } catch (error) {
      this.logger.error('Error deleting work order', { id, error });
      throw error;
    }
  }

  public async findByWoNumber(woNumber: string): Promise<WorkOrder | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkOrderModel = sequelize.models.WorkOrder as any;

      const record = await WorkOrderModel.findOne({ where: { wo_number: woNumber } });
      if (!record) return null;

      return this.mapToWorkOrder(record);
    } catch (error) {
      this.logger.error('Error finding work order by WO number', { woNumber, error });
      throw error;
    }
  }

  public async findByManufacturingOrderId(moId: UUID): Promise<WorkOrder[]> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkOrderModel = sequelize.models.WorkOrder as any;

      const records = await WorkOrderModel.findAll({
        where: { manufacturing_order_id: moId },
        order: [['created_at', 'ASC']]
      });

      return records.map((record: any) => this.mapToWorkOrder(record));
    } catch (error) {
      this.logger.error('Error finding work orders by MO ID', { moId, error });
      throw error;
    }
  }

  public async findByStatus(status: string, pagination?: Pagination): Promise<PaginatedResult<WorkOrder>> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkOrderModel = sequelize.models.WorkOrder as any;

      const limit = pagination?.limit || 20;
      const offset = pagination?.offset || 0;

      const { count, rows } = await WorkOrderModel.findAndCountAll({
        where: { status },
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      return {
        data: rows.map((record: any) => this.mapToWorkOrder(record)),
        total: count,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      this.logger.error('Error finding work orders by status', { status, error });
      throw error;
    }
  }

  public async findByWorkCenterId(workCenterId: UUID, pagination?: Pagination): Promise<PaginatedResult<WorkOrder>> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkOrderModel = sequelize.models.WorkOrder as any;

      const limit = pagination?.limit || 20;
      const offset = pagination?.offset || 0;

      const { count, rows } = await WorkOrderModel.findAndCountAll({
        where: { work_center_id: workCenterId },
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      return {
        data: rows.map((record: any) => this.mapToWorkOrder(record)),
        total: count,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      this.logger.error('Error finding work orders by work center ID', { workCenterId, error });
      throw error;
    }
  }

  public async findByAssignedTo(userId: UUID, pagination?: Pagination): Promise<PaginatedResult<WorkOrder>> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkOrderModel = sequelize.models.WorkOrder as any;

      const limit = pagination?.limit || 20;
      const offset = pagination?.offset || 0;

      const { count, rows } = await WorkOrderModel.findAndCountAll({
        where: { assigned_to: userId },
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      return {
        data: rows.map((record: any) => this.mapToWorkOrder(record)),
        total: count,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil(count / limit)
      };
    } catch (error) {
      this.logger.error('Error finding work orders by assigned user', { userId, error });
      throw error;
    }
  }

  public async findActiveWorkOrders(): Promise<WorkOrder[]> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkOrderModel = sequelize.models.WorkOrder as any;

      const records = await WorkOrderModel.findAll({
        where: { status: { [Op.in]: ['in-progress', 'pending'] } },
        order: [['created_at', 'DESC']]
      });

      return records.map((record: any) => this.mapToWorkOrder(record));
    } catch (error) {
      this.logger.error('Error finding active work orders', { error });
      throw error;
    }
  }

  private mapToWorkOrder(record: any): WorkOrder {
    return {
      id: record.id,
      woNumber: record.wo_number,
      manufacturingOrderId: record.manufacturing_order_id,
      operation: record.operation,
      workCenterName: record.work_center_name,
      status: record.status,
      assignedTo: record.assigned_to,
      startTime: record.start_time,
      endTime: record.end_time,
      duration: record.duration,
      createdAt: record.created_at || record.createdAt,
      updatedAt: record.updated_at || record.updatedAt
    };
  }
}
