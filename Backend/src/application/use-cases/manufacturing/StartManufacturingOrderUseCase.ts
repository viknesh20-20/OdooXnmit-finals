import { inject, injectable } from 'inversify';

import { UUID, Result, success, failure } from '@/types/common';
import { ManufacturingOrder } from '@domain/entities/ManufacturingOrder';
import { IManufacturingOrderRepository, IUserRepository } from '@domain/repositories/IUserRepository';
import { ITransactionManager, ILogger } from '@application/interfaces/IPasswordService';
import { StartManufacturingOrderCommandDTO } from '@application/dtos/ManufacturingOrderDTOs';
import { ValidationError, BusinessRuleViolationError, EntityNotFoundError } from '@domain/exceptions/DomainException';

@injectable()
export class StartManufacturingOrderUseCase {
  constructor(
    @inject('IManufacturingOrderRepository') private readonly manufacturingOrderRepository: IManufacturingOrderRepository,
    @inject('IUserRepository') private readonly userRepository: IUserRepository,
    @inject('ITransactionManager') private readonly transactionManager: ITransactionManager,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async execute(dto: StartManufacturingOrderCommandDTO): Promise<Result<ManufacturingOrder, Error>> {
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
        const user = await this.userRepository.findById(dto.startedBy);
        if (!user) {
          return failure(new EntityNotFoundError('User', dto.startedBy));
        }

        // Check if order can be started
        if (!manufacturingOrder.canBeStarted()) {
          return failure(new BusinessRuleViolationError(
            `Manufacturing order cannot be started. Current status: ${manufacturingOrder.status}`
          ));
        }

        // Start the manufacturing order
        manufacturingOrder.start();

        // Save to repository
        const savedOrder = await this.manufacturingOrderRepository.save(manufacturingOrder);

        this.logger.info('Manufacturing order started successfully', {
          orderId: savedOrder.id,
          moNumber: savedOrder.moNumber,
          startedBy: dto.startedBy,
        });

        return success(savedOrder);
      });
    } catch (error) {
      this.logger.error('Error starting manufacturing order', error as Error, { dto });
      return failure(error as Error);
    }
  }

  private validateInput(dto: StartManufacturingOrderCommandDTO): Result<void, ValidationError> {
    const errors: string[] = [];

    if (!dto.id) {
      errors.push('Order ID is required');
    }

    if (!dto.startedBy) {
      errors.push('Started by user ID is required');
    }

    if (errors.length > 0) {
      return failure(new ValidationError('Invalid start manufacturing order data', { errors }));
    }

    return success(undefined);
  }
}
