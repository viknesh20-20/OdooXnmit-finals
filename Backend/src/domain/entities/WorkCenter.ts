import { UUID, Timestamp } from '@/types/common';
import { ValidationError } from '@domain/exceptions/DomainException';

export interface WorkCenterProps {
  readonly id: UUID;
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly capacity: number; // units per hour
  readonly efficiency: number; // percentage (0-100)
  readonly isActive: boolean;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export class WorkCenter {
  private constructor(private readonly props: WorkCenterProps) {
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

  public get capacity(): number {
    return this.props.capacity;
  }

  public get efficiency(): number {
    return this.props.efficiency;
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
      throw new ValidationError('WorkCenter ID is required');
    }

    if (!this.props.code || this.props.code.trim().length === 0) {
      throw new ValidationError('WorkCenter code is required');
    }

    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new ValidationError('WorkCenter name is required');
    }

    if (this.props.capacity < 0) {
      throw new ValidationError('WorkCenter capacity cannot be negative');
    }

    if (this.props.efficiency < 0 || this.props.efficiency > 100) {
      throw new ValidationError('WorkCenter efficiency must be between 0 and 100');
    }
  }

  public equals(other: WorkCenter): boolean {
    return this.props.id === other.props.id;
  }

  public static fromPersistence(props: WorkCenterProps): WorkCenter {
    return new WorkCenter(props);
  }

  public toPersistence(): WorkCenterProps {
    return { ...this.props };
  }
}
