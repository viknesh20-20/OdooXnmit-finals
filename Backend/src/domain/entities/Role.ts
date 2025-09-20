import { UUID, Timestamp } from '@/types/common';
import { ValidationError } from '@domain/exceptions/DomainException';

export interface RoleProps {
  readonly id: UUID;
  readonly name: string;
  readonly description?: string;
  readonly permissions: string[];
  readonly isActive: boolean;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateRoleProps {
  readonly name: string;
  readonly description?: string;
  readonly permissions?: string[];
}

export class Role {
  private constructor(private readonly props: RoleProps) {
    this.validate();
  }

  public get id(): UUID {
    return this.props.id;
  }

  public get name(): string {
    return this.props.name;
  }

  public get description(): string | undefined {
    return this.props.description;
  }

  public get permissions(): string[] {
    return [...this.props.permissions];
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
      throw new ValidationError('Role ID is required');
    }

    if (!this.props.name || this.props.name.trim().length === 0) {
      throw new ValidationError('Role name is required');
    }

    if (this.props.name.length > 50) {
      throw new ValidationError('Role name cannot exceed 50 characters');
    }

    if (this.props.description && this.props.description.length > 255) {
      throw new ValidationError('Role description cannot exceed 255 characters');
    }
  }

  public hasPermission(permission: string): boolean {
    return this.props.permissions.includes(permission);
  }

  public addPermission(permission: string): Role {
    if (this.props.permissions.includes(permission)) {
      return this;
    }

    return new Role({
      ...this.props,
      permissions: [...this.props.permissions, permission],
      updatedAt: new Date(),
    });
  }

  public removePermission(permission: string): Role {
    const newPermissions = this.props.permissions.filter(p => p !== permission);
    
    if (newPermissions.length === this.props.permissions.length) {
      return this;
    }

    return new Role({
      ...this.props,
      permissions: newPermissions,
      updatedAt: new Date(),
    });
  }

  public activate(): Role {
    return new Role({
      ...this.props,
      isActive: true,
      updatedAt: new Date(),
    });
  }

  public deactivate(): Role {
    return new Role({
      ...this.props,
      isActive: false,
      updatedAt: new Date(),
    });
  }

  public equals(other: Role): boolean {
    return this.props.id === other.props.id;
  }

  public static create(props: CreateRoleProps): Role {
    const now = new Date();
    const id = crypto.randomUUID();

    return new Role({
      id,
      name: props.name.trim(),
      description: props.description?.trim(),
      permissions: props.permissions ?? [],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  public static fromPersistence(props: RoleProps): Role {
    return new Role(props);
  }

  public toPersistence(): RoleProps {
    return { ...this.props };
  }
}
