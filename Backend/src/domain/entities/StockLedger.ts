import { UUID, Timestamp, StockTransactionType } from '@/types/common';
import { ValidationError } from '@domain/exceptions/DomainException';
import { Quantity } from '@domain/value-objects/Money';

export interface StockLedgerProps {
  readonly id: UUID;
  readonly productId: UUID;
  readonly warehouseId?: UUID;
  readonly transactionType: StockTransactionType;
  readonly quantity: Quantity;
  readonly runningBalance: Quantity;
  readonly referenceId?: UUID; // Manufacturing order, purchase order, etc.
  readonly referenceType?: string;
  readonly notes?: string;
  readonly createdBy: UUID;
  readonly createdAt: Timestamp;
}

export class StockLedger {
  private constructor(private readonly props: StockLedgerProps) {
    this.validate();
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get productId(): UUID {
    return this.props.productId;
  }

  public get warehouseId(): UUID | undefined {
    return this.props.warehouseId;
  }

  public get transactionType(): StockTransactionType {
    return this.props.transactionType;
  }

  public get quantity(): Quantity {
    return this.props.quantity;
  }

  public get runningBalance(): Quantity {
    return this.props.runningBalance;
  }

  public get referenceId(): UUID | undefined {
    return this.props.referenceId;
  }

  public get referenceType(): string | undefined {
    return this.props.referenceType;
  }

  public get notes(): string | undefined {
    return this.props.notes;
  }

  public get createdBy(): UUID {
    return this.props.createdBy;
  }

  public get createdAt(): Timestamp {
    return this.props.createdAt;
  }

  private validate(): void {
    if (!this.props.id) {
      throw new ValidationError('StockLedger ID is required');
    }

    if (!this.props.productId) {
      throw new ValidationError('Product ID is required');
    }

    if (!this.props.createdBy) {
      throw new ValidationError('Created by user ID is required');
    }
  }

  public equals(other: StockLedger): boolean {
    return this.props.id === other.props.id;
  }

  public static fromPersistence(props: StockLedgerProps): StockLedger {
    return new StockLedger(props);
  }

  public toPersistence(): StockLedgerProps {
    return { ...this.props };
  }
}
