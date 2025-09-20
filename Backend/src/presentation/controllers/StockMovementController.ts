import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { StockMovementModel } from '@infrastructure/database/models/StockMovementModel';
import { ProductModel } from '@infrastructure/database/models/ProductModel';
import { Logger } from '@infrastructure/logging/Logger';

export class StockMovementController {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('StockMovementController');
  }

  // GET /api/v1/stock-movements
  public async getStockMovements(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        product_id,
        type,
        reference_type,
        from_location,
        to_location,
        processed_by,
        start_date,
        end_date,
        sortBy = 'timestamp',
        sortOrder = 'desc',
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // Apply filters
      if (search) {
        whereClause[Op.or] = [
          { reference: { [Op.iLike]: `%${search}%` } },
          { notes: { [Op.iLike]: `%${search}%` } },
          { batch_number: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (product_id) {
        whereClause.product_id = product_id;
      }

      if (type) {
        whereClause.type = type;
      }

      if (reference_type) {
        whereClause.reference_type = reference_type;
      }

      if (from_location) {
        whereClause.from_location = { [Op.iLike]: `%${from_location}%` };
      }

      if (to_location) {
        whereClause.to_location = { [Op.iLike]: `%${to_location}%` };
      }

      if (processed_by) {
        whereClause.processed_by = processed_by;
      }

      if (start_date || end_date) {
        whereClause.timestamp = {};
        if (start_date) {
          whereClause.timestamp[Op.gte] = new Date(start_date as string);
        }
        if (end_date) {
          whereClause.timestamp[Op.lte] = new Date(end_date as string);
        }
      }

      const { count, rows } = await StockMovementModel.findAndCountAll({
        where: whereClause,
        include: [
          {
            model: ProductModel,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type'],
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
          stockMovements: rows.map(movement => this.formatStockMovementResponse(movement)),
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
      this.logger.error('Error fetching stock movements', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // GET /api/v1/stock-movements/:id
  public async getStockMovement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid stock movement ID',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;

      const stockMovement = await StockMovementModel.findByPk(id, {
        include: [
          {
            model: ProductModel,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type', 'cost_price'],
          },
        ],
      });

      if (!stockMovement) {
        res.status(404).json({
          success: false,
          error: {
            code: 'STOCK_MOVEMENT_NOT_FOUND',
            message: 'Stock movement not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          stockMovement: this.formatStockMovementResponse(stockMovement),
        },
      });
    } catch (error) {
      this.logger.error('Error fetching stock movement', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // POST /api/v1/stock-movements
  public async createStockMovement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid stock movement data',
            details: errors.array(),
          },
        });
        return;
      }

      const movementData = req.body;

      // Verify product exists
      const product = await ProductModel.findByPk(movementData.product_id);
      if (!product) {
        res.status(400).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        });
        return;
      }

      // Calculate running balance
      const lastMovement = await StockMovementModel.findOne({
        where: { product_id: movementData.product_id },
        order: [['timestamp', 'DESC']],
      });

      const previousBalance = lastMovement ? lastMovement.running_balance : 0;
      const quantityChange = movementData.type === 'in' ? movementData.quantity : -movementData.quantity;
      movementData.running_balance = previousBalance + quantityChange;

      // Calculate total value if unit cost is provided
      if (movementData.unit_cost) {
        movementData.total_value = movementData.quantity * movementData.unit_cost;
      }

      const stockMovement = await StockMovementModel.create(movementData);

      res.status(201).json({
        success: true,
        data: {
          stockMovement: this.formatStockMovementResponse(stockMovement),
        },
        message: 'Stock movement created successfully',
      });
    } catch (error) {
      this.logger.error('Error creating stock movement', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // PUT /api/v1/stock-movements/:id
  public async updateStockMovement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid stock movement data',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const stockMovement = await StockMovementModel.findByPk(id);

      if (!stockMovement) {
        res.status(404).json({
          success: false,
          error: {
            code: 'STOCK_MOVEMENT_NOT_FOUND',
            message: 'Stock movement not found',
          },
        });
        return;
      }

      // Recalculate total value if unit cost or quantity is updated
      if (updateData.unit_cost !== undefined || updateData.quantity !== undefined) {
        const unitCost = updateData.unit_cost !== undefined ? updateData.unit_cost : stockMovement.unit_cost;
        const quantity = updateData.quantity !== undefined ? updateData.quantity : stockMovement.quantity;
        if (unitCost) {
          updateData.total_value = quantity * unitCost;
        }
      }

      await stockMovement.update(updateData);

      res.status(200).json({
        success: true,
        data: {
          stockMovement: this.formatStockMovementResponse(stockMovement),
        },
        message: 'Stock movement updated successfully',
      });
    } catch (error) {
      this.logger.error('Error updating stock movement', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // DELETE /api/v1/stock-movements/:id
  public async deleteStockMovement(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid stock movement ID',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;

      const stockMovement = await StockMovementModel.findByPk(id);

      if (!stockMovement) {
        res.status(404).json({
          success: false,
          error: {
            code: 'STOCK_MOVEMENT_NOT_FOUND',
            message: 'Stock movement not found',
          },
        });
        return;
      }

      await stockMovement.destroy();

      res.status(200).json({
        success: true,
        message: 'Stock movement deleted successfully',
      });
    } catch (error) {
      this.logger.error('Error deleting stock movement', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // GET /api/v1/stock-movements/product/:productId/balance
  public async getProductBalance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid product ID',
            details: errors.array(),
          },
        });
        return;
      }

      const { productId } = req.params;

      // Get the latest stock movement for the product
      const latestMovement = await StockMovementModel.findOne({
        where: { product_id: productId },
        order: [['timestamp', 'DESC']],
        include: [
          {
            model: ProductModel,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type'],
          },
        ],
      });

      const currentBalance = latestMovement ? latestMovement.running_balance : 0;

      res.status(200).json({
        success: true,
        data: {
          productId,
          currentBalance,
          lastMovement: latestMovement ? this.formatStockMovementResponse(latestMovement) : null,
        },
      });
    } catch (error) {
      this.logger.error('Error fetching product balance', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  private formatStockMovementResponse(movement: StockMovementModel): any {
    return {
      id: movement.id,
      productId: movement.product_id,
      type: movement.type,
      quantity: movement.quantity,
      unit: movement.unit,
      unitCost: movement.unit_cost,
      totalValue: movement.total_value,
      reference: movement.reference,
      referenceType: movement.reference_type,
      fromLocation: movement.from_location,
      toLocation: movement.to_location,
      timestamp: movement.timestamp,
      processedBy: movement.processed_by,
      notes: movement.notes,
      batchNumber: movement.batch_number,
      expiryDate: movement.expiry_date,
      runningBalance: movement.running_balance,
      metadata: movement.metadata,
      product: movement.product,
      createdAt: movement.created_at,
      updatedAt: movement.updated_at,
    };
  }
}
