import { DomainError } from '@/types/common';

export abstract class DomainException extends Error {
  public abstract readonly code: string;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = this.constructor.name;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  public toDomainError(): DomainError {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }
}

export class EntityNotFoundError extends DomainException {
  public readonly code = 'ENTITY_NOT_FOUND';

  constructor(entityType: string, id: string, details?: Record<string, unknown>) {
    super(`${entityType} with id ${id} not found`, details);
  }
}

export class ValidationError extends DomainException {
  public readonly code = 'VALIDATION_ERROR';

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class BusinessRuleViolationError extends DomainException {
  public readonly code = 'BUSINESS_RULE_VIOLATION';

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class ConcurrencyError extends DomainException {
  public readonly code = 'CONCURRENCY_ERROR';

  constructor(message: string = 'Concurrent modification detected', details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class InsufficientStockError extends DomainException {
  public readonly code = 'INSUFFICIENT_STOCK';

  constructor(productId: string, requested: number, available: number) {
    super(`Insufficient stock for product ${productId}. Requested: ${requested}, Available: ${available}`, {
      productId,
      requested,
      available,
    });
  }
}

export class InvalidStatusTransitionError extends DomainException {
  public readonly code = 'INVALID_STATUS_TRANSITION';

  constructor(entityType: string, currentStatus: string, targetStatus: string) {
    super(`Cannot transition ${entityType} from ${currentStatus} to ${targetStatus}`, {
      entityType,
      currentStatus,
      targetStatus,
    });
  }
}

export class UnauthorizedOperationError extends DomainException {
  public readonly code = 'UNAUTHORIZED_OPERATION';

  constructor(operation: string, userId?: string) {
    super(`User ${userId ?? 'unknown'} is not authorized to perform operation: ${operation}`, {
      operation,
      userId,
    });
  }
}

export class DuplicateEntityError extends DomainException {
  public readonly code = 'DUPLICATE_ENTITY';

  constructor(entityType: string, field: string, value: string) {
    super(`${entityType} with ${field} '${value}' already exists`, {
      entityType,
      field,
      value,
    });
  }
}

export class InvalidOperationError extends DomainException {
  public readonly code = 'INVALID_OPERATION';

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}

export class ConfigurationError extends DomainException {
  public readonly code = 'CONFIGURATION_ERROR';

  constructor(message: string, details?: Record<string, unknown>) {
    super(message, details);
  }
}
