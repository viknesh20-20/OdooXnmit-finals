import { inject, injectable } from 'inversify';
import { Op } from 'sequelize';

import { UUID, PaginatedResult, Pagination } from '@/types/common';
import { ManufacturingOrder } from '@domain/entities/ManufacturingOrder';
import { IManufacturingOrderRepository, ManufacturingOrderFilters } from '@domain/repositories/IUserRepository';
import { EntityNotFoundError } from '@domain/exceptions/DomainException';
import { DatabaseConnection } from '@infrastructure/database/config/DatabaseConfig';
import { ManufacturingOrderMapper } from '@application/mappers/UserMapper';
import { ILogger } from '@application/interfaces/IPasswordService';

@injectable()
export class ManufacturingOrderRepository implements IManufacturingOrderRepository {
  constructor(
    @inject('DatabaseConnection') private readonly databaseConnection: DatabaseConnection,
    @inject('ManufacturingOrderMapper') private readonly mapper: ManufacturingOrderMapper,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async findById(id: UUID): Promise<ManufacturingOrder | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ManufacturingOrderModel = sequelize.models.ManufacturingOrder as any;

      const orderRecord = await ManufacturingOrderModel.findByPk(id, {
        include: [
          {
            model: sequelize.models.Product,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type'],
          },
          {
            model: sequelize.models.BOM,
            as: 'bom',
            attributes: ['id', 'version', 'name'],
          },
          {
            model: sequelize.models.User,
            as: 'creator',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
          {
            model: sequelize.models.User,
            as: 'assignee',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
        ],
      });

      if (!orderRecord) {
        return null;
      }

      return ManufacturingOrderMapper.toDomainEntity(orderRecord.toJSON());
    } catch (error) {
      this.logger.error('Error finding manufacturing order by ID', error as Error, { orderId: id });
      throw error;
    }
  }

  public async findByMoNumber(moNumber: string): Promise<ManufacturingOrder | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ManufacturingOrderModel = sequelize.models.ManufacturingOrder as any;

      const orderRecord = await ManufacturingOrderModel.findOne({
        where: { mo_number: moNumber },
        include: [
          {
            model: sequelize.models.Product,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type'],
          },
          {
            model: sequelize.models.BOM,
            as: 'bom',
            attributes: ['id', 'version', 'name'],
          },
          {
            model: sequelize.models.User,
            as: 'creator',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
          {
            model: sequelize.models.User,
            as: 'assignee',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
        ],
      });

      if (!orderRecord) {
        return null;
      }

      return ManufacturingOrderMapper.toDomainEntity(orderRecord.toJSON());
    } catch (error) {
      this.logger.error('Error finding manufacturing order by MO number', error as Error, { moNumber });
      throw error;
    }
  }

  public async findWithFilters(
    filters: ManufacturingOrderFilters,
    pagination?: Pagination
  ): Promise<PaginatedResult<ManufacturingOrder>> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ManufacturingOrderModel = sequelize.models.ManufacturingOrder as any;

      const whereClause: any = {};

      if (filters.status) {
        whereClause.status = filters.status;
      }

      if (filters.productId) {
        whereClause.product_id = filters.productId;
      }

      if (filters.createdBy) {
        whereClause.created_by = filters.createdBy;
      }

      if (filters.assignedTo) {
        whereClause.assigned_to = filters.assignedTo;
      }

      if (filters.priority) {
        whereClause.priority = filters.priority;
      }

      if (filters.startDate && filters.endDate) {
        whereClause.created_at = {
          [Op.between]: [filters.startDate, filters.endDate],
        };
      } else if (filters.startDate) {
        whereClause.created_at = {
          [Op.gte]: filters.startDate,
        };
      } else if (filters.endDate) {
        whereClause.created_at = {
          [Op.lte]: filters.endDate,
        };
      }

      if (filters.search) {
        whereClause[Op.or] = [
          { mo_number: { [Op.iLike]: `%${filters.search}%` } },
          { notes: { [Op.iLike]: `%${filters.search}%` } },
          { '$product.name$': { [Op.iLike]: `%${filters.search}%` } },
          { '$product.sku$': { [Op.iLike]: `%${filters.search}%` } },
        ];
      }

      const limit = pagination?.limit ?? 20;
      const offset = pagination?.offset ?? 0;

      // Determine sort order
      let orderClause: any[] = [['created_at', 'DESC']];
      if (filters.sortBy) {
        const sortDirection = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
        switch (filters.sortBy) {
          case 'moNumber':
            orderClause = [['mo_number', sortDirection]];
            break;
          case 'productName':
            orderClause = [[{ model: sequelize.models.Product, as: 'product' }, 'name', sortDirection]];
            break;
          case 'status':
            orderClause = [['status', sortDirection]];
            break;
          case 'priority':
            orderClause = [['priority', sortDirection]];
            break;
          case 'plannedStartDate':
            orderClause = [['planned_start_date', sortDirection]];
            break;
          case 'createdAt':
            orderClause = [['created_at', sortDirection]];
            break;
        }
      }

      const { count, rows } = await ManufacturingOrderModel.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: sequelize.models.Product,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type'],
          },
          {
            model: sequelize.models.BOM,
            as: 'bom',
            attributes: ['id', 'version', 'name'],
          },
          {
            model: sequelize.models.User,
            as: 'creator',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
          {
            model: sequelize.models.User,
            as: 'assignee',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
        ],
        limit,
        offset,
        order: orderClause,
        distinct: true,
      });

      const orders = rows.map((record: any) => ManufacturingOrderMapper.toDomainEntity(record.toJSON()));

      return {
        data: orders,
        total: count,
        page: pagination?.page ?? 1,
        limit,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      this.logger.error('Error finding manufacturing orders with filters', error as Error, { filters });
      throw error;
    }
  }

  public async findAll(pagination?: Pagination): Promise<PaginatedResult<ManufacturingOrder>> {
    return this.findWithFilters({}, pagination);
  }

  public async findByProductId(productId: UUID, pagination?: Pagination): Promise<PaginatedResult<ManufacturingOrder>> {
    return this.findWithFilters({ productId }, pagination);
  }

  public async findByStatus(status: string, pagination?: Pagination): Promise<PaginatedResult<ManufacturingOrder>> {
    return this.findWithFilters({ status }, pagination);
  }

  public async findOverdue(): Promise<ManufacturingOrder[]> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ManufacturingOrderModel = sequelize.models.ManufacturingOrder as any;

      const orderRecords = await ManufacturingOrderModel.findAll({
        where: {
          status: {
            [Op.in]: ['confirmed', 'in_progress'],
          },
          planned_end_date: {
            [Op.lt]: new Date(),
          },
        },
        include: [
          {
            model: sequelize.models.Product,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type'],
          },
          {
            model: sequelize.models.BOM,
            as: 'bom',
            attributes: ['id', 'version', 'name'],
          },
          {
            model: sequelize.models.User,
            as: 'creator',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
          {
            model: sequelize.models.User,
            as: 'assignee',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
        ],
        order: [['planned_end_date', 'ASC']],
      });

      return orderRecords.map((record: any) => ManufacturingOrderMapper.toDomainEntity(record.toJSON()));
    } catch (error) {
      this.logger.error('Error finding overdue manufacturing orders', error as Error);
      throw error;
    }
  }

  public async generateMoNumber(): Promise<string> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ManufacturingOrderModel = sequelize.models.ManufacturingOrder as any;

      // Get current year and month
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const prefix = `MO${year}${month}`;

      // Find the highest number for this month
      const lastOrder = await ManufacturingOrderModel.findOne({
        where: {
          mo_number: {
            [Op.like]: `${prefix}%`,
          },
        },
        order: [['mo_number', 'DESC']],
      });

      let nextNumber = 1;
      if (lastOrder) {
        const lastNumber = parseInt(lastOrder.mo_number.substring(prefix.length), 10);
        nextNumber = lastNumber + 1;
      }

      return `${prefix}${String(nextNumber).padStart(4, '0')}`;
    } catch (error) {
      this.logger.error('Error generating MO number', error as Error);
      throw error;
    }
  }

  public async save(order: ManufacturingOrder): Promise<ManufacturingOrder> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ManufacturingOrderModel = sequelize.models.ManufacturingOrder as any;

      const orderData = this.mapper.toPersistenceData(order);

      const [orderRecord] = await ManufacturingOrderModel.upsert(orderData, {
        returning: true,
      });

      // Fetch the complete record with associations
      const completeRecord = await ManufacturingOrderModel.findByPk(orderRecord.id, {
        include: [
          {
            model: sequelize.models.Product,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type'],
          },
          {
            model: sequelize.models.BOM,
            as: 'bom',
            attributes: ['id', 'version', 'name'],
          },
          {
            model: sequelize.models.User,
            as: 'creator',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
          {
            model: sequelize.models.User,
            as: 'assignee',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
        ],
      });

      return ManufacturingOrderMapper.toDomainEntity(completeRecord.toJSON());
    } catch (error) {
      this.logger.error('Error saving manufacturing order', error as Error, { orderId: order.id });
      throw error;
    }
  }

  public async delete(id: UUID): Promise<void> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ManufacturingOrderModel = sequelize.models.ManufacturingOrder as any;

      const deletedCount = await ManufacturingOrderModel.destroy({
        where: { id },
      });

      if (deletedCount === 0) {
        throw new EntityNotFoundError('ManufacturingOrder', id);
      }

      this.logger.info('Manufacturing order deleted successfully', { orderId: id });
    } catch (error) {
      this.logger.error('Error deleting manufacturing order', error as Error, { orderId: id });
      throw error;
    }
  }

  public async findOverdueOrders(): Promise<ManufacturingOrder[]> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ManufacturingOrderModel = sequelize.models.ManufacturingOrder as any;

      const records = await ManufacturingOrderModel.findAll({
        where: {
          status: ['confirmed', 'in_progress'],
          planned_end_date: {
            [Op.lt]: new Date(),
          },
        },
      });

      return records.map((record: any) => ManufacturingOrderMapper.toDomainEntity(record.toJSON()));
    } catch (error) {
      this.logger.error('Error finding overdue manufacturing orders', error as Error);
      throw error;
    }
  }

  public async existsByMoNumber(moNumber: string): Promise<boolean> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ManufacturingOrderModel = sequelize.models.ManufacturingOrder as any;

      const count = await ManufacturingOrderModel.count({
        where: { mo_number: moNumber },
      });

      return count > 0;
    } catch (error) {
      this.logger.error('Error checking if MO number exists', error as Error, { moNumber });
      throw error;
    }
  }
}
