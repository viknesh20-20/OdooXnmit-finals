import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { Op } from 'sequelize';
import { resolve } from '@infrastructure/di/Container';
import { ILogger } from '@application/interfaces/IPasswordService';
import { ProductModel } from '@infrastructure/database/models/ProductModel';
// Note: ProductCategoryModel and UnitOfMeasureModel will be added when supporting models are implemented

export class ProductController {
  private logger: ILogger;

  constructor() {
    this.logger = resolve<ILogger>('ILogger');
  }

  // GET /api/v1/products
  public async getProducts(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        category,
        type,
        status = 'active',
        sortBy = 'name',
        sortOrder = 'asc',
      } = req.query;

      const offset = (Number(page) - 1) * Number(limit);
      const whereClause: any = {};

      // Apply filters
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { sku: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
        ];
      }

      if (category) {
        whereClause.category_id = category;
      }

      if (type) {
        whereClause.type = type;
      }

      if (status === 'active') {
        whereClause.is_active = true;
      } else if (status === 'inactive') {
        whereClause.is_active = false;
      }

      const { count, rows } = await ProductModel.findAndCountAll({
        where: whereClause,
        // TODO: Add includes when supporting models are implemented
        // include: [
        //   {
        //     model: ProductCategoryModel,
        //     as: 'category',
        //     attributes: ['id', 'name'],
        //   },
        //   {
        //     model: UnitOfMeasureModel,
        //     as: 'unitOfMeasure',
        //     attributes: ['id', 'name', 'symbol'],
        //   },
        // ],
        limit: Number(limit),
        offset,
        order: [[sortBy as string, sortOrder as string]],
      });

      const totalPages = Math.ceil(count / Number(limit));

      res.status(200).json({
        success: true,
        data: {
          products: rows.map(product => this.formatProductResponse(product)),
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
      this.logger.error(`Error fetching products: ${(error as Error).message}`);
      next(error);
    }
  }

  // GET /api/v1/products/:id
  public async getProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const { id } = req.params;

      const product = await ProductModel.findByPk(id, {
        // TODO: Add includes when supporting models are implemented
        // include: [
        //   {
        //     model: ProductCategoryModel,
        //     as: 'category',
        //     attributes: ['id', 'name'],
        //   },
        //   {
        //     model: UnitOfMeasureModel,
        //     as: 'unitOfMeasure',
        //     attributes: ['id', 'name', 'symbol'],
        //   },
        // ],
      });

      if (!product) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: {
          product: this.formatProductResponse(product),
        },
      });
    } catch (error) {
      this.logger.error(`Error fetching product: ${(error as Error).message}`);
      next(error);
    }
  }

  // POST /api/v1/products
  public async createProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid product data',
            details: errors.array(),
          },
        });
        return;
      }

      const productData = req.body;

      // Check if SKU already exists
      const existingProduct = await ProductModel.findOne({
        where: { sku: productData.sku },
      });

      if (existingProduct) {
        res.status(409).json({
          success: false,
          error: {
            code: 'SKU_ALREADY_EXISTS',
            message: 'A product with this SKU already exists',
          },
        });
        return;
      }

      const product = await ProductModel.create(productData);

      const createdProduct = await ProductModel.findByPk(product.id, {
        // TODO: Add includes when supporting models are implemented
        // include: [
        //   {
        //     model: ProductCategoryModel,
        //     as: 'category',
        //     attributes: ['id', 'name'],
        //   },
        //   {
        //     model: UnitOfMeasureModel,
        //     as: 'unitOfMeasure',
        //     attributes: ['id', 'name', 'symbol'],
        //   },
        // ],
      });

      this.logger.info('Product created successfully', { productId: product.id, sku: product.sku });

      res.status(201).json({
        success: true,
        data: {
          product: this.formatProductResponse(createdProduct!),
        },
        message: 'Product created successfully',
      });
    } catch (error) {
      this.logger.error(`Error creating product: ${(error as Error).message}`);
      next(error);
    }
  }

  // PUT /api/v1/products/:id
  public async updateProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid product data',
            details: errors.array(),
          },
        });
        return;
      }

      const { id } = req.params;
      const updateData = req.body;

      const product = await ProductModel.findByPk(id);

      if (!product) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        });
        return;
      }

      // Check if SKU already exists (excluding current product)
      if (updateData.sku && updateData.sku !== product.sku) {
        const existingProduct = await ProductModel.findOne({
          where: { sku: updateData.sku },
        });

        if (existingProduct) {
          res.status(409).json({
            success: false,
            error: {
              code: 'SKU_ALREADY_EXISTS',
              message: 'A product with this SKU already exists',
            },
          });
          return;
        }
      }

      await product.update(updateData);

      const updatedProduct = await ProductModel.findByPk(id, {
        // TODO: Add includes when supporting models are implemented
        // include: [
        //   {
        //     model: ProductCategoryModel,
        //     as: 'category',
        //     attributes: ['id', 'name'],
        //   },
        //   {
        //     model: UnitOfMeasureModel,
        //     as: 'unitOfMeasure',
        //     attributes: ['id', 'name', 'symbol'],
        //   },
        // ],
      });

      this.logger.info('Product updated successfully', { productId: id });

      res.status(200).json({
        success: true,
        data: {
          product: this.formatProductResponse(updatedProduct!),
        },
        message: 'Product updated successfully',
      });
    } catch (error) {
      this.logger.error(`Error updating product: ${(error as Error).message}`);
      next(error);
    }
  }

  // DELETE /api/v1/products/:id
  public async deleteProduct(req: Request, res: Response, next: NextFunction): Promise<void> {
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

      const { id } = req.params;

      const product = await ProductModel.findByPk(id);

      if (!product) {
        res.status(404).json({
          success: false,
          error: {
            code: 'PRODUCT_NOT_FOUND',
            message: 'Product not found',
          },
        });
        return;
      }

      // Soft delete by setting is_active to false
      await product.update({ is_active: false });

      this.logger.info('Product deleted successfully', { productId: id });

      res.status(200).json({
        success: true,
        message: 'Product deleted successfully',
      });
    } catch (error) {
      this.logger.error(`Error deleting product: ${(error as Error).message}`);
      next(error);
    }
  }

  private formatProductResponse(product: any): any {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description,
      categoryId: product.category_id,
      uomId: product.uom_id,
      // TODO: Add category and unitOfMeasure objects when supporting models are implemented
      // category: product.category ? {
      //   id: product.category.id,
      //   name: product.category.name,
      // } : null,
      // unitOfMeasure: product.unitOfMeasure ? {
      //   id: product.unitOfMeasure.id,
      //   name: product.unitOfMeasure.name,
      //   symbol: product.unitOfMeasure.symbol,
      // } : null,
      type: product.type,
      costPrice: parseFloat(product.cost_price || '0'),
      sellingPrice: parseFloat(product.selling_price || '0'),
      minStockLevel: parseFloat(product.min_stock_level || '0'),
      maxStockLevel: parseFloat(product.max_stock_level || '0'),
      reorderPoint: parseFloat(product.reorder_point || '0'),
      leadTimeDays: product.lead_time_days,
      isActive: product.is_active,
      specifications: product.specifications,
      attachments: product.attachments,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };
  }
}
