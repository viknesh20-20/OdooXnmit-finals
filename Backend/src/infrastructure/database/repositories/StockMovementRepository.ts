import { inject, injectable } from 'inversify';
import { Op } from 'sequelize';

import { UUID } from '@/types/common';
import { IStockMovementRepository, StockMovement } from '@domain/repositories/IUserRepository';
import { DatabaseConnection } from '@infrastructure/database/config/DatabaseConfig';
import { ILogger } from '@application/interfaces/IPasswordService';

@injectable()
export class StockMovementRepository implements IStockMovementRepository {
  constructor(
    @inject('DatabaseConnection') private readonly databaseConnection: DatabaseConnection,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async findRecent(options?: { limit?: number; warehouseId?: UUID }): Promise<StockMovement[]> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const StockLedgerModel = sequelize.models.StockLedger as any;
      const ProductModel = sequelize.models.Product as any;

      const whereClause: any = {};
      if (options?.warehouseId) {
        whereClause.warehouse_id = options.warehouseId;
      }

      const records = await StockLedgerModel.findAll({
        where: whereClause,
        include: [
          {
            model: ProductModel,
            as: 'product',
            attributes: ['name'],
            required: false
          }
        ],
        limit: options?.limit || 10,
        order: [['created_at', 'DESC']]
      });

      return records.map((record: any) => this.mapToStockMovement(record));
    } catch (error) {
      this.logger.error('Error finding recent stock movements', error as Error);
      throw error;
    }
  }

  public async findByProductId(productId: UUID, warehouseId?: UUID): Promise<StockMovement[]> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const StockLedgerModel = sequelize.models.StockLedger as any;
      const ProductModel = sequelize.models.Product as any;

      const whereClause: any = { product_id: productId };
      if (warehouseId) {
        whereClause.warehouse_id = warehouseId;
      }

      const records = await StockLedgerModel.findAll({
        where: whereClause,
        include: [
          {
            model: ProductModel,
            as: 'product',
            attributes: ['name'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return records.map((record: any) => this.mapToStockMovement(record));
    } catch (error) {
      this.logger.error('Error finding stock movements by product ID', error as Error);
      throw error;
    }
  }

  public async findByReference(referenceId: UUID, referenceType?: string): Promise<StockMovement[]> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const StockLedgerModel = sequelize.models.StockLedger as any;
      const ProductModel = sequelize.models.Product as any;

      const whereClause: any = { reference_id: referenceId };
      if (referenceType) {
        whereClause.reference_type = referenceType;
      }

      const records = await StockLedgerModel.findAll({
        where: whereClause,
        include: [
          {
            model: ProductModel,
            as: 'product',
            attributes: ['name'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return records.map((record: any) => this.mapToStockMovement(record));
    } catch (error) {
      this.logger.error('Error finding stock movements by reference', error as Error);
      throw error;
    }
  }

  public async findByDateRange(startDate: Date, endDate: Date, warehouseId?: UUID): Promise<StockMovement[]> {
    try {
      const sequelize = this.databaseConnection.getSequelize();
      const StockLedgerModel = sequelize.models.StockLedger as any;
      const ProductModel = sequelize.models.Product as any;

      const whereClause: any = {
        created_at: {
          [Op.between]: [startDate, endDate]
        }
      };
      if (warehouseId) {
        whereClause.warehouse_id = warehouseId;
      }

      const records = await StockLedgerModel.findAll({
        where: whereClause,
        include: [
          {
            model: ProductModel,
            as: 'product',
            attributes: ['name'],
            required: false
          }
        ],
        order: [['created_at', 'DESC']]
      });

      return records.map((record: any) => this.mapToStockMovement(record));
    } catch (error) {
      this.logger.error('Error finding stock movements by date range', error as Error);
      throw error;
    }
  }

  private mapToStockMovement(record: any): StockMovement {
    // Map transaction types to simple in/out
    const transactionType = record.transaction_type;
    let type: 'in' | 'out' = 'out';
    
    if (transactionType === 'receipt' || transactionType === 'adjustment_in' || transactionType === 'production_receipt') {
      type = 'in';
    } else if (transactionType === 'issue' || transactionType === 'adjustment_out' || transactionType === 'production_issue') {
      type = 'out';
    }

    return {
      id: record.id,
      productId: record.product_id,
      productName: record.product?.name || 'Unknown Product',
      type,
      quantity: Math.abs(record.quantity || 0),
      reference: record.reference_id,
      referenceType: record.reference_type,
      notes: record.notes,
      createdAt: record.created_at || record.createdAt
    };
  }
}
