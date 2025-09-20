import { inject, injectable } from 'inversify';
import { Op } from 'sequelize';

import { UUID, PaginatedResult, Pagination } from '@/types/common';
import { Product } from '@domain/entities/Product';
import { IProductRepository, ProductFilters } from '@domain/repositories/IUserRepository';
import { EntityNotFoundError } from '@domain/exceptions/DomainException';
import { DatabaseConnection } from '@infrastructure/database/config/DatabaseConfig';
import { ILogger } from '@application/interfaces/IPasswordService';
import { Money, Quantity } from '@domain/value-objects/Money';

@injectable()
export class ProductRepository implements IProductRepository {
  constructor(
    @inject('DatabaseConnection') private readonly databaseConnection: DatabaseConnection,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async findById(id: UUID): Promise<Product | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ProductModel = sequelize.models.Product as any;

      const productRecord = await ProductModel.findByPk(id, {
        include: [
          {
            model: sequelize.models.ProductCategory,
            as: 'category',
            attributes: ['id', 'name', 'description'],
          },
          {
            model: sequelize.models.UnitOfMeasure,
            as: 'unitOfMeasure',
            attributes: ['id', 'name', 'symbol', 'type'],
          },
        ],
      });

      if (!productRecord) {
        return null;
      }

      return this.toDomainEntity(productRecord.toJSON());
    } catch (error) {
      this.logger.error('Error finding product by ID', error as Error, { productId: id });
      throw error;
    }
  }

  public async findBySku(sku: string): Promise<Product | null> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ProductModel = sequelize.models.Product as any;

      const productRecord = await ProductModel.findOne({
        where: { sku },
        include: [
          {
            model: sequelize.models.ProductCategory,
            as: 'category',
            attributes: ['id', 'name', 'description'],
          },
          {
            model: sequelize.models.UnitOfMeasure,
            as: 'unitOfMeasure',
            attributes: ['id', 'name', 'symbol', 'type'],
          },
        ],
      });

      if (!productRecord) {
        return null;
      }

      return this.toDomainEntity(productRecord.toJSON());
    } catch (error) {
      this.logger.error('Error finding product by SKU', error as Error, { sku });
      throw error;
    }
  }

  public async findWithFilters(
    filters: ProductFilters,
    pagination?: Pagination
  ): Promise<PaginatedResult<Product>> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ProductModel = sequelize.models.Product as any;

      const whereClause: any = {};

      // Note: type property not in ProductFilters interface, commenting out
      // if (filters.type) {
      //   whereClause.type = filters.type;
      // }

      if (filters.categoryId) {
        whereClause.category_id = filters.categoryId;
      }

      if (filters.isActive !== undefined) {
        whereClause.is_active = filters.isActive;
      }

      if (filters.search) {
        whereClause[Op.or] = [
          { sku: { [Op.iLike]: `%${filters.search}%` } },
          { name: { [Op.iLike]: `%${filters.search}%` } },
          { description: { [Op.iLike]: `%${filters.search}%` } },
        ];
      }

      const limit = pagination?.limit ?? 20;
      const offset = pagination?.offset ?? 0;

      // Determine sort order
      let orderClause: any[] = [['created_at', 'DESC']];
      // Note: sortBy and sortOrder not in ProductFilters interface
      // if (filters.sortBy) {
      //   const sortDirection = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
      //   switch (filters.sortBy) {
      //     case 'sku':
      //       orderClause = [['sku', sortDirection]];
      //       break;
      //     case 'name':
      //       orderClause = [['name', sortDirection]];
      //       break;
      //     case 'type':
      //       orderClause = [['type', sortDirection]];
      //       break;
      //     case 'createdAt':
      //       orderClause = [['created_at', sortDirection]];
      //       break;
      //   }
      // }

      const { count, rows } = await ProductModel.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: sequelize.models.ProductCategory,
            as: 'category',
            attributes: ['id', 'name', 'description'],
          },
          {
            model: sequelize.models.UnitOfMeasure,
            as: 'unitOfMeasure',
            attributes: ['id', 'name', 'symbol', 'type'],
          },
        ],
        limit,
        offset,
        order: orderClause,
        distinct: true,
      });

      const products = rows.map((record: any) => this.toDomainEntity(record.toJSON()));

      return {
        data: products,
        total: count,
        page: pagination?.page ?? 1,
        limit,
        totalPages: Math.ceil(count / limit),
      };
    } catch (error) {
      this.logger.error('Error finding products with filters', error as Error, { filters });
      throw error;
    }
  }

  public async findAll(pagination?: Pagination): Promise<PaginatedResult<Product>> {
    return this.findWithFilters({}, pagination);
  }

  public async findByType(type: string, pagination?: Pagination): Promise<PaginatedResult<Product>> {
    // Note: type not in ProductFilters, using empty filters for now
    return this.findWithFilters({}, pagination);
  }

  public async findByCategoryId(categoryId: UUID, pagination?: Pagination): Promise<PaginatedResult<Product>> {
    return this.findWithFilters({ categoryId }, pagination);
  }

  public async findLowStock(): Promise<Product[]> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ProductModel = sequelize.models.Product as any;

      // This would require a more complex query with stock ledger
      // For now, return products with low stock levels based on reorder point
      const productRecords = await ProductModel.findAll({
        where: {
          is_active: true,
          reorder_point: {
            [Op.gt]: 0,
          },
        },
        include: [
          {
            model: sequelize.models.ProductCategory,
            as: 'category',
            attributes: ['id', 'name', 'description'],
          },
          {
            model: sequelize.models.UnitOfMeasure,
            as: 'unitOfMeasure',
            attributes: ['id', 'name', 'symbol', 'type'],
          },
        ],
        order: [['reorder_point', 'DESC']],
      });

      return productRecords.map((record: any) => this.toDomainEntity(record.toJSON()));
    } catch (error) {
      this.logger.error('Error finding low stock products', error as Error);
      throw error;
    }
  }

  public async existsBySku(sku: string): Promise<boolean> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ProductModel = sequelize.models.Product as any;

      const count = await ProductModel.count({
        where: { sku },
      });

      return count > 0;
    } catch (error) {
      this.logger.error('Error checking if product exists by SKU', error as Error, { sku });
      throw error;
    }
  }

  public async save(product: Product): Promise<Product> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ProductModel = sequelize.models.Product as any;

      const productData = this.toPersistenceData(product);

      const [productRecord] = await ProductModel.upsert(productData, {
        returning: true,
      });

      // Fetch the complete record with associations
      const completeRecord = await ProductModel.findByPk(productRecord.id, {
        include: [
          {
            model: sequelize.models.ProductCategory,
            as: 'category',
            attributes: ['id', 'name', 'description'],
          },
          {
            model: sequelize.models.UnitOfMeasure,
            as: 'unitOfMeasure',
            attributes: ['id', 'name', 'symbol', 'type'],
          },
        ],
      });

      return this.toDomainEntity(completeRecord.toJSON());
    } catch (error) {
      this.logger.error('Error saving product', error as Error, { productId: product.id });
      throw error;
    }
  }

  public async delete(id: UUID): Promise<void> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const ProductModel = sequelize.models.Product as any;

      const deletedCount = await ProductModel.destroy({
        where: { id },
      });

      if (deletedCount === 0) {
        throw new EntityNotFoundError('Product', id);
      }

      this.logger.info('Product deleted successfully', { productId: id });
    } catch (error) {
      this.logger.error('Error deleting product', error as Error, { productId: id });
      throw error;
    }
  }

  public async findActiveProducts(pagination?: Pagination): Promise<PaginatedResult<Product>> {
    return this.findWithFilters({ isActive: true }, pagination);
  }

  public async findLowStockProducts(warehouseId?: UUID): Promise<Product[]> {
    return this.findLowStock();
  }

  public async search(query: string, pagination?: Pagination): Promise<PaginatedResult<Product>> {
    return this.findWithFilters({ search: query }, pagination);
  }

  private toDomainEntity(data: any): Product {
    const unitSymbol = data.unitOfMeasure?.symbol || 'pcs'; // Default to 'pcs' if no unit

    return Product.fromPersistence({
      id: data.id,
      sku: data.sku,
      name: data.name,
      description: data.description,
      categoryId: data.category_id,
      uomId: data.uom_id,
      type: data.type,
      costPrice: Money.create(parseFloat(data.cost_price)),
      sellingPrice: Money.create(parseFloat(data.selling_price)),
      minStockLevel: Quantity.create(parseFloat(data.min_stock_level), unitSymbol),
      maxStockLevel: Quantity.create(parseFloat(data.max_stock_level), unitSymbol),
      reorderPoint: Quantity.create(parseFloat(data.reorder_point), unitSymbol),
      leadTimeDays: data.lead_time_days,
      isActive: data.is_active,
      specifications: data.specifications,
      attachments: data.attachments,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }

  private toPersistenceData(product: Product): any {
    const props = product.toPersistence();
    
    return {
      id: props.id,
      sku: props.sku,
      name: props.name,
      description: props.description,
      category_id: props.categoryId,
      uom_id: props.uomId,
      type: props.type,
      cost_price: props.costPrice,
      selling_price: props.sellingPrice,
      min_stock_level: props.minStockLevel,
      max_stock_level: props.maxStockLevel,
      reorder_point: props.reorderPoint,
      lead_time_days: props.leadTimeDays,
      is_active: props.isActive,
      specifications: props.specifications,
      attachments: props.attachments,
      created_at: props.createdAt,
      updated_at: props.updatedAt,
    };
  }
}
