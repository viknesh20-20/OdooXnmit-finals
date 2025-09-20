import { UUID, Timestamp, WorkOrderStatus } from '@/types/common';
import { ValidationError } from '@domain/exceptions/DomainException';

export interface WorkOrderProps {
  readonly id: UUID;
  readonly woNumber: string;
  readonly manufacturingOrderId: UUID;
  readonly workCenterId: UUID;
  readonly operationSequence: number;
  readonly operationName: string;
  readonly status: WorkOrderStatus;
  readonly assignedTo?: UUID;
  readonly plannedStartDate?: Timestamp;
  readonly plannedEndDate?: Timestamp;
  readonly actualStartDate?: Timestamp;
  readonly actualEndDate?: Timestamp;
  readonly estimatedDuration: number; // in minutes
  readonly actualDuration?: number; // in minutes
  readonly notes?: string;
  readonly createdBy: UUID;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export class WorkOrder {
  private constructor(private readonly props: WorkOrderProps) {
    this.validate();
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get woNumber(): string {
    return this.props.woNumber;
  }

  public get manufacturingOrderId(): UUID {
    return this.props.manufacturingOrderId;
  }

  public get status(): WorkOrderStatus {
    return this.props.status;
  }

  public get createdAt(): Timestamp {
    return this.props.createdAt;
  }

  public get updatedAt(): Timestamp {
    return this.props.updatedAt;
  }

  private validate(): void {
    if (!this.props.id) {
      throw new ValidationError('WorkOrder ID is required');
    }

    if (!this.props.woNumber) {
      throw new ValidationError('Work order number is required');
    }

    if (!this.props.manufacturingOrderId) {
      throw new ValidationError('Manufacturing order ID is required');
    }
  }

  public equals(other: WorkOrder): boolean {
    return this.props.id === other.props.id;
  }

  public static fromPersistence(props: WorkOrderProps): WorkOrder {
    return new WorkOrder(props);
  }

  public toPersistence(): WorkOrderProps {
    return { ...this.props };
  }
}
