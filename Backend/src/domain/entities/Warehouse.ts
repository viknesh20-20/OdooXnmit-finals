import { UUID, Timestamp } from '@/types/common';
import { ValidationError } from '@domain/exceptions/DomainException';

export interface WarehouseProps {
  readonly id: UUID;
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly address?: string;
  readonly isActive: boolean;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export class Warehouse {
  private constructor(private readonly props: WarehouseProps) {
    this.validate();
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get code(): string {
    return this.props.code;
  }

  public get name(): string {
    return this.props.name;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get address(): string | undefined {
    return this.props.address;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get createdAt(): Timestamp {
    return this.props.createdAt;
  }

  public get updatedAt(): Timestamp {
    return this.props.updatedAt;
  }

  private validate(): void {
    if (!this.props.id) {
      throw new ValidationError('Warehouse ID is required');
    }

    if (!this.props.code || this.props.code.trim().length === 0) {
      throw new ValidationError('Warehouse code is required');
    }

    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new ValidationError('Warehouse name is required');
    }
  }

  public equals(other: Warehouse): boolean {
    return this.props.id === other.props.id;
  }

  public static fromPersistence(props: WarehouseProps): Warehouse {
    return new Warehouse(props);
  }

  public toPersistence(): WarehouseProps {
    return { ...this.props };
  }
}
