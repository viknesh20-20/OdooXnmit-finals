import { inject, injectable } from 'inversify';

import { UUID, Result, success, failure } from '@/types/common';
import { ManufacturingOrder } from '@domain/entities/ManufacturingOrder';
import { IManufacturingOrderRepository, IUserRepository } from '@domain/repositories/IUserRepository';
import { ITransactionManager, ILogger } from '@application/interfaces/IPasswordService';
import { CancelManufacturingOrderRequestDTO } from '@application/dtos/ManufacturingOrderDTOs';
import { ValidationError, BusinessRuleViolationError, EntityNotFoundError } from '@domain/exceptions/DomainException';

@injectable()
export class CancelManufacturingOrderUseCase {
  constructor(
    @inject('IManufacturingOrderRepository') private readonly manufacturingOrderRepository: IManufacturingOrderRepository,
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
    @inject('ITransactionManager') private readonly transactionManager: ITransactionManager,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async execute(dto: CancelManufacturingOrderRequestDTO): Promise<Result<ManufacturingOrder, Error>> {
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

        // Check if order can be cancelled
        if (!manufacturingOrder.canBeCancelled()) {
          return failure(new BusinessRuleViolationError(
            `Manufacturing order cannot be cancelled. Current status: ${manufacturingOrder.status}`
          ));
        }

        // Cancel the manufacturing order
        const cancelledOrder = manufacturingOrder.cancel();

        // Update reason if provided
        if (dto.reason) {
          manufacturingOrder.updateNotes(dto.reason);
        }

        // Save to repository
        const savedOrder = await this.manufacturingOrderRepository.save(manufacturingOrder);

        this.logger.info('Manufacturing order cancelled successfully', {
          orderId: savedOrder.id,
          moNumber: savedOrder.moNumber,
          reason: dto.reason,
        });

        return success(savedOrder);
      });
    } catch (error) {
      this.logger.error('Error cancelling manufacturing order', error as Error, { dto });
      return failure(error as Error);
    }
  }

  private validateInput(dto: CancelManufacturingOrderRequestDTO): Result<void, ValidationError> {
    const errors: string[] = [];

    if (!dto.id) {
      errors.push('Order ID is required');
    }

    if (!dto.reason || dto.reason.trim().length === 0) {
      errors.push('Cancellation reason is required');
    }

    if (errors.length > 0) {
      return failure(new ValidationError('Invalid cancel manufacturing order data', { errors }));
    }

    return success(undefined);
  }
}
