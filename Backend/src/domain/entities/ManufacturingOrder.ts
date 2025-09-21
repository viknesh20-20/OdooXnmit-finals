import { UUID, Timestamp, ManufacturingOrderStatus, PriorityLevel } from '@/types/common';
import { ValidationError, InvalidStatusTransitionError, BusinessRuleViolationError } from '@domain/exceptions/DomainException';
import { Quantity } from '@domain/value-objects/Money';

export interface ManufacturingOrderProps {
  readonly id: UUID;
  readonly moNumber: string;
  readonly productId: UUID;
  readonly bomId: UUID;
  readonly quantity: Quantity;
  readonly status: ManufacturingOrderStatus;
  readonly priority: PriorityLevel;
  readonly plannedStartDate?: Timestamp;
  readonly plannedEndDate?: Timestamp;
  readonly actualStartDate?: Timestamp;
  readonly actualEndDate?: Timestamp;
  readonly createdBy: UUID;
  readonly assignedTo?: UUID;
  readonly notes?: string;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateManufacturingOrderProps {
  readonly productId: UUID;
  readonly bomId: UUID;
  readonly quantity: number;
  readonly quantityUnit: string;
  readonly priority?: PriorityLevel;
  readonly plannedStartDate?: Timestamp;
  readonly plannedEndDate?: Timestamp;
  readonly assignedTo?: UUID;
  readonly notes?: string;
  readonly metadata?: Record<string, unknown>;
}

export class ManufacturingOrder {
  private static readonly STATUS_TRANSITIONS: Record<ManufacturingOrderStatus, ManufacturingOrderStatus[]> = {
    [ManufacturingOrderStatus.DRAFT]: [ManufacturingOrderStatus.CONFIRMED, ManufacturingOrderStatus.CANCELLED],
    [ManufacturingOrderStatus.CONFIRMED]: [ManufacturingOrderStatus.IN_PROGRESS, ManufacturingOrderStatus.CANCELLED],
    [ManufacturingOrderStatus.IN_PROGRESS]: [ManufacturingOrderStatus.COMPLETED, ManufacturingOrderStatus.CANCELLED],
    [ManufacturingOrderStatus.COMPLETED]: [],
    [ManufacturingOrderStatus.CANCELLED]: [],
  };

