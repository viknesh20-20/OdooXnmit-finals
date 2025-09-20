import { UUID, Timestamp } from '@/types/common';
import { ValidationError } from '@domain/exceptions/DomainException';
import { Quantity } from '@domain/value-objects/Money';

export interface BOMComponent {
  readonly componentId: UUID;
  readonly quantity: Quantity;
  readonly sequence: number;
  readonly scrapFactor: number;
  readonly notes?: string;
}

export interface BOMProps {
  readonly id: UUID;
  readonly productId: UUID;
  readonly version: string;
  readonly name: string;
  readonly description?: string;
  readonly components: BOMComponent[];
  readonly isActive: boolean;
  readonly isDefault: boolean;
  readonly createdBy: UUID;
  readonly approvedBy?: UUID;
  readonly approvedAt?: Timestamp;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateBOMProps {
  readonly productId: UUID;
  readonly version: string;
  readonly name: string;
  readonly description?: string;
  readonly components?: BOMComponent[];
  readonly createdBy: UUID;
}

export class BOM {
  private constructor(private readonly props: BOMProps) {
    this.validate();
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get productId(): UUID {
    return this.props.productId;
  }

  public get version(): string {
    return this.props.version;
  }

  public get name(): string {
    return this.props.name;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get components(): BOMComponent[] {
    return [...this.props.components];
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get isDefault(): boolean {
    return this.props.isDefault;
  }

  public get createdBy(): UUID {
    return this.props.createdBy;
  }

  public get approvedBy(): UUID | undefined {
    return this.props.approvedBy;
  }

  public get approvedAt(): Timestamp | undefined {
    return this.props.approvedAt;
  }

  public get createdAt(): Timestamp {
    return this.props.createdAt;
  }

  public get updatedAt(): Timestamp {
    return this.props.updatedAt;
  }

  private validate(): void {
    if (!this.props.id) {
      throw new ValidationError('BOM ID is required');
    }

    if (!this.props.productId) {
      throw new ValidationError('Product ID is required');
    }

    if (!this.props.version || this.props.version.trim().length === 0) {
      throw new ValidationError('BOM version is required');
    }

    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new ValidationError('BOM name is required');
    }

    if (!this.props.createdBy) {
      throw new ValidationError('Created by user ID is required');
    }
  }

  public activate(): BOM {
    return new BOM({
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    });
  }

  public deactivate(): BOM {
    return new BOM({
      ...this.props,
      isActive: false,
      updatedAt: new Date(),
    });
  }

  public approve(approvedBy: UUID): BOM {
    if (this.props.approvedBy) {
      throw new ValidationError('BOM is already approved');
    }

    return new BOM({
      ...this.props,
      approvedBy,
      approvedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  public setAsDefault(): BOM {
    return new BOM({
      ...this.props,
      isDefault: true,
      updatedAt: new Date(),
    });
  }

  public unsetAsDefault(): BOM {
    return new BOM({
      ...this.props,
      isDefault: false,
      updatedAt: new Date(),
    });
  }

  public equals(other: BOM): boolean {
    return this.props.id === other.props.id;
  }

  public static create(props: CreateBOMProps): BOM {
    const now = new Date();
    const id = crypto.randomUUID();

    return new BOM({
      id,
      productId: props.productId,
      version: props.version.trim(),
      name: props.name.trim(),
      description: props.description?.trim(),
      components: props.components ?? [],
      isActive: true,
      isDefault: false,
      createdBy: props.createdBy,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPersistence(props: BOMProps): BOM {
    return new BOM(props);
  }

  public toPersistence(): BOMProps {
    return { ...this.props };
  }
}
