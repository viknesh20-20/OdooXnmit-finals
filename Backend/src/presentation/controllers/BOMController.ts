import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { BOMModel } from '@infrastructure/database/models/BOMModel';
import { ProductModel } from '@infrastructure/database/models/ProductModel';
import { Logger } from '@infrastructure/logging/Logger';

export class BOMController {
  private logger: Logger;

  constructor() {
    this.logger = new Logger('BOMController');
  }

  // GET /api/v1/boms
  public async getBOMs(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        is_active,
        is_default,
        created_by,
        approved_by,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // Apply filters
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { version: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (product_id) {
        whereClause.product_id = product_id;
      }

      if (is_active !== undefined) {
        whereClause.is_active = is_active === 'true';
      }

      if (is_default !== undefined) {
        whereClause.is_default = is_default === 'true';
      }

      if (created_by) {
        whereClause.created_by = created_by;
      }

      if (approved_by) {
        whereClause.approved_by = approved_by;
      }

      const { count, rows } = await BOMModel.findAndCountAll({
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
          boms: rows.map(bom => this.formatBOMResponse(bom)),
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
      const err = error as Error;
      this.logger.error('Error fetching BOMs', { error: err.message, stack: err.stack });
      next(error);
    }
  }

  // GET /api/v1/boms/:id
  public async getBOM(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid BOM ID',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;

      const bom = await BOMModel.findByPk(id, {
        include: [
          {
            model: ProductModel,
            as: 'product',
            attributes: ['id', 'sku', 'name', 'type', 'cost_price'],
          },
        ],
      });

      if (!bom) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BOM_NOT_FOUND',
            message: 'Bill of Materials not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          bom: this.formatBOMResponse(bom),
        },
      });
    } catch (error) {
      const err = error as Error;
      this.logger.error('Error fetching BOM', { error: err.message, stack: err.stack });
      next(error);
    }
  }

  // POST /api/v1/boms
  public async createBOM(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid BOM data',
            details: errors.array(),
          },
        });
        return;
      }

      const bomData = req.body;

      // Verify product exists
      const product = await ProductModel.findByPk(bomData.product_id);
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

      // If this is set as default, unset other default BOMs for the same product
      if (bomData.is_default) {
        await BOMModel.update(
          { is_default: false },
          { where: { product_id: bomData.product_id, is_default: true } }
        );
      }

      const bom = await BOMModel.create(bomData);

      res.status(201).json({
        success: true,
        data: {
          bom: this.formatBOMResponse(bom),
        },
        message: 'BOM created successfully',
      });
    } catch (error) {
      this.logger.error('Error creating BOM', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // PUT /api/v1/boms/:id
  public async updateBOM(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid BOM data',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const bom = await BOMModel.findByPk(id);

      if (!bom) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BOM_NOT_FOUND',
            message: 'Bill of Materials not found',
          },
        });
        return;
      }

      // If this is being set as default, unset other default BOMs for the same product
      if (updateData.is_default && !bom.is_default) {
        await BOMModel.update(
          { is_default: false },
          { where: { product_id: bom.product_id, is_default: true, id: { [Op.ne]: id } } }
        );
      }

      await bom.update(updateData);

      res.status(200).json({
        success: true,
        data: {
          bom: this.formatBOMResponse(bom),
        },
        message: 'BOM updated successfully',
      });
    } catch (error) {
      this.logger.error('Error updating BOM', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // DELETE /api/v1/boms/:id
  public async deleteBOM(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid BOM ID',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;

      const bom = await BOMModel.findByPk(id);

      if (!bom) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BOM_NOT_FOUND',
            message: 'Bill of Materials not found',
          },
        });
        return;
      }

      // Check if BOM is being used in manufacturing orders
      // This would require checking ManufacturingOrderModel
      // For now, we'll allow deletion but in production you'd want to check dependencies

      await bom.destroy();

      res.status(200).json({
        success: true,
        message: 'BOM deleted successfully',
      });
    } catch (error) {
      this.logger.error('Error deleting BOM', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  // PUT /api/v1/boms/:id/approve
  public async approveBOM(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid approval data',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;
      const { approved_by } = req.body;

      const bom = await BOMModel.findByPk(id);

      if (!bom) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BOM_NOT_FOUND',
            message: 'Bill of Materials not found',
          },
        });
        return;
      }

      await bom.update({
        approved_by,
        approved_at: new Date(),
        is_active: true,
      });

      res.status(200).json({
        success: true,
        data: {
          bom: this.formatBOMResponse(bom),
        },
        message: 'BOM approved successfully',
      });
    } catch (error) {
      this.logger.error('Error approving BOM', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  private formatBOMResponse(bom: BOMModel): any {
    return {
      id: bom.id,
      productId: bom.product_id,
      version: bom.version,
      name: bom.name,
      description: bom.description,
      isActive: bom.is_active,
      isDefault: bom.is_default,
      createdBy: bom.created_by,
      approvedBy: bom.approved_by,
      approvedAt: bom.approved_at,
      metadata: bom.metadata,
      product: bom.product,
      components: bom.components,
      operations: bom.operations,
      createdAt: bom.created_at,
      updatedAt: bom.updated_at,
    };
  }
}
