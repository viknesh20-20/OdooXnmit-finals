import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { BOMModel, BOMComponentModel, BOMOperationModel } from '@infrastructure/database/models/BOMModel';
import { ProductModel } from '@infrastructure/database/models/ProductModel';
import { Logger } from '@infrastructure/logging/Logger';
import { AuthenticatedRequest } from '@presentation/controllers/AuthController';

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
  public async createBOM(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

      const bomData = {
        ...req.body,
        created_by: req.user?.userId || req.body.created_by, // Use authenticated user ID
      };

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

  // POST /api/v1/boms/:id/duplicate
  public async duplicateBOM(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
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

      const bomId = req.params.id;

      // Find the original BOM with its components and operations
      const originalBom = await BOMModel.findByPk(bomId, {
        include: [
          {
            model: ProductModel,
            as: 'product',
          },
          {
            model: BOMComponentModel,
            as: 'components',
          },
          {
            model: BOMOperationModel,
            as: 'operations',
          },
        ],
      });

      if (!originalBom) {
        res.status(404).json({
          success: false,
          error: {
            code: 'BOM_NOT_FOUND',
            message: 'BOM not found',
          },
        });
        return;
      }

      // Create the new BOM with duplicated data
      // Generate a short unique version (max 20 chars)
      const timestamp = Date.now().toString().slice(-6); // Last 6 digits of timestamp
      const baseVersion = originalBom.version.length > 8 ? originalBom.version.slice(0, 8) : originalBom.version;
      const newVersion = `${baseVersion}-c${timestamp}`;

      this.logger.info('Duplicating BOM', {
        originalVersion: originalBom.version,
        baseVersion,
        timestamp,
        newVersion: newVersion.slice(0, 20),
        newVersionLength: newVersion.slice(0, 20).length
      });

      const duplicatedBOMData = {
        product_id: originalBom.product_id,
        version: newVersion.slice(0, 20), // Ensure it fits within 20 character limit
        name: `${originalBom.name} (Copy)`,
        description: originalBom.description ? `Copy of: ${originalBom.description}` : 'Duplicated BOM',
        is_active: false, // New BOMs should start as inactive
        is_default: false, // Copies shouldn't be default
        created_by: req.user?.userId || originalBom.created_by, // Use authenticated user or original creator
        approved_by: undefined,
        approved_at: undefined,
        metadata: originalBom.metadata,
      };

      const duplicatedBom = await BOMModel.create(duplicatedBOMData);

      // Duplicate components
      if (originalBom.components && originalBom.components.length > 0) {
        const componentPromises = originalBom.components.map(async (component: any) => {
          return BOMComponentModel.create({
            bom_id: duplicatedBom.id,
            component_id: component.component_id,
            quantity: component.quantity,
            unit: component.unit,
            scrap_factor: component.scrap_factor || 0,
            sequence_number: component.sequence_number || 0,
            notes: component.notes,
          });
        });
        await Promise.all(componentPromises);
      }

      // Duplicate operations
      if (originalBom.operations && originalBom.operations.length > 0) {
        const operationPromises = originalBom.operations.map(async (operation: any) => {
          return BOMOperationModel.create({
            bom_id: duplicatedBom.id,
            operation: operation.operation,
            operation_type: operation.operation_type,
            work_center_id: operation.work_center_id,
            duration: operation.duration || 0,
            setup_time: operation.setup_time || 0,
            teardown_time: operation.teardown_time || 0,
            cost_per_hour: operation.cost_per_hour || 0,
            total_cost: operation.total_cost || 0,
            sequence: operation.sequence || 0,
            description: operation.description,
            instructions: operation.instructions,
            quality_requirements: operation.quality_requirements || [],
            tools_required: operation.tools_required || [],
            skills_required: operation.skills_required || [],
            metadata: operation.metadata || {},
          });
        });
        await Promise.all(operationPromises);
      }

      // Fetch the complete duplicated BOM with its relations
      const completeBom = await BOMModel.findByPk(duplicatedBom.id, {
        include: [
          {
            model: ProductModel,
            as: 'product',
          },
          {
            model: BOMComponentModel,
            as: 'components',
          },
          {
            model: BOMOperationModel,
            as: 'operations',
          },
        ],
      });

      res.status(201).json({
        success: true,
        data: {
          bom: this.formatBOMResponse(completeBom!),
        },
        message: 'BOM duplicated successfully',
      });
    } catch (error) {
      this.logger.error('Error duplicating BOM', { error: (error as Error).message, stack: (error as Error).stack });
      next(error);
    }
  }

  private formatBOMResponse(bom: BOMModel): any {
    // Extract components and operations from metadata
    const metadata = bom.metadata || {};
    const components = metadata.components || [];
    const operations = metadata.operations || [];

    return {
      id: bom.id,
      productId: bom.product_id,
      productName: bom.name, // Use BOM name as productName for frontend compatibility
      version: bom.version,
      name: bom.name,
      description: bom.description,
      notes: bom.description, // Map description to notes for frontend compatibility
      isActive: bom.is_active,
      isDefault: bom.is_default,
      createdBy: bom.created_by,
      approvedBy: bom.approved_by,
      approvedAt: bom.approved_at,
      metadata: bom.metadata,
      product: bom.product,
      components: components,
      operations: operations,
      reference: metadata.reference,
      totalCost: metadata.totalCost,
      estimatedTime: metadata.estimatedTime,
      validFrom: metadata.validFrom,
      validTo: metadata.validTo,
      createdAt: bom.created_at,
      updatedAt: bom.updated_at,
    };
  }
}
