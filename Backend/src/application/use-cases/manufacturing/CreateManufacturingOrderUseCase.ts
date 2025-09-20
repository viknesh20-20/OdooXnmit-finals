import { inject, injectable } from 'inversify';

import { Result, success, failure, UUID } from '@/types/common';
import { ManufacturingOrder } from '@domain/entities/ManufacturingOrder';
import { IManufacturingOrderRepository, IProductRepository, IBOMRepository, IStockLedgerRepository, IMaterialReservationRepository } from '@domain/repositories/IUserRepository';
import { ManufacturingOrderDomainService } from '@domain/services/ManufacturingOrderDomainService';
import { EntityNotFoundError, ValidationError, BusinessRuleViolationError } from '@domain/exceptions/DomainException';
import { CreateManufacturingOrderCommandDTO, ManufacturingOrderResponseDTO } from '@application/dtos/ManufacturingOrderDTOs';
import { IEventPublisher } from '@application/interfaces/IEventPublisher';
import { ITransactionManager } from '@application/interfaces/ITransactionManager';
import { ManufacturingOrderMapper } from '@application/mappers/ManufacturingOrderMapper';
import { createManufacturingOrderCreatedEvent } from '@domain/events/ManufacturingOrderEvents';
import { Quantity } from '@domain/value-objects/Money';

export interface ICreateManufacturingOrderUseCase {
  execute(command: CreateManufacturingOrderCommandDTO): Promise<Result<ManufacturingOrderResponseDTO>>;
}

@injectable()
export class CreateManufacturingOrderUseCase implements ICreateManufacturingOrderUseCase {
  constructor(
    @inject('IManufacturingOrderRepository') private readonly manufacturingOrderRepository: IManufacturingOrderRepository,
    @inject('IProductRepository') private readonly productRepository: IProductRepository,
    @inject('IBOMRepository') private readonly bomRepository: IBOMRepository,
    @inject('ManufacturingOrderDomainService') private readonly domainService: ManufacturingOrderDomainService,
    @inject('IEventPublisher') private readonly eventPublisher: IEventPublisher,
    @inject('ITransactionManager') private readonly transactionManager: ITransactionManager,
    @inject('ManufacturingOrderMapper') private readonly mapper: ManufacturingOrderMapper
  ) {}

  public async execute(command: CreateManufacturingOrderCommandDTO): Promise<Result<ManufacturingOrderResponseDTO>> {
    return this.transactionManager.executeInTransaction(async () => {
      try {
        // Validate input
        const validationResult = this.validateCommand(command);
        if (!validationResult.success) {
          return validationResult;
        }

        // Get product
        const product = await this.productRepository.findById(command.productId);
        if (!product) {
          return failure(new EntityNotFoundError('Product', command.productId).toDomainError());
        }

        // Get BOM
        const bom = await this.bomRepository.findComplete(command.bomId);
        if (!bom) {
          return failure(new EntityNotFoundError('BOM', command.bomId).toDomainError());
        }

        // Validate BOM belongs to product
        if (bom.productId !== product.id) {
          return failure(new ValidationError('BOM does not belong to the specified product').toDomainError());
        }

        // Get BOM components for validation
        const bomComponents = bom.components.map(comp => ({
          componentId: comp.componentId,
          quantity: comp.quantity,
          scrapFactor: comp.scrapFactor,
        }));

        // Validate manufacturing order creation using domain service
        try {
          this.domainService.validateManufacturingOrderCreation(
            product,
            Quantity.create(command.quantity, product.unitSymbol),
            bomComponents
          );
        } catch (error) {
          if (error instanceof BusinessRuleViolationError) {
            return failure(error.toDomainError());
          }
          throw error;
        }

        // Generate MO number
        const moNumber = await this.manufacturingOrderRepository.generateMoNumber();

        // Create manufacturing order entity
        const manufacturingOrder = ManufacturingOrder.create(
          {
            productId: command.productId,
            bomId: command.bomId,
            quantity: command.quantity,
            quantityUnit: product.unitSymbol,
            priority: command.priority,
            plannedStartDate: command.plannedStartDate,
            plannedEndDate: command.plannedEndDate,
            assignedTo: command.assignedTo,
            notes: command.notes,
            metadata: command.metadata,
          },
          moNumber,
          command.createdBy
        );

        // Save manufacturing order
        const savedOrder = await this.manufacturingOrderRepository.save(manufacturingOrder);

        // Publish domain event
        const event = createManufacturingOrderCreatedEvent(savedOrder.id, {
          moNumber: savedOrder.moNumber,
          productId: savedOrder.productId,
          bomId: savedOrder.bomId,
          quantity: savedOrder.quantity.value,
          quantityUnit: savedOrder.quantity.unit,
          priority: savedOrder.priority,
          createdBy: savedOrder.createdBy,
          assignedTo: savedOrder.assignedTo,
          plannedStartDate: savedOrder.plannedStartDate,
          plannedEndDate: savedOrder.plannedEndDate,
        });

        await this.eventPublisher.publish(event);

        // Map to response DTO
        const response = ManufacturingOrderMapper.toResponseDTO(savedOrder);

        return success(response);
      } catch (error) {
        if (error instanceof Error) {
          return failure({
            code: 'CREATE_MANUFACTURING_ORDER_ERROR',
            message: error.message,
            details: { originalError: error.name },
          });
        }
        return failure({
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while creating manufacturing order',
        });
      }
    });
  }

