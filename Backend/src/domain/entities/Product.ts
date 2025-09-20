import { UUID, Timestamp, ProductType } from '@/types/common';
import { ValidationError } from '@domain/exceptions/DomainException';
import { Money, Quantity } from '@domain/value-objects/Money';

export interface ProductProps {
  readonly id: UUID;
  readonly sku: string;
  readonly name: string;
  readonly description?: string;
  readonly categoryId?: UUID;
  readonly uomId: UUID;
  readonly type: ProductType;
  readonly costPrice: Money;
  readonly sellingPrice: Money;
  readonly minStockLevel: Quantity;
  readonly maxStockLevel: Quantity;
  readonly reorderPoint: Quantity;
  readonly leadTimeDays: number;
  readonly isActive: boolean;
  readonly specifications: Record<string, unknown>;
  readonly attachments: string[];
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateProductProps {
  readonly sku: string;
  readonly name: string;
  readonly description?: string;
  readonly categoryId?: UUID;
  readonly uomId: UUID;
  readonly type: ProductType;
  readonly costPrice?: number;
  readonly sellingPrice?: number;
  readonly minStockLevel?: number;
  readonly maxStockLevel?: number;
  readonly reorderPoint?: number;
  readonly leadTimeDays?: number;
  readonly specifications?: Record<string, unknown>;
  readonly attachments?: string[];
}

export class Product {
  private constructor(private readonly props: ProductProps) {
    this.validate();
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get sku(): string {
    return this.props.sku;
  }

  public get name(): string {
    return this.props.name;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get categoryId(): UUID | undefined {
    return this.props.categoryId;
  }

  public get uomId(): UUID {
    return this.props.uomId;
  }

  public get type(): ProductType {
    return this.props.type;
  }

  public get costPrice(): Money {
    return this.props.costPrice;
  }

  public get sellingPrice(): Money {
    return this.props.sellingPrice;
  }

  public get minStockLevel(): Quantity {
    return this.props.minStockLevel;
  }

  public get maxStockLevel(): Quantity {
    return this.props.maxStockLevel;
  }

  public get reorderPoint(): Quantity {
    return this.props.reorderPoint;
  }

  public get unitSymbol(): string {
    return this.props.minStockLevel.unit;
  }

  public get leadTimeDays(): number {
    return this.props.leadTimeDays;
  }

  public get isActive(): boolean {
    return this.props.isActive;
  }

  public get specifications(): Record<string, unknown> {
    return { ...this.props.specifications };
  }

  public get attachments(): readonly string[] {
    return [...this.props.attachments];
  }

  public get createdAt(): Timestamp {
    return this.props.createdAt;
  }

  public get updatedAt(): Timestamp {
    return this.props.updatedAt;
  }

  private validate(): void {
    if (!this.props.sku || this.props.sku.trim().length === 0) {
      throw new ValidationError('Product SKU is required');
    }

    if (this.props.sku.length > 100) {
      throw new ValidationError('Product SKU cannot exceed 100 characters');
    }

    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new ValidationError('Product name is required');
    }

    if (this.props.name.length > 255) {
      throw new ValidationError('Product name cannot exceed 255 characters');
    }

    if (this.props.description && this.props.description.length > 1000) {
      throw new ValidationError('Product description cannot exceed 1000 characters');
    }

    if (this.props.leadTimeDays < 0) {
      throw new ValidationError('Lead time days cannot be negative');
    }

    if (this.props.leadTimeDays > 365) {
      throw new ValidationError('Lead time days cannot exceed 365 days');
    }

    // Validate stock levels make sense
    if (this.props.minStockLevel.isGreaterThan(this.props.maxStockLevel)) {
      throw new ValidationError('Minimum stock level cannot be greater than maximum stock level');
    }

    if (this.props.reorderPoint.isGreaterThan(this.props.maxStockLevel)) {
      throw new ValidationError('Reorder point cannot be greater than maximum stock level');
    }
  }

  public isRawMaterial(): boolean {
    return this.props.type === ProductType.RAW_MATERIAL;
  }

  public isManufactured(): boolean {
    return this.props.type === ProductType.MANUFACTURED;
  }

  public isFinishedGood(): boolean {
    return this.props.type === ProductType.FINISHED_GOOD;
  }

  public activate(): Product {
    if (this.props.isActive) {
      return this;
    }

    return new Product({
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    });
  }

  public deactivate(): Product {
    if (!this.props.isActive) {
      return this;
    }

    return new Product({
      ...this.props,
      isActive: false,
      updatedAt: new Date(),
    });
  }

  public updateBasicInfo(updates: {
    name?: string;
    description?: string;
    categoryId?: UUID;
  }): Product {
    return new Product({
      ...this.props,
      name: updates.name ?? this.props.name,
      description: updates.description ?? this.props.description,
      categoryId: updates.categoryId ?? this.props.categoryId,
      updatedAt: new Date(),
    });
  }

  public updatePricing(costPrice?: Money, sellingPrice?: Money): Product {
    return new Product({
      ...this.props,
      costPrice: costPrice ?? this.props.costPrice,
      sellingPrice: sellingPrice ?? this.props.sellingPrice,
      updatedAt: new Date(),
    });
  }

  public updateStockLevels(
    minStockLevel?: Quantity,
    maxStockLevel?: Quantity,
    reorderPoint?: Quantity
  ): Product {
    const newMinStock = minStockLevel ?? this.props.minStockLevel;
    const newMaxStock = maxStockLevel ?? this.props.maxStockLevel;
    const newReorderPoint = reorderPoint ?? this.props.reorderPoint;

    // Validate the new stock levels
    if (newMinStock.isGreaterThan(newMaxStock)) {
      throw new ValidationError('Minimum stock level cannot be greater than maximum stock level');
    }

    if (newReorderPoint.isGreaterThan(newMaxStock)) {
      throw new ValidationError('Reorder point cannot be greater than maximum stock level');
    }

    return new Product({
      ...this.props,
      minStockLevel: newMinStock,
      maxStockLevel: newMaxStock,
      reorderPoint: newReorderPoint,
      updatedAt: new Date(),
    });
  }

  public updateLeadTime(leadTimeDays: number): Product {
    if (leadTimeDays < 0) {
      throw new ValidationError('Lead time days cannot be negative');
    }

    if (leadTimeDays > 365) {
      throw new ValidationError('Lead time days cannot exceed 365 days');
    }

    return new Product({
      ...this.props,
      leadTimeDays,
      updatedAt: new Date(),
    });
  }

  public updateSpecifications(specifications: Record<string, unknown>): Product {
    return new Product({
      ...this.props,
      specifications: { ...this.props.specifications, ...specifications },
      updatedAt: new Date(),
    });
  }

  public addAttachment(attachment: string): Product {
    if (this.props.attachments.includes(attachment)) {
      return this;
    }

    return new Product({
      ...this.props,
      attachments: [...this.props.attachments, attachment],
      updatedAt: new Date(),
    });
  }

  public removeAttachment(attachment: string): Product {
    const newAttachments = this.props.attachments.filter(a => a !== attachment);
    
    if (newAttachments.length === this.props.attachments.length) {
      return this;
    }

    return new Product({
      ...this.props,
      attachments: newAttachments,
      updatedAt: new Date(),
    });
  }

  public isStockBelowReorderPoint(currentStock: Quantity): boolean {
    try {
      return currentStock.isLessThan(this.props.reorderPoint);
    } catch {
      // Different units, cannot compare
      return false;
    }
  }

  public isStockBelowMinimum(currentStock: Quantity): boolean {
    try {
      return currentStock.isLessThan(this.props.minStockLevel);
    } catch {
      // Different units, cannot compare
      return false;
    }
  }

  public isStockAboveMaximum(currentStock: Quantity): boolean {
    try {
      return currentStock.isGreaterThan(this.props.maxStockLevel);
    } catch {
      // Different units, cannot compare
      return false;
    }
  }

  public equals(other: Product): boolean {
    return this.props.id === other.props.id;
  }

  public static create(props: CreateProductProps, unitSymbol: string): Product {
    const now = new Date();
    const id = crypto.randomUUID();

    return new Product({
      id,
      sku: props.sku.trim(),
      name: props.name.trim(),
      description: props.description?.trim(),
      categoryId: props.categoryId,
      uomId: props.uomId,
      type: props.type,
      costPrice: Money.create(props.costPrice ?? 0),
      sellingPrice: Money.create(props.sellingPrice ?? 0),
      minStockLevel: Quantity.create(props.minStockLevel ?? 0, unitSymbol),
      maxStockLevel: Quantity.create(props.maxStockLevel ?? 0, unitSymbol),
      reorderPoint: Quantity.create(props.reorderPoint ?? 0, unitSymbol),
      leadTimeDays: props.leadTimeDays ?? 0,
      isActive: true,
      specifications: props.specifications ?? {},
      attachments: props.attachments ?? [],
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPersistence(props: ProductProps): Product {
    return new Product(props);
  }

  public toPersistence(): ProductProps {
    return { ...this.props };
  }
}
