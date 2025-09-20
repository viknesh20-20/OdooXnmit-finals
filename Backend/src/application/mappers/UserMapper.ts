import { injectable } from 'inversify';

import { User } from '@domain/entities/User';
import { UserResponseDTO, UserListResponseDTO } from '@application/dtos/UserDTOs';
import { PaginatedResult } from '@/types/common';

@injectable()
export class UserMapper {
  public toResponseDTO(user: User, roleName?: string): UserResponseDTO {
    return {
      id: user.id,
      username: user.username.value,
      email: user.email.value,
      firstName: user.name.firstName,
      lastName: user.name.lastName,
      fullName: user.name.fullName,
      phone: user.phone,
      status: user.status,
      roleId: user.roleId,
      roleName,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      metadata: user.metadata,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  public toListResponseDTO(
    paginatedUsers: PaginatedResult<User>,
    roleNames?: Map<string, string>
  ): UserListResponseDTO {
    const users = paginatedUsers.data.map(user => 
      this.toResponseDTO(user, roleNames?.get(user.roleId ?? ''))
    );

    return {
      users,
      total: paginatedUsers.total,
      page: paginatedUsers.page,
      limit: paginatedUsers.limit,
      totalPages: paginatedUsers.totalPages,
    };
  }

  public toDomainEntity(dto: any): User {
    // Handle both camelCase and snake_case field names from database
    const emailVerified = dto.emailVerified ?? dto.email_verified ?? false;
    const emailVerificationToken = dto.emailVerificationToken ?? dto.email_verification_token;
    const emailVerificationExpires = dto.emailVerificationExpires ?? dto.email_verification_expires;
    const passwordResetToken = dto.passwordResetToken ?? dto.password_reset_token;
    const passwordResetExpires = dto.passwordResetExpires ?? dto.password_reset_expires;
    const lastLogin = dto.lastLogin ?? dto.last_login;
    const failedLoginAttempts = dto.failedLoginAttempts ?? dto.failed_login_attempts ?? 0;
    const lockedUntil = dto.lockedUntil ?? dto.locked_until;
    const firstName = dto.firstName ?? dto.first_name;
    const lastName = dto.lastName ?? dto.last_name;
    const passwordHash = dto.passwordHash ?? dto.password_hash;
    const roleId = dto.roleId ?? dto.role_id;
    const createdAt = dto.createdAt ?? dto.created_at;
    const updatedAt = dto.updatedAt ?? dto.updated_at;

    return User.fromPersistence({
      id: dto.id,
      username: { value: dto.username } as any, // Will be properly typed in implementation
      email: { value: dto.email } as any,
      password: { hash: passwordHash } as any,
      name: { firstName, lastName, fullName: `${firstName} ${lastName}` } as any,
      phone: dto.phone || '',
      status: dto.status as any,
      roleId,
      emailVerified,
      emailVerificationToken,
      emailVerificationExpires,
      passwordResetToken,
      passwordResetExpires,
      lastLogin,
      failedLoginAttempts,
      lockedUntil,
      metadata: dto.metadata || {},
      createdAt,
      updatedAt,
    });
  }

  public toPersistenceData(user: User): any {
    const props = user.toPersistence();
    
    // Return data with database field names (snake_case)
    return {
      id: props.id,
      username: props.username.value,
      email: props.email.value,
      password_hash: props.password.hash,  // snake_case for database
      first_name: props.name.firstName,    // snake_case for database
      last_name: props.name.lastName,      // snake_case for database
      phone: props.phone,
      status: props.status,
      role_id: props.roleId,               // snake_case for database
      email_verified: props.emailVerified, // snake_case for database
      email_verification_token: props.emailVerificationToken,
      email_verification_expires: props.emailVerificationExpires,
      password_reset_token: props.passwordResetToken,
      password_reset_expires: props.passwordResetExpires,
      last_login: props.lastLogin,         // snake_case for database
      failed_login_attempts: props.failedLoginAttempts, // snake_case for database
      locked_until: props.lockedUntil,     // snake_case for database
      metadata: props.metadata,
      created_at: props.createdAt,         // snake_case for database
      updated_at: props.updatedAt,         // snake_case for database
    };
  }
}

@injectable()
export class ManufacturingOrderMapper {
  public toResponseDTO(
    order: import('@domain/entities/ManufacturingOrder').ManufacturingOrder,
    product?: import('@domain/entities/Product').Product,
    bom?: any,
    creator?: User,
    assignee?: User
  ): import('@application/dtos/ManufacturingOrderDTOs').ManufacturingOrderResponseDTO {
    return {
      id: order.id,
      moNumber: order.moNumber,
      productId: order.productId,
      productSku: product?.sku ?? '',
      productName: product?.name ?? '',
      bomId: order.bomId,
      bomVersion: bom?.version ?? '',
      quantity: order.quantity.value,
      quantityUnit: order.quantity.unit,
      status: order.status,
      priority: order.priority,
      plannedStartDate: order.plannedStartDate,
      plannedEndDate: order.plannedEndDate,
      actualStartDate: order.actualStartDate,
      actualEndDate: order.actualEndDate,
      createdBy: order.createdBy,
      createdByName: creator?.name.fullName ?? '',
      assignedTo: order.assignedTo,
      assignedToName: assignee?.name.fullName,
      notes: order.notes,
      metadata: order.metadata,
      progress: 0, // Will be calculated based on work orders
      isOverdue: order.isOverdue(),
      estimatedDuration: order.getPlannedDuration() || undefined,
      actualDuration: order.getDuration() || undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  public toListResponseDTO(
    paginatedOrders: PaginatedResult<import('@domain/entities/ManufacturingOrder').ManufacturingOrder>,
    additionalData?: {
      products?: Map<string, import('@domain/entities/Product').Product>;
      boms?: Map<string, any>;
      users?: Map<string, User>;
    }
  ): import('@application/dtos/ManufacturingOrderDTOs').ManufacturingOrderListResponseDTO {
    const orders = paginatedOrders.data.map(order => {
      const product = additionalData?.products?.get(order.productId);
      const bom = additionalData?.boms?.get(order.bomId);
      const creator = additionalData?.users?.get(order.createdBy);
      const assignee = order.assignedTo ? additionalData?.users?.get(order.assignedTo) : undefined;

      return this.toResponseDTO(order, product, bom, creator, assignee);
    });

    return {
      orders,
      total: paginatedOrders.total,
      page: paginatedOrders.page,
      limit: paginatedOrders.limit,
      totalPages: paginatedOrders.totalPages,
    };
  }

  public static toDomainEntity(dto: {
    id: string;
    moNumber: string;
    productId: string;
    bomId: string;
    quantity: number;
    quantityUnit: string;
    status: string;
    priority: string;
    plannedStartDate?: Date;
    plannedEndDate?: Date;
    actualStartDate?: Date;
    actualEndDate?: Date;
    createdBy: string;
    assignedTo?: string;
    notes?: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  }): import('@domain/entities/ManufacturingOrder').ManufacturingOrder {
    const { ManufacturingOrder } = require('@domain/entities/ManufacturingOrder');
    return ManufacturingOrder.fromPersistence({
      id: dto.id,
      moNumber: dto.moNumber,
      productId: dto.productId,
      bomId: dto.bomId,
      quantity: { value: dto.quantity, unit: dto.quantityUnit } as any,
      status: dto.status as any,
      priority: dto.priority as any,
      plannedStartDate: dto.plannedStartDate,
      plannedEndDate: dto.plannedEndDate,
      actualStartDate: dto.actualStartDate,
      actualEndDate: dto.actualEndDate,
      createdBy: dto.createdBy,
      assignedTo: dto.assignedTo,
      notes: dto.notes,
      metadata: dto.metadata,
      createdAt: dto.createdAt,
      updatedAt: dto.updatedAt,
    });
  }

  public toPersistenceData(order: import('@domain/entities/ManufacturingOrder').ManufacturingOrder): {
    id: string;
    moNumber: string;
    productId: string;
    bomId: string;
    quantity: number;
    quantityUnit: string;
    status: string;
    priority: string;
    plannedStartDate?: Date;
    plannedEndDate?: Date;
    actualStartDate?: Date;
    actualEndDate?: Date;
    createdBy: string;
    assignedTo?: string;
    notes?: string;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
  } {
    const props = order.toPersistence();
    
    return {
      id: props.id,
      moNumber: props.moNumber,
      productId: props.productId,
      bomId: props.bomId,
      quantity: props.quantity.value,
      quantityUnit: props.quantity.unit,
      status: props.status,
      priority: props.priority,
      plannedStartDate: props.plannedStartDate,
      plannedEndDate: props.plannedEndDate,
      actualStartDate: props.actualStartDate,
      actualEndDate: props.actualEndDate,
      createdBy: props.createdBy,
      assignedTo: props.assignedTo,
      notes: props.notes,
      metadata: props.metadata,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
