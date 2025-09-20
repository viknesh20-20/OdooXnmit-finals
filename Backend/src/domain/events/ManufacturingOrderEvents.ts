import { UUID, Timestamp, DomainEvent } from '@/types/common';

export interface ManufacturingOrderCreatedEvent extends DomainEvent {
  readonly eventType: 'ManufacturingOrderCreated';
  readonly eventData: {
    readonly moNumber: string;
    readonly productId: UUID;
    readonly bomId: UUID;
    readonly quantity: number;
    readonly quantityUnit: string;
    readonly priority: string;
    readonly createdBy: UUID;
    readonly assignedTo?: UUID;
    readonly plannedStartDate?: Timestamp;
    readonly plannedEndDate?: Timestamp;
  };
}

export interface ManufacturingOrderConfirmedEvent extends DomainEvent {
  readonly eventType: 'ManufacturingOrderConfirmed';
  readonly eventData: {
    readonly moNumber: string;
    readonly productId: UUID;
    readonly quantity: number;
    readonly quantityUnit: string;
    readonly confirmedBy: UUID;
    readonly confirmedAt: Timestamp;
    readonly materialReservations: Array<{
      readonly componentId: UUID;
      readonly reservedQuantity: number;
      readonly warehouseId: UUID;
    }>;
  };
}

export interface ManufacturingOrderStartedEvent extends DomainEvent {
  readonly eventType: 'ManufacturingOrderStarted';
  readonly eventData: {
    readonly moNumber: string;
    readonly productId: UUID;
    readonly startedBy: UUID;
    readonly startedAt: Timestamp;
    readonly workOrdersCreated: UUID[];
  };
}

export interface ManufacturingOrderCompletedEvent extends DomainEvent {
  readonly eventType: 'ManufacturingOrderCompleted';
  readonly eventData: {
    readonly moNumber: string;
    readonly productId: UUID;
    readonly quantity: number;
    readonly quantityUnit: string;
    readonly completedBy: UUID;
    readonly completedAt: Timestamp;
    readonly actualDuration: number;
    readonly plannedDuration?: number;
    readonly stockProduced: {
      readonly warehouseId: UUID;
      readonly locationId?: UUID;
    };
  };
}

export interface ManufacturingOrderCancelledEvent extends DomainEvent {
  readonly eventType: 'ManufacturingOrderCancelled';
  readonly eventData: {
    readonly moNumber: string;
    readonly productId: UUID;
    readonly cancelledBy: UUID;
    readonly cancelledAt: Timestamp;
    readonly reason?: string;
    readonly materialReservationsReleased: UUID[];
  };
}

export interface WorkOrderCreatedEvent extends DomainEvent {
  readonly eventType: 'WorkOrderCreated';
  readonly eventData: {
    readonly woNumber: string;
    readonly manufacturingOrderId: UUID;
    readonly workCenterId: UUID;
    readonly operationName: string;
    readonly sequenceNumber: number;
    readonly plannedDuration: number;
    readonly assignedTo?: UUID;
  };
}

export interface WorkOrderStartedEvent extends DomainEvent {
  readonly eventType: 'WorkOrderStarted';
  readonly eventData: {
    readonly woNumber: string;
    readonly manufacturingOrderId: UUID;
    readonly workCenterId: UUID;
    readonly startedBy: UUID;
    readonly startedAt: Timestamp;
  };
}

export interface WorkOrderCompletedEvent extends DomainEvent {
  readonly eventType: 'WorkOrderCompleted';
  readonly eventData: {
    readonly woNumber: string;
    readonly manufacturingOrderId: UUID;
    readonly workCenterId: UUID;
    readonly completedBy: UUID;
    readonly completedAt: Timestamp;
    readonly actualDuration: number;
    readonly plannedDuration: number;
    readonly qualityCheckRequired: boolean;
  };
}

export interface StockTransactionEvent extends DomainEvent {
  readonly eventType: 'StockTransaction';
  readonly eventData: {
    readonly productId: UUID;
    readonly warehouseId: UUID;
    readonly locationId?: UUID;
    readonly transactionType: 'in' | 'out' | 'transfer' | 'adjustment';
    readonly quantity: number;
    readonly quantityUnit: string;
    readonly unitCost: number;
    readonly totalValue: number;
    readonly balanceQuantity: number;
    readonly balanceValue: number;
    readonly referenceType?: string;
    readonly referenceId?: UUID;
    readonly batchNumber?: string;
    readonly expiryDate?: Date;
    readonly createdBy: UUID;
  };
}