  private constructor(private readonly props: ManufacturingOrderProps) {
    this.validate();
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get moNumber(): string {
    return this.props.moNumber;
  }

  public get productId(): UUID {
    return this.props.productId;
  }

  public get bomId(): UUID {
    return this.props.bomId;
  }

  public get quantity(): Quantity {
    return this.props.quantity;
  }

  public get quantityUnit(): string {
    return this.props.quantity.unit;
  }

  public get status(): ManufacturingOrderStatus {
    return this.props.status;
  }

  public get priority(): PriorityLevel {
    return this.props.priority;
  }

  public get plannedStartDate(): Timestamp | undefined {
    return this.props.plannedStartDate;
  }

  public get plannedEndDate(): Timestamp | undefined {
    return this.props.plannedEndDate;
  }

  public get actualStartDate(): Timestamp | undefined {
    return this.props.actualStartDate;
  }

  public get actualEndDate(): Timestamp | undefined {
    return this.props.actualEndDate;
  }

  public get createdBy(): UUID {
    return this.props.createdBy;
  }

  public get assignedTo(): UUID | undefined {
    return this.props.assignedTo;
  }

  public get notes(): string | undefined {
    return this.props.notes;
  }

  public get metadata(): Record<string, unknown> {
    return { ...this.props.metadata };
  }

  public get createdAt(): Timestamp {
    return this.props.createdAt;
  }

  public get updatedAt(): Timestamp {
    return this.props.updatedAt;
  }

  private validate(): void {
    if (!this.props.moNumber || this.props.moNumber.trim().length === 0) {
      throw new ValidationError('Manufacturing Order number is required');
    }

    if (this.props.moNumber.length > 50) {
      throw new ValidationError('Manufacturing Order number cannot exceed 50 characters');
    }

    if (this.props.quantity.isZero() || this.props.quantity.value <= 0) {
      throw new ValidationError('Manufacturing Order quantity must be greater than zero');
    }

    if (this.props.notes && this.props.notes.length > 1000) {
      throw new ValidationError('Notes cannot exceed 1000 characters');
    }

    // Validate date logic
    if (this.props.plannedStartDate && this.props.plannedEndDate) {
      if (this.props.plannedStartDate >= this.props.plannedEndDate) {
        throw new ValidationError('Planned start date must be before planned end date');
      }
    }

    if (this.props.actualStartDate && this.props.actualEndDate) {
      if (this.props.actualStartDate >= this.props.actualEndDate) {
        throw new ValidationError('Actual start date must be before actual end date');
      }
    }
  }

  public isDraft(): boolean {
    return this.props.status === ManufacturingOrderStatus.DRAFT;
  }

  public isConfirmed(): boolean {
    return this.props.status === ManufacturingOrderStatus.CONFIRMED;
  }

  public isInProgress(): boolean {
    return this.props.status === ManufacturingOrderStatus.IN_PROGRESS;
  }

  public isCompleted(): boolean {
    return this.props.status === ManufacturingOrderStatus.COMPLETED;
  }

  public isCancelled(): boolean {
    return this.props.status === ManufacturingOrderStatus.CANCELLED;
  }

  public canBeConfirmed(): boolean {
    return this.props.status === ManufacturingOrderStatus.DRAFT;
  }

  public canBeStarted(): boolean {
    return this.props.status === ManufacturingOrderStatus.CONFIRMED;
  }

  public canBeCompleted(): boolean {
    return this.props.status === ManufacturingOrderStatus.IN_PROGRESS;
  }

  public canBeCancelled(): boolean {
    return [ManufacturingOrderStatus.DRAFT, ManufacturingOrderStatus.CONFIRMED].includes(this.props.status);
  }

  private canTransitionTo(newStatus: ManufacturingOrderStatus): boolean {
    const allowedTransitions = ManufacturingOrder.STATUS_TRANSITIONS[this.props.status];
    return allowedTransitions.includes(newStatus);
  }

  public confirm(): ManufacturingOrder {
    if (!this.canTransitionTo(ManufacturingOrderStatus.CONFIRMED)) {
      throw new InvalidStatusTransitionError('ManufacturingOrder', this.props.status, ManufacturingOrderStatus.CONFIRMED);
    }

    return new ManufacturingOrder({
      ...this.props,
      status: ManufacturingOrderStatus.CONFIRMED,
      updatedAt: new Date(),
    });
  }

  public start(): ManufacturingOrder {
    if (!this.canTransitionTo(ManufacturingOrderStatus.IN_PROGRESS)) {
      throw new InvalidStatusTransitionError('ManufacturingOrder', this.props.status, ManufacturingOrderStatus.IN_PROGRESS);
    }

    const now = new Date();
    return new ManufacturingOrder({
      ...this.props,
      status: ManufacturingOrderStatus.IN_PROGRESS,
      actualStartDate: this.props.actualStartDate ?? now,
      updatedAt: now,
    });
  }

  public complete(): ManufacturingOrder {
    if (!this.canTransitionTo(ManufacturingOrderStatus.COMPLETED)) {
      throw new InvalidStatusTransitionError('ManufacturingOrder', this.props.status, ManufacturingOrderStatus.COMPLETED);
    }

    const now = new Date();
    return new ManufacturingOrder({
      ...this.props,
      status: ManufacturingOrderStatus.COMPLETED,
      actualEndDate: this.props.actualEndDate ?? now,
      updatedAt: now,
    });
  }

  public cancel(): ManufacturingOrder {
    if (!this.canTransitionTo(ManufacturingOrderStatus.CANCELLED)) {
      throw new InvalidStatusTransitionError('ManufacturingOrder', this.props.status, ManufacturingOrderStatus.CANCELLED);
    }

    return new ManufacturingOrder({
      ...this.props,
      status: ManufacturingOrderStatus.CANCELLED,
      updatedAt: new Date(),
    });
  }

  public updatePriority(priority: PriorityLevel): ManufacturingOrder {
    if (this.isCompleted() || this.isCancelled()) {
      throw new BusinessRuleViolationError('Cannot update priority of completed or cancelled manufacturing order');
    }

    return new ManufacturingOrder({
      ...this.props,
      priority,
      updatedAt: new Date(),
    });
  }

  public updatePlannedDates(startDate?: Timestamp, endDate?: Timestamp): ManufacturingOrder {
    if (this.isCompleted() || this.isCancelled()) {
      throw new BusinessRuleViolationError('Cannot update planned dates of completed or cancelled manufacturing order');
    }

    const newStartDate = startDate ?? this.props.plannedStartDate;
    const newEndDate = endDate ?? this.props.plannedEndDate;

    if (newStartDate && newEndDate && newStartDate >= newEndDate) {
      throw new ValidationError('Planned start date must be before planned end date');
    }

    return new ManufacturingOrder({
      ...this.props,
      plannedStartDate: newStartDate,
      plannedEndDate: newEndDate,
      updatedAt: new Date(),
    });
  }

  public assignTo(userId: UUID): ManufacturingOrder {
    if (this.isCompleted() || this.isCancelled()) {
      throw new BusinessRuleViolationError('Cannot assign completed or cancelled manufacturing order');
    }

    return new ManufacturingOrder({
      ...this.props,
      assignedTo: userId,
      updatedAt: new Date(),
    });
  }

  public updateNotes(notes: string): ManufacturingOrder {
    if (notes.length > 1000) {
      throw new ValidationError('Notes cannot exceed 1000 characters');
    }

    return new ManufacturingOrder({
      ...this.props,
      notes: notes.trim() || undefined,
      updatedAt: new Date(),
    });
  }

  public updateMetadata(metadata: Record<string, unknown>): ManufacturingOrder {
    return new ManufacturingOrder({
      ...this.props,
      metadata: { ...this.props.metadata, ...metadata },
      updatedAt: new Date(),
    });
  }

  public getDuration(): number | null {
    if (!this.props.actualStartDate || !this.props.actualEndDate) {
      return null;
    }
    return this.props.actualEndDate.getTime() - this.props.actualStartDate.getTime();
  }

  public getPlannedDuration(): number | null {
    if (!this.props.plannedStartDate || !this.props.plannedEndDate) {
      return null;
    }
    return this.props.plannedEndDate.getTime() - this.props.plannedStartDate.getTime();
  }

  public isOverdue(): boolean {
    if (!this.props.plannedEndDate || this.isCompleted() || this.isCancelled()) {
      return false;
    }
    return new Date() > this.props.plannedEndDate;
  }

  public equals(other: ManufacturingOrder): boolean {
    return this.props.id === other.props.id;
  }

  public static create(props: CreateManufacturingOrderProps, moNumber: string, createdBy: UUID): ManufacturingOrder {
    const now = new Date();
    const id = crypto.randomUUID();

    // Validate planned dates if provided
    if (props.plannedStartDate && props.plannedEndDate) {
      if (props.plannedStartDate >= props.plannedEndDate) {
        throw new ValidationError('Planned start date must be before planned end date');
      }
    }

    return new ManufacturingOrder({
      id,
      moNumber,
      productId: props.productId,
      bomId: props.bomId,
      quantity: Quantity.create(props.quantity, props.quantityUnit),
      status: ManufacturingOrderStatus.DRAFT,
      priority: props.priority ?? PriorityLevel.NORMAL,
      plannedStartDate: props.plannedStartDate,
      plannedEndDate: props.plannedEndDate,
      createdBy,
      assignedTo: props.assignedTo,
      notes: props.notes?.trim(),
      metadata: props.metadata ?? {},
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPersistence(props: ManufacturingOrderProps): ManufacturingOrder {
    return new ManufacturingOrder(props);
  }

  public toPersistence(): ManufacturingOrderProps {
    return { ...this.props };
  }
}
