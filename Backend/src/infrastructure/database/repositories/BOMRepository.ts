import { inject, injectable } from 'inversify';
import { Op } from 'sequelize';

import { UUID, PaginatedResult, Pagination } from '@/types/common';
import { BOM } from '@domain/entities/BOM';
import { IBOMRepository, BOMFilters } from '@domain/repositories/IUserRepository';
import { EntityNotFoundError } from '@domain/exceptions/DomainException';
import { DatabaseConnection } from '@infrastructure/database/config/DatabaseConfig';
import { ILogger } from '@application/interfaces/IPasswordService';

@injectable()
export class BOMRepository implements IBOMRepository {
  constructor(
    @inject('DatabaseConnection') private readonly databaseConnection: DatabaseConnection,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async findById(id: UUID): Promise<BOM | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const BOMModel = sequelize.models.BOM as any;

      const bomRecord = await BOMModel.findByPk(id, {
        include: [
          {
            model: sequelize.models.Product,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type'],
          },
          {
            model: sequelize.models.User,
            as: 'creator',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
          {
            model: sequelize.models.User,
            as: 'approver',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
        ],
      });

      if (!bomRecord) {
        return null;
      }

      return this.toDomainEntity(bomRecord.toJSON());
    } catch (error) {
      this.logger.error('Error finding BOM by ID', error as Error, { bomId: id });
      throw error;
    }
  }

  public async findComplete(id: UUID): Promise<BOM | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const BOMModel = sequelize.models.BOM as any;

      const bomRecord = await BOMModel.findByPk(id, {
        include: [
          {
            model: sequelize.models.Product,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type'],
          },
          {
            model: sequelize.models.User,
            as: 'creator',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
          {
            model: sequelize.models.User,
            as: 'approver',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
          {
            model: sequelize.models.BOMComponent,
            as: 'components',
            include: [
              {
                model: sequelize.models.Product,
                as: 'component',
                attributes: ['id', 'sku', 'name', 'type', 'cost_price'],
              },
            ],
            order: [['sequence_number', 'ASC']],
          },
          {
            model: sequelize.models.BOMOperation,
            as: 'operations',
            order: [['sequence_number', 'ASC']],
          },
        ],
      });

      if (!bomRecord) {
        return null;
      }

      return this.toDomainEntity(bomRecord.toJSON());
    } catch (error) {
      this.logger.error('Error finding complete BOM by ID', error as Error, { bomId: id });
      throw error;
    }
  }

  public async findByProductId(productId: UUID): Promise<BOM[]> {
    const result = await this.findWithFilters({ productId });
    return [...result.data];
  }

  public async findActiveByProductId(productId: UUID): Promise<BOM | null> {
    const result = await this.findWithFilters({ productId, isActive: true });
    return result.data.length > 0 ? result.data[0] || null : null;
  }

  public async findWithComponents(bomId: UUID): Promise<BOM | null> {
    return this.findById(bomId);
  }

  public async findWithOperations(bomId: UUID): Promise<BOM | null> {
    return this.findById(bomId);
  }

  public async findDefaultByProductId(productId: UUID): Promise<BOM | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const BOMModel = sequelize.models.BOM as any;

      const bomRecord = await BOMModel.findOne({
        where: {
          product_id: productId,
          is_default: true,
          is_active: true,
        },
        include: [
          {
            model: sequelize.models.Product,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type'],
          },
          {
            model: sequelize.models.User,
            as: 'creator',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
          {
            model: sequelize.models.User,
            as: 'approver',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
          {
            model: sequelize.models.BOMComponent,
            as: 'components',
            include: [
              {
                model: sequelize.models.Product,
                as: 'component',
                attributes: ['id', 'sku', 'name', 'type', 'cost_price'],
              },
            ],
            order: [['sequence_number', 'ASC']],
          },
        ],
      });

      if (!bomRecord) {
        return null;
      }

      return this.toDomainEntity(bomRecord.toJSON());
    } catch (error) {
      this.logger.error('Error finding default BOM by product ID', error as Error, { productId });
      throw error;
    }
  }

  public async findWithFilters(
    filters: BOMFilters,
    pagination?: Pagination
  ): Promise<PaginatedResult<BOM>> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const BOMModel = sequelize.models.BOM as any;

      const whereClause: any = {};

      if (filters.productId) {
        whereClause.product_id = filters.productId;
      }

      if (filters.isActive !== undefined) {
        whereClause.is_active = filters.isActive;
      }

      if (filters.isDefault !== undefined) {
        whereClause.is_default = filters.isDefault;
      }

      if (filters.createdBy) {
        whereClause.created_by = filters.createdBy;
      }

      if (filters.search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${filters.search}%` } },
          { version: { [Op.iLike]: `%${filters.search}%` } },
          { description: { [Op.iLike]: `%${filters.search}%` } },
          { '$product.name$': { [Op.iLike]: `%${filters.search}%` } },
          { '$product.sku$': { [Op.iLike]: `%${filters.search}%` } },
        ];
      }

      const limit = pagination?.limit ?? 20;
      const offset = pagination?.offset ?? 0;

      const { count, rows } = await BOMModel.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: sequelize.models.Product,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type'],
          },
          {
            model: sequelize.models.User,
            as: 'creator',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
          {
            model: sequelize.models.User,
            as: 'approver',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
        ],
        limit,
        offset,
        order: [['created_at', 'DESC']],
        distinct: true,
      });

      const boms = rows.map((record: any) => this.toDomainEntity(record.toJSON()));

      return {
        data: boms,
        total: count,
        page: pagination?.page ?? 1,
        limit,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      this.logger.error('Error finding BOMs with filters', error as Error, { filters });
      throw error;
    }
  }

  public async findAll(pagination?: Pagination): Promise<PaginatedResult<BOM>> {
    return this.findWithFilters({}, pagination);
  }

  public async save(bom: BOM): Promise<BOM> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const BOMModel = sequelize.models.BOM as any;

      const bomData = this.toPersistenceData(bom);

      const [bomRecord] = await BOMModel.upsert(bomData, {
        returning: true,
      });

      // Fetch the complete record with associations
      const completeRecord = await BOMModel.findByPk(bomRecord.id, {
        include: [
          {
            model: sequelize.models.Product,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type'],
          },
          {
            model: sequelize.models.User,
            as: 'creator',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
          {
            model: sequelize.models.User,
            as: 'approver',
            attributes: ['id', 'username', 'first_name', 'last_name'],
          },
        ],
      });

      return this.toDomainEntity(completeRecord.toJSON());
    } catch (error) {
      this.logger.error('Error saving BOM', error as Error, { bomId: bom.id });
      throw error;
    }
  }

  public async delete(id: UUID): Promise<void> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const BOMModel = sequelize.models.BOM as any;

      const deletedCount = await BOMModel.destroy({
        where: { id },
      });

      if (deletedCount === 0) {
        throw new EntityNotFoundError('BOM', id);
      }

      this.logger.info('BOM deleted successfully', { bomId: id });
    } catch (error) {
      this.logger.error('Error deleting BOM', error as Error, { bomId: id });
      throw error;
    }
  }

  private toDomainEntity(data: any): BOM {
    return BOM.fromPersistence({
      id: data.id,
      productId: data.product_id,
      version: data.version,
      name: data.name,
      description: data.description,
      isActive: data.is_active,
      isDefault: data.is_default,
      createdBy: data.created_by,
      approvedBy: data.approved_by,
      approvedAt: data.approved_at,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      components: data.components?.map((comp: any) => ({
        id: comp.id,
        componentId: comp.component_id,
        quantity: parseFloat(comp.quantity),
        unit: comp.unit,
        scrapFactor: parseFloat(comp.scrap_factor),
        sequenceNumber: comp.sequence_number,
        notes: comp.notes,
        component: comp.component ? {
          id: comp.component.id,
          sku: comp.component.sku,
          name: comp.component.name,
          type: comp.component.type,
          costPrice: parseFloat(comp.component.cost_price),
        } : undefined,
      })) || [],
    });
  }

  private toPersistenceData(bom: BOM): any {
    const props = bom.toPersistence();
    
    return {
      id: props.id,
      product_id: props.productId,
      version: props.version,
      name: props.name,
      description: props.description,
      is_active: props.isActive,
      is_default: props.isDefault,
      created_by: props.createdBy,
      approved_by: props.approvedBy,
      approved_at: props.approvedAt,
      created_at: props.createdAt,
      updated_at: props.updatedAt,
    };
  }
}
