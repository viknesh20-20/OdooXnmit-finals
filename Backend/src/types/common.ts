// Common types used across the application

export type UUID = string;

export type Timestamp = Date;

export interface BaseEntity {
  readonly id: UUID;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface AuditableEntity extends BaseEntity {
  readonly createdBy?: UUID;
  readonly updatedBy?: UUID;
}

// Enums
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

export enum ManufacturingOrderStatus {
  DRAFT = 'draft',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum WorkOrderStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum StockTransactionType {
  IN = 'in',
  OUT = 'out',
  TRANSFER = 'transfer',
  ADJUSTMENT = 'adjustment',
}

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum ProductType {
  RAW_MATERIAL = 'raw_material',
  MANUFACTURED = 'manufactured',
  FINISHED_GOOD = 'finished_good',
}

export enum UnitType {
  WEIGHT = 'weight',
  VOLUME = 'volume',
  LENGTH = 'length',
  COUNT = 'count',
  TIME = 'time',
  AREA = 'area',
}

export enum QualityStatus {
  PENDING = 'pending',
  PASSED = 'passed',
  FAILED = 'failed',
  REWORK = 'rework',
}

// Value Objects
export interface Money {
  readonly amount: number;
  readonly currency: string;
}

export interface Quantity {
  readonly value: number;
  readonly unit: string;
}

export interface TimeRange {
  readonly start: Timestamp;
  readonly end: Timestamp;
}

export interface Pagination {
  readonly page: number;
  readonly limit: number;
  readonly offset: number;
}

export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

// Error types
export interface DomainError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
}

// Repository interfaces
export interface Repository<T extends BaseEntity> {
  findById(id: UUID): Promise<T | null>;
  findAll(pagination?: Pagination): Promise<PaginatedResult<T>>;
  save(entity: T): Promise<T>;
  delete(id: UUID): Promise<void>;
}

// Event types
export interface DomainEvent {
  readonly eventId: UUID;
  readonly eventType: string;
  readonly aggregateId: UUID;
  readonly aggregateType: string;
  readonly eventData: Record<string, unknown>;
  readonly occurredAt: Timestamp;
  readonly version: number;
}

export interface EventHandler<T extends DomainEvent> {
  handle(event: T): Promise<void>;
}

// Configuration types
export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly username: string;
  readonly password: string;
  readonly dialect: 'postgres';
  readonly logging: boolean;
  readonly pool: {
    readonly max: number;
    readonly min: number;
    readonly acquire: number;
    readonly idle: number;
  };
}

export interface JWTConfig {
  readonly secret: string;
  readonly refreshSecret: string;
  readonly expiresIn: string;
  readonly refreshExpiresIn: string;
}

export interface EmailConfig {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly user: string;
  readonly password: string;
  readonly from: string;
}

export interface SecurityConfig {
  readonly bcryptSaltRounds: number;
  readonly rateLimitWindowMs: number;
  readonly rateLimitMaxRequests: number;
  readonly maxFileSize: number;
}

export interface AppConfig {
  readonly nodeEnv: string;
  readonly port: number;
  readonly host: string;
  readonly frontendUrl: string;
  readonly backendUrl: string;
  readonly database: DatabaseConfig;
  readonly jwt: JWTConfig;
  readonly email: EmailConfig;
  readonly security: SecurityConfig;
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// Result pattern for error handling
export type Result<T, E = DomainError> = Success<T> | Failure<E>;

export interface Success<T> {
  readonly success: true;
  readonly isSuccess: true;
  readonly value: T;
}

export interface Failure<E> {
  readonly success: false;
  readonly isSuccess: false;
  readonly error: E;
}

// Result factory functions
export const success = <T>(value: T): Success<T> => ({ success: true, isSuccess: true, value });
export const failure = <E>(error: E): Failure<E> => ({ success: false, isSuccess: false, error });

// Type guards
export const isSuccess = <T, E>(result: Result<T, E>): result is Success<T> => result.success;
export const isFailure = <T, E>(result: Result<T, E>): result is Failure<E> => !result.success;
