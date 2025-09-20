import { inject, injectable } from 'inversify';
import { Op } from 'sequelize';

import { UUID, PaginatedResult, Pagination } from '@/types/common';
import { IWorkCenterRepository } from '@domain/repositories/IUserRepository';
import { DatabaseConnection } from '@infrastructure/database/config/DatabaseConfig';
import { ILogger } from '@application/interfaces/IPasswordService';

// Simple WorkCenter interface for dashboard data
export interface WorkCenter {
  id: string;
  code: string;
  name: string;
  status: string;
  utilization: number;
  capacity: number;
  efficiency: number;
  oeeScore?: number;
  downtimeHours?: number;
  productiveHours?: number;
  createdAt: string;
  updatedAt: string;
}

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
      this.logger.error('Error finding work center by ID', { id, error });
      throw error;
    }
  }

  public async findAll(options?: { limit?: number; offset?: number }): Promise<WorkCenter[]> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkCenterModel = sequelize.models.WorkCenter as any;

      const records = await WorkCenterModel.findAll({
        limit: options?.limit || 50,
        offset: options?.offset || 0,
        order: [['name', 'ASC']]
      });

      return records.map((record: any) => this.mapToWorkCenter(record));
    } catch (error) {
      this.logger.error('Error finding all work centers', { error });
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
      this.logger.error('Error saving work center', { workCenter, error });
      throw error;
    }
  }

  public async delete(id: UUID): Promise<void> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const WorkCenterModel = sequelize.models.WorkCenter as any;

      await WorkCenterModel.destroy({ where: { id } });
    } catch (error) {
      this.logger.error('Error deleting work center', { id, error });
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
      this.logger.error('Error finding work center by code', { code, error });
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
      this.logger.error('Error finding active work centers', { error });
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
      this.logger.error('Error checking work center existence by code', { code, error });
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
      createdAt: record.created_at || record.createdAt,
      updatedAt: record.updated_at || record.updatedAt
    };
  }
}