  private validateCommand(command: CreateManufacturingOrderCommandDTO): Result<void> {
    const errors: string[] = [];

    if (!command.productId) {
      errors.push('Product ID is required');
    }

    if (!command.bomId) {
      errors.push('BOM ID is required');
    }

    if (!command.quantity || command.quantity <= 0) {
      errors.push('Quantity must be greater than zero');
    }

    if (command.plannedStartDate && command.plannedEndDate) {
      if (command.plannedStartDate >= command.plannedEndDate) {
        errors.push('Planned start date must be before planned end date');
      }
    }

    if (command.notes && command.notes.length > 1000) {
      errors.push('Notes cannot exceed 1000 characters');
    }

    if (!command.createdBy) {
      errors.push('Created by user ID is required');
    }

    if (errors.length > 0) {
      return failure(new ValidationError(errors.join(', ')).toDomainError());
    }

    return success(undefined);
  }
}

@injectable()
export class ConfirmManufacturingOrderUseCase {
  constructor(
    @inject('IManufacturingOrderRepository') private readonly manufacturingOrderRepository: IManufacturingOrderRepository,
    @inject('IBOMRepository') private readonly bomRepository: IBOMRepository,
    @inject('IStockLedgerRepository') private readonly stockLedgerRepository: IStockLedgerRepository,
    @inject('IMaterialReservationRepository') private readonly materialReservationRepository: IMaterialReservationRepository,
    @inject('ManufacturingOrderDomainService') private readonly domainService: ManufacturingOrderDomainService,
    @inject('IEventPublisher') private readonly eventPublisher: IEventPublisher,
    @inject('ITransactionManager') private readonly transactionManager: ITransactionManager,
    @inject('ManufacturingOrderMapper') private readonly mapper: ManufacturingOrderMapper
  ) {}

  public async execute(orderId: UUID, confirmedBy: UUID): Promise<Result<ManufacturingOrderResponseDTO>> {
    return this.transactionManager.executeInTransaction(async () => {
      try {
        // Get manufacturing order
        const manufacturingOrder = await this.manufacturingOrderRepository.findById(orderId);
        if (!manufacturingOrder) {
          return failure(new EntityNotFoundError('ManufacturingOrder', orderId).toDomainError());
        }

        // Get BOM with components
        const bom = await this.bomRepository.findComplete(manufacturingOrder.bomId);
        if (!bom) {
          return failure(new EntityNotFoundError('BOM', manufacturingOrder.bomId).toDomainError());
        }

        // Calculate material requirements
        const bomComponents = bom.components.map(comp => ({
          componentId: comp.componentId,
          quantity: comp.quantity,
          scrapFactor: comp.scrapFactor,
        }));

        const materialRequirements = this.domainService.calculateMaterialRequirements(
          manufacturingOrder.quantity,
          bomComponents
        );

        // Check stock availability for each component
        const stockAvailability = await Promise.all(
          materialRequirements.map(async (req) => {
            const currentStock = await this.stockLedgerRepository.getCurrentStock(req.componentId);
            const reservedStock = await this.materialReservationRepository.getTotalReservedQuantity(req.componentId);
            
            return {
              productId: req.componentId,
              availableQuantity: Quantity.create(currentStock, req.requiredQuantity.unit),
              reservedQuantity: Quantity.create(reservedStock, req.requiredQuantity.unit),
            };
          })
        );

        // Validate material availability
        const validatedRequirements = this.domainService.validateMaterialAvailability(
          materialRequirements,
          stockAvailability
        );

        // Validate confirmation using domain service
        try {
          this.domainService.validateManufacturingOrderConfirmation(manufacturingOrder, validatedRequirements);
        } catch (error) {
          if (error instanceof BusinessRuleViolationError) {
            return failure(error.toDomainError());
          }
          throw error;
        }

        // Confirm the manufacturing order
        const confirmedOrder = manufacturingOrder.confirm();
        const savedOrder = await this.manufacturingOrderRepository.save(confirmedOrder);

        // Create material reservations
        const reservations = await this.createMaterialReservations(
          savedOrder.id,
          validatedRequirements,
          confirmedBy
        );

        // Publish domain event
        const event = createManufacturingOrderCreatedEvent(savedOrder.id, {
          moNumber: savedOrder.moNumber,
          productId: savedOrder.productId,
          bomId: savedOrder.bomId,
          quantity: savedOrder.quantity.value,
          quantityUnit: savedOrder.quantity.unit,
          priority: savedOrder.priority,
          createdBy: savedOrder.createdBy,
        });

        await this.eventPublisher.publish(event);

        // Map to response DTO
        const response = ManufacturingOrderMapper.toResponseDTO(savedOrder);

        return success(response);
      } catch (error) {
        if (error instanceof Error) {
          return failure({
            code: 'CONFIRM_MANUFACTURING_ORDER_ERROR',
            message: error.message,
            details: { originalError: error.name },
          });
        }
        return failure({
          code: 'UNKNOWN_ERROR',
          message: 'An unexpected error occurred while confirming manufacturing order',
        });
      }
    });
  }

  private async createMaterialReservations(
    manufacturingOrderId: UUID,
    requirements: Array<{ componentId: UUID; requiredQuantity: { value: number; unit: string } }>,
    reservedBy: UUID
  ): Promise<Array<{ productId: UUID; reservedQuantity: number; warehouseId: UUID }>> {
    // Implementation would create material reservations
    // This is a simplified version - actual implementation would handle warehouse selection,
    // FIFO/LIFO logic, batch tracking, etc.
    return [];
  }
}
