import { inject, injectable } from 'inversify';
import { Op } from 'sequelize';

import { UUID, PaginatedResult, Pagination } from '@/types/common';
import { IWorkCenterRepository, WorkCenter } from '@domain/repositories/IUserRepository';
import { DatabaseConnection } from '@infrastructure/database/config/DatabaseConfig';
import { ILogger } from '@application/interfaces/IPasswordService';

@injectable()
export class WorkCenterRepository implements IWorkCenterRepository {
  constructor(
    @inject('DatabaseConnection') private readonly databaseConnection: DatabaseConnection,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async findById(id: UUID): Promise<WorkCenter | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkCenterModel = sequelize.models.WorkCenter as any;

      const record = await WorkCenterModel.findByPk(id);
      if (!record) return null;

      return this.mapToWorkCenter(record);
    } catch (error) {
      this.logger.error('Error finding work center by ID', error as Error);
      throw error;
    }
  }

  public async findAll(pagination?: Pagination): Promise<PaginatedResult<WorkCenter>> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkCenterModel = sequelize.models.WorkCenter as any;

      const limit = pagination?.limit || 10;
      const offset = pagination?.offset || 0;

      const { count, rows } = await WorkCenterModel.findAndCountAll({
        limit,
        offset,
        order: [['name', 'ASC']]
      });

      const data = rows.map((record: any) => this.mapToWorkCenter(record));
      const totalPages = Math.ceil(count / limit);

      return {
        data,
        total: count,
        page: pagination?.page || 1,
        limit,
        totalPages
      };
    } catch (error) {
      this.logger.error('Error finding all work centers', error as Error);
      throw error;
    }
  }

  public async save(workCenter: WorkCenter): Promise<WorkCenter> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkCenterModel = sequelize.models.WorkCenter as any;

      const [record] = await WorkCenterModel.upsert({
        id: workCenter.id,
        code: workCenter.code,
        name: workCenter.name,
        status: workCenter.status,
        utilization: workCenter.utilization,
        capacity: workCenter.capacity,
        efficiency: workCenter.efficiency,
        oee_score: workCenter.oeeScore,
        downtime_hours: workCenter.downtimeHours,
        productive_hours: workCenter.productiveHours,
        updated_at: new Date()
      });

      return this.mapToWorkCenter(record);
    } catch (error) {
      this.logger.error('Error saving work center', error as Error);
      throw error;
    }
  }

  public async delete(id: UUID): Promise<void> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkCenterModel = sequelize.models.WorkCenter as any;

      await WorkCenterModel.destroy({ where: { id } });
    } catch (error) {
      this.logger.error('Error deleting work center', error as Error);
      throw error;
    }
  }

  public async findByCode(code: string): Promise<WorkCenter | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkCenterModel = sequelize.models.WorkCenter as any;

      const record = await WorkCenterModel.findOne({ where: { code } });
      if (!record) return null;

      return this.mapToWorkCenter(record);
    } catch (error) {
      this.logger.error('Error finding work center by code', error as Error);
      throw error;
    }
  }

  public async findActiveWorkCenters(): Promise<WorkCenter[]> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkCenterModel = sequelize.models.WorkCenter as any;

      const records = await WorkCenterModel.findAll({
        where: { status: 'active' },
        order: [['name', 'ASC']]
      });

      return records.map((record: any) => this.mapToWorkCenter(record));
    } catch (error) {
      this.logger.error('Error finding active work centers', error as Error);
      throw error;
    }
  }

  public async existsByCode(code: string): Promise<boolean> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkCenterModel = sequelize.models.WorkCenter as any;

      const count = await WorkCenterModel.count({ where: { code } });
      return count > 0;
    } catch (error) {
      this.logger.error('Error checking work center existence by code', error as Error);
      throw error;
    }
  }

  private mapToWorkCenter(record: any): WorkCenter {
    return {
      id: record.id,
      code: record.code,
      name: record.name,
      status: record.status,
      utilization: record.utilization || 0,
      capacity: record.capacity || 0,
      efficiency: record.efficiency || 0,
      oeeScore: record.oee_score,
      downtimeHours: record.downtime_hours,
      productiveHours: record.productive_hours,
      createdAt: new Date(record.created_at || record.createdAt),
      updatedAt: new Date(record.updated_at || record.updatedAt)
    };
  }
}
