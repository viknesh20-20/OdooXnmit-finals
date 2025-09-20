import { inject, injectable } from 'inversify';

import { UUID, Result, success, failure } from '@/types/common';
import { ManufacturingOrder } from '@domain/entities/ManufacturingOrder';
import { IManufacturingOrderRepository, IUserRepository } from '@domain/repositories/IUserRepository';
import { ITransactionManager, ILogger } from '@application/interfaces/IPasswordService';
import { CompleteManufacturingOrderCommandDTO } from '@application/dtos/ManufacturingOrderDTOs';
import { ValidationError, BusinessRuleViolationError, EntityNotFoundError } from '@domain/exceptions/DomainException';

@injectable()
export class CompleteManufacturingOrderUseCase {
  constructor(
    @inject('IManufacturingOrderRepository') private readonly manufacturingOrderRepository: IManufacturingOrderRepository,
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
    @inject('ITransactionManager') private readonly transactionManager: ITransactionManager,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async execute(dto: CompleteManufacturingOrderCommandDTO): Promise<Result<ManufacturingOrder, Error>> {
    try {
      // Validate input
      const validationResult = this.validateInput(dto);
      if (!validationResult.isSuccess) {
        return failure(validationResult.error);
      }

      return await this.transactionManager.executeInTransaction(async () => {
        // Find manufacturing order
        const manufacturingOrder = await this.manufacturingOrderRepository.findById(dto.id);
        if (!manufacturingOrder) {
          return failure(new EntityNotFoundError('ManufacturingOrder', dto.id));
        }

        // Verify user exists
        const user = await this.userRepository.findById(dto.completedBy);
        if (!user) {
          return failure(new EntityNotFoundError('User', dto.completedBy));
        }

        // Check if order can be completed
        if (!manufacturingOrder.canBeCompleted()) {
          return failure(new BusinessRuleViolationError(
            `Manufacturing order cannot be completed. Current status: ${manufacturingOrder.status}`
          ));
        }

        // Complete the manufacturing order
        manufacturingOrder.complete();

        // Update notes if provided
        if (dto.qualityNotes) {
          manufacturingOrder.updateNotes(dto.qualityNotes);
        }

        // Update actual quantity produced if provided
        if (dto.actualQuantityProduced !== undefined) {
          // This would typically involve updating inventory records
          // For now, we'll just log it
          this.logger.info('Actual quantity produced recorded', {
            orderId: dto.id,
            plannedQuantity: manufacturingOrder.quantity,
            actualQuantity: dto.actualQuantityProduced,
          });
        }

        // Save to repository
        const savedOrder = await this.manufacturingOrderRepository.save(manufacturingOrder);

        this.logger.info('Manufacturing order completed successfully', {
          id: savedOrder.id,
          moNumber: savedOrder.moNumber,
          completedBy: dto.completedBy,
          actualQuantityProduced: dto.actualQuantityProduced,
        });

        return success(savedOrder);
      });
    } catch (error) {
      this.logger.error('Error completing manufacturing order', error as Error, { dto });
      return failure(error as Error);
    }
  }

  private validateInput(dto: CompleteManufacturingOrderCommandDTO): Result<void, ValidationError> {
    const errors: string[] = [];

    if (!dto.id) {
      errors.push('Order ID is required');
    }

    if (!dto.completedBy) {
      errors.push('Completed by user ID is required');
    }

    if (dto.actualQuantityProduced !== undefined && dto.actualQuantityProduced < 0) {
      errors.push('Actual quantity produced cannot be negative');
    }

    if (errors.length > 0) {
      return failure(new ValidationError('Invalid complete manufacturing order data', { errors }));
    }

    return success(undefined);
  }
}
