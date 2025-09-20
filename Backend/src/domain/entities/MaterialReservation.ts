import { UUID, Timestamp } from '@/types/common';
import { ValidationError } from '@domain/exceptions/DomainException';
import { Quantity } from '@domain/value-objects/Money';

export interface MaterialReservationProps {
  readonly id: UUID;
  readonly productId: UUID;
  readonly manufacturingOrderId: UUID;
  readonly warehouseId?: UUID;
  readonly reservedQuantity: Quantity;
  readonly allocatedQuantity: Quantity;
  readonly isActive: boolean;
  readonly reservedBy: UUID;
  readonly reservedAt: Timestamp;
  readonly expiresAt?: Timestamp;
  readonly releasedBy?: UUID;
  readonly releasedAt?: Timestamp;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export class MaterialReservation {
  private constructor(private readonly props: MaterialReservationProps) {
    this.validate();
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get productId(): UUID {
    return this.props.productId;
  }

  public get manufacturingOrderId(): UUID {
    return this.props.manufacturingOrderId;
  }

  public get warehouseId(): UUID | undefined {
    return this.props.warehouseId;
  }

  public get reservedQuantity(): Quantity {
    return this.props.reservedQuantity;
  }

  public get allocatedQuantity(): Quantity {
    return this.props.allocatedQuantity;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get reservedBy(): UUID {
    return this.props.reservedBy;
  }

  public get reservedAt(): Timestamp {
    return this.props.reservedAt;
  }

  public get expiresAt(): Timestamp | undefined {
    return this.props.expiresAt;
  }

  public get createdAt(): Timestamp {
    return this.props.createdAt;
  }

  public get updatedAt(): Timestamp {
    return this.props.updatedAt;
  }

  private validate(): void {
    if (!this.props.id) {
      throw new ValidationError('MaterialReservation ID is required');
    }

    if (!this.props.productId) {
      throw new ValidationError('Product ID is required');
    }

    if (!this.props.manufacturingOrderId) {
      throw new ValidationError('Manufacturing order ID is required');
    }

    if (!this.props.reservedBy) {
      throw new ValidationError('Reserved by user ID is required');
    }
  }

  public equals(other: MaterialReservation): boolean {
    return this.props.id === other.props.id;
  }

  public static fromPersistence(props: MaterialReservationProps): MaterialReservation {
    return new MaterialReservation(props);
  }

  public toPersistence(): MaterialReservationProps {
    return { ...this.props };
  }
}
