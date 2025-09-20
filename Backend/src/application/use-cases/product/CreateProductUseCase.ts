import { inject, injectable } from 'inversify';

import { UUID, Result } from '@/types/common';
import { Product } from '@domain/entities/Product';
import { IProductRepository } from '@domain/repositories/IUserRepository';
import { ITransactionManager, ILogger } from '@application/interfaces/IPasswordService';
import { CreateProductDTO } from '@application/dtos/ProductDTOs';
import { ValidationError, BusinessRuleViolationError } from '@domain/exceptions/DomainException';
import { success, failure } from '@/types/common';

@injectable()
export class CreateProductUseCase {
  constructor(
    @inject('IProductRepository') private readonly productRepository: IProductRepository,
    @inject('ITransactionManager') private readonly transactionManager: ITransactionManager,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async execute(dto: CreateProductDTO): Promise<Result<Product, Error>> {
    try {
      // Validate input
      const validationResult = this.validateInput(dto);
      if (!validationResult.isSuccess) {
        return failure(validationResult.error);
      }

      return await this.transactionManager.executeInTransaction(async () => {
        // Check if SKU already exists
        const existingProduct = await this.productRepository.findBySku(dto.sku);
        if (existingProduct) {
          return failure(new BusinessRuleViolationError(`Product with SKU '${dto.sku}' already exists`));
        }

        // Create product
        const product = Product.create({
          sku: dto.sku,
          name: dto.name,
          description: dto.description,
          categoryId: dto.categoryId,
          uomId: crypto.randomUUID(), // TODO: Get actual UOM ID from unitOfMeasure string
          type: dto.productType,
          costPrice: dto.costPrice || 0,
          sellingPrice: dto.sellingPrice || 0,
          minStockLevel: dto.minStockLevel || 0,
          maxStockLevel: dto.maxStockLevel || 0,
          reorderPoint: dto.reorderPoint || 0,
          leadTimeDays: 0, // Not in DTO
          specifications: dto.metadata || {},
          attachments: [], // Not in DTO
        }, dto.unitOfMeasure);

        // Save to repository
        const savedProduct = await this.productRepository.save(product);

        this.logger.info('Product created successfully', {
          productId: savedProduct.id,
          sku: savedProduct.sku,
          name: savedProduct.name,
          type: savedProduct.type,
        });

        return success(savedProduct);
      });
    } catch (error) {
      this.logger.error('Error creating product', error as Error, { dto });
      return failure(error as Error);
    }
  }

  private validateInput(dto: CreateProductDTO): Result<void, ValidationError> {
    const errors: string[] = [];

    if (!dto.sku || dto.sku.trim().length === 0) {
      errors.push('SKU is required');
    }

    if (!dto.name || dto.name.trim().length === 0) {
      errors.push('Product name is required');
    }

    if (!dto.unitOfMeasure) {
      errors.push('Unit of measure is required');
    }

    if (dto.productType && !['raw_material', 'manufactured', 'finished_good'].includes(dto.productType)) {
      errors.push('Invalid product type');
    }

    if (dto.costPrice !== undefined && dto.costPrice < 0) {
      errors.push('Cost price cannot be negative');
    }

    if (dto.sellingPrice !== undefined && dto.sellingPrice < 0) {
      errors.push('Selling price cannot be negative');
    }

    if (dto.minStockLevel !== undefined && dto.minStockLevel < 0) {
      errors.push('Minimum stock level cannot be negative');
    }

    if (dto.maxStockLevel !== undefined && dto.maxStockLevel < 0) {
      errors.push('Maximum stock level cannot be negative');
    }

    if (dto.minStockLevel !== undefined && dto.maxStockLevel !== undefined && dto.minStockLevel > dto.maxStockLevel) {
      errors.push('Minimum stock level cannot be greater than maximum stock level');
    }

    if (dto.reorderPoint !== undefined && dto.reorderPoint < 0) {
      errors.push('Reorder point cannot be negative');
    }

    if (errors.length > 0) {
      return failure(new ValidationError('Invalid product data', { errors }));
    }

    return success(undefined);
  }
}
