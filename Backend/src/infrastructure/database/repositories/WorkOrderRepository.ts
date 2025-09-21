import { inject, injectable } from 'inversify';
import { Op } from 'sequelize';

import { UUID, PaginatedResult, Pagination } from '@/types/common';
import { IWorkOrderRepository, WorkOrder } from '@domain/repositories/IUserRepository';
import { DatabaseConnection } from '@infrastructure/database/config/DatabaseConfig';
import { ILogger } from '@application/interfaces/IPasswordService';

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
      this.logger.error('Error finding work order by ID', error as Error);
      throw error;
    }
  }

  public async findAll(pagination?: Pagination): Promise<PaginatedResult<WorkOrder>> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkOrderModel = sequelize.models.WorkOrder as any;

      const limit = pagination?.limit || 10;
      const offset = pagination?.offset || 0;

      const { count, rows } = await WorkOrderModel.findAndCountAll({
        limit,
        offset,
        order: [['created_at', 'DESC']]
      });

      const data = rows.map((record: any) => this.mapToWorkOrder(record));
      const totalPages = Math.ceil(count / limit);

      return {
        data,
        total: count,
        page: pagination?.page || 1,
        limit,
        totalPages
      };
    } catch (error) {
      this.logger.error('Error finding all work orders', error as Error);
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
      this.logger.error('Error saving work order', error as Error);
      throw error;
    }
  }

  public async delete(id: UUID): Promise<void> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkOrderModel = sequelize.models.WorkOrder as any;

      await WorkOrderModel.destroy({ where: { id } });
    } catch (error) {
      this.logger.error('Error deleting work order', error as Error);
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
      this.logger.error('Error finding work order by WO number', error as Error);
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
      this.logger.error('Error finding work orders by MO ID', error as Error);
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
      this.logger.error('Error finding work orders by status', error as Error);
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
      this.logger.error('Error finding work orders by work center ID', error as Error);
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
      this.logger.error('Error finding work orders by assigned user', error as Error);
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
      this.logger.error('Error finding active work orders', error as Error);
      throw error;
    }
  }

  public async generateWoNumber(): Promise<string> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkOrderModel = sequelize.models.WorkOrder as any;

      // Find the latest work order number
      const latestRecord = await WorkOrderModel.findOne({
        order: [['created_at', 'DESC']],
        attributes: ['wo_number']
      });

      let nextNumber = 1;
      if (latestRecord && latestRecord.wo_number) {
        const match = latestRecord.wo_number.match(/WO(\d+)/);
        if (match) {
          nextNumber = parseInt(match[1]) + 1;
        }
      }

      return `WO${nextNumber.toString().padStart(6, '0')}`;
    } catch (error) {
      this.logger.error('Error generating WO number', error as Error);
      throw error;
    }
  }

  public async existsByWoNumber(woNumber: string): Promise<boolean> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkOrderModel = sequelize.models.WorkOrder as any;

      const count = await WorkOrderModel.count({ where: { wo_number: woNumber } });
      return count > 0;
    } catch (error) {
      this.logger.error('Error checking work order existence by WO number', error as Error);
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
      createdAt: new Date(record.created_at || record.createdAt),
      updatedAt: new Date(record.updated_at || record.updatedAt)
    };
  }
}