export interface MaterialReservedEvent extends DomainEvent {
  readonly eventType: 'MaterialReserved';
  readonly eventData: {
    readonly manufacturingOrderId: UUID;
    readonly productId: UUID;
    readonly warehouseId: UUID;
    readonly locationId?: UUID;
    readonly reservedQuantity: number;
    readonly quantityUnit: string;
    readonly unitCost: number;
    readonly batchNumber?: string;
    readonly expiryDate?: Date;
    readonly reservedBy: UUID;
  };
}

export interface MaterialConsumedEvent extends DomainEvent {
  readonly eventType: 'MaterialConsumed';
  readonly eventData: {
    readonly manufacturingOrderId: UUID;
    readonly workOrderId?: UUID;
    readonly productId: UUID;
    readonly warehouseId: UUID;
    readonly consumedQuantity: number;
    readonly quantityUnit: string;
    readonly unitCost: number;
    readonly batchNumber?: string;
    readonly consumedBy: UUID;
  };
}

export interface UserRegisteredEvent extends DomainEvent {
  readonly eventType: 'UserRegistered';
  readonly eventData: {
    readonly username: string;
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly roleId?: UUID;
    readonly emailVerificationToken: string;
  };
}

export interface UserEmailVerifiedEvent extends DomainEvent {
  readonly eventType: 'UserEmailVerified';
  readonly eventData: {
    readonly username: string;
    readonly email: string;
    readonly verifiedAt: Timestamp;
  };
}

export interface UserPasswordResetRequestedEvent extends DomainEvent {
  readonly eventType: 'UserPasswordResetRequested';
  readonly eventData: {
    readonly username: string;
    readonly email: string;
    readonly resetToken: string;
    readonly expiresAt: Timestamp;
  };
}

export interface UserPasswordChangedEvent extends DomainEvent {
  readonly eventType: 'UserPasswordChanged';
  readonly eventData: {
    readonly username: string;
    readonly email: string;
    readonly changedAt: Timestamp;
    readonly changedBy: UUID;
  };
}

export interface QualityControlCompletedEvent extends DomainEvent {
  readonly eventType: 'QualityControlCompleted';
  readonly eventData: {
    readonly workOrderId?: UUID;
    readonly manufacturingOrderId?: UUID;
    readonly productId: UUID;
    readonly batchNumber?: string;
    readonly inspectorId: UUID;
    readonly status: 'passed' | 'failed' | 'rework';
    readonly quantityInspected: number;
    readonly quantityPassed: number;
    readonly quantityFailed: number;
    readonly defectNotes?: string;
    readonly correctiveAction?: string;
    readonly inspectionDate: Timestamp;
  };
}

// Event factory functions
export const createManufacturingOrderCreatedEvent = (
  aggregateId: UUID,
  eventData: ManufacturingOrderCreatedEvent['eventData']
): ManufacturingOrderCreatedEvent => ({
  eventId: crypto.randomUUID(),
  eventType: 'ManufacturingOrderCreated',
  aggregateId,
  aggregateType: 'ManufacturingOrder',
  eventData,
  occurredAt: new Date(),
  version: 1,
});

export const createManufacturingOrderConfirmedEvent = (
  aggregateId: UUID,
  eventData: ManufacturingOrderConfirmedEvent['eventData']
): ManufacturingOrderConfirmedEvent => ({
  eventId: crypto.randomUUID(),
  eventType: 'ManufacturingOrderConfirmed',
  aggregateId,
  aggregateType: 'ManufacturingOrder',
  eventData,
  occurredAt: new Date(),
  version: 1,
});

export const createManufacturingOrderStartedEvent = (
  aggregateId: UUID,
  eventData: ManufacturingOrderStartedEvent['eventData']
): ManufacturingOrderStartedEvent => ({
  eventId: crypto.randomUUID(),
  eventType: 'ManufacturingOrderStarted',
  aggregateId,
  aggregateType: 'ManufacturingOrder',
  eventData,
  occurredAt: new Date(),
  version: 1,
});

export const createManufacturingOrderCompletedEvent = (
  aggregateId: UUID,
  eventData: ManufacturingOrderCompletedEvent['eventData']
): ManufacturingOrderCompletedEvent => ({
  eventId: crypto.randomUUID(),
  eventType: 'ManufacturingOrderCompleted',
  aggregateId,
  aggregateType: 'ManufacturingOrder',
  eventData,
  occurredAt: new Date(),
  version: 1,
});

export const createStockTransactionEvent = (
  aggregateId: UUID,
  eventData: StockTransactionEvent['eventData']
): StockTransactionEvent => ({
  eventId: crypto.randomUUID(),
  eventType: 'StockTransaction',
  aggregateId,
  aggregateType: 'StockLedger',
  eventData,
  occurredAt: new Date(),
  version: 1,
});
