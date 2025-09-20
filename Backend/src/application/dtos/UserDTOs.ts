import { UUID, Timestamp, UserStatus } from '@/types/common';

// Request DTOs
export interface CreateUserRequestDTO {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly roleId?: UUID;
  readonly metadata?: Record<string, unknown>;
}

export interface UpdateUserRequestDTO {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phone?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface ChangePasswordRequestDTO {
  readonly currentPassword: string;
  readonly newPassword: string;
}

export interface ResetPasswordRequestDTO {
  readonly email: string;
}

export interface ConfirmPasswordResetRequestDTO {
  readonly token: string;
  readonly newPassword: string;
}

export interface VerifyEmailRequestDTO {
  readonly token: string;
}

export interface LoginRequestDTO {
  readonly usernameOrEmail: string;
  readonly password: string;
}

export interface RefreshTokenRequestDTO {
  readonly refreshToken: string;
}

export interface AssignRoleRequestDTO {
  readonly roleId: UUID;
}

// Response DTOs
export interface UserResponseDTO {
  readonly id: UUID;
  readonly username: string;
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly fullName: string;
  readonly phone?: string;
  readonly status: UserStatus;
  readonly roleId?: UUID;
  readonly roleName?: string;
  readonly emailVerified: boolean;
  readonly lastLogin?: Timestamp;
  readonly metadata: Record<string, unknown>;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface AuthTokensResponseDTO {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number;
  readonly tokenType: 'Bearer';
}

export interface LoginResponseDTO {
  readonly user: UserResponseDTO;
  readonly tokens: AuthTokensResponseDTO;
}

export interface UserListResponseDTO {
  readonly users: readonly UserResponseDTO[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

// Query DTOs
export interface GetUsersQueryDTO {
  readonly page?: number;
  readonly limit?: number;
  readonly status?: UserStatus;
  readonly roleId?: UUID;
  readonly emailVerified?: boolean;
  readonly search?: string;
  readonly sortBy?: 'username' | 'email' | 'firstName' | 'lastName' | 'createdAt' | 'lastLogin';
  readonly sortOrder?: 'asc' | 'desc';
}

export interface GetUserByIdQueryDTO {
  readonly id: UUID;
}

export interface GetUserByEmailQueryDTO {
  readonly email: string;
}

export interface GetUserByUsernameQueryDTO {
  readonly username: string;
}

// Command DTOs
export interface CreateUserCommandDTO {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone?: string;
  readonly roleId?: UUID;
  readonly metadata?: Record<string, unknown>;
  readonly createdBy?: UUID;
}

export interface UpdateUserCommandDTO {
  readonly id: UUID;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly phone?: string;
  readonly metadata?: Record<string, unknown>;
  readonly updatedBy: UUID;
}

export interface ChangePasswordCommandDTO {
  readonly id: UUID;
  readonly currentPassword: string;
  readonly newPassword: string;
  readonly changedBy: UUID;
}

export interface ResetPasswordCommandDTO {
  readonly email: string;
}

export interface ConfirmPasswordResetCommandDTO {
  readonly token: string;
  readonly newPassword: string;
}

export interface VerifyEmailCommandDTO {
  readonly token: string;
}

export interface LoginCommandDTO {
  readonly usernameOrEmail: string;
  readonly password: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export interface RefreshTokenCommandDTO {
  readonly refreshToken: string;
  readonly ipAddress?: string;
  readonly userAgent?: string;
}

export interface LogoutCommandDTO {
  readonly userId: UUID;
  readonly refreshToken?: string;
}

export interface ActivateUserCommandDTO {
  readonly id: UUID;
  readonly activatedBy: UUID;
}

export interface DeactivateUserCommandDTO {
  readonly id: UUID;
  readonly deactivatedBy: UUID;
}

export interface SuspendUserCommandDTO {
  readonly id: UUID;
  readonly suspendedBy: UUID;
  readonly reason?: string;
}

export interface AssignRoleCommandDTO {
  readonly id: UUID;
  readonly roleId: UUID;
  readonly assignedBy: UUID;
}

// Role DTOs
export interface RoleResponseDTO {
  readonly id: UUID;
  readonly name: string;
  readonly description?: string;
  readonly permissions: Record<string, unknown>;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateRoleRequestDTO {
  readonly name: string;
  readonly description?: string;
  readonly permissions: Record<string, unknown>;
}

export interface UpdateRoleRequestDTO {
  readonly name?: string;
  readonly description?: string;
  readonly permissions?: Record<string, unknown>;
}

export interface RoleListResponseDTO {
  readonly roles: readonly RoleResponseDTO[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export interface GetRolesQueryDTO {
  readonly page?: number;
  readonly limit?: number;
  readonly search?: string;
  readonly sortBy?: 'name' | 'createdAt';
  readonly sortOrder?: 'asc' | 'desc';
}

export interface CreateRoleCommandDTO {
  readonly name: string;
  readonly description?: string;
  readonly permissions: Record<string, unknown>;
  readonly createdBy: UUID;
}

export interface UpdateRoleCommandDTO {
  readonly id: UUID;
  readonly name?: string;
  readonly description?: string;
  readonly permissions?: Record<string, unknown>;
  readonly updatedBy: UUID;
}

export interface DeleteRoleCommandDTO {
  readonly id: UUID;
  readonly deletedBy: UUID;
}
