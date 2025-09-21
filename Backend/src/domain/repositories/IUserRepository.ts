import { UUID, Repository, PaginatedResult, Pagination } from '@/types/common';
import { User } from '@domain/entities/User';
import { Email, Username } from '@domain/value-objects/Email';

export interface UserFilters {
  readonly status?: string;
  readonly roleId?: UUID;
  readonly emailVerified?: boolean;
  readonly search?: string;
}

export interface Role {
  id: UUID;
  name: string;
  description?: string;
  permissions?: Record<string, unknown>;
}

export interface IUserRepository extends Repository<User> {
  findByEmail(email: Email): Promise<User | null>;
  findByUsername(username: Username): Promise<User | null>;
  findByEmailVerificationToken(token: string): Promise<User | null>;
  findByPasswordResetToken(token: string): Promise<User | null>;
  findWithFilters(filters: UserFilters, pagination?: Pagination): Promise<PaginatedResult<User>>;
  existsByEmail(email: Email): Promise<boolean>;
  existsByUsername(username: Username): Promise<boolean>;
  findByRoleId(roleId: UUID, pagination?: Pagination): Promise<PaginatedResult<User>>;
  findRoleByName(name: string): Promise<Role | null>;
  findRoleById(id: UUID): Promise<Role | null>;
}

export interface ProductFilters {
  categoryId?: UUID;
  isActive?: boolean;
  search?: string;
  minStockLevel?: number;
  maxStockLevel?: number;
}

export interface IProductRepository extends Repository<import('@domain/entities/Product').Product> {
  findBySku(sku: string): Promise<import('@domain/entities/Product').Product | null>;
  findByType(type: string, pagination?: Pagination): Promise<PaginatedResult<import('@domain/entities/Product').Product>>;
  findActiveProducts(pagination?: Pagination): Promise<PaginatedResult<import('@domain/entities/Product').Product>>;
  findByCategoryId(categoryId: UUID, pagination?: Pagination): Promise<PaginatedResult<import('@domain/entities/Product').Product>>;
  findLowStockProducts(warehouseId?: UUID): Promise<import('@domain/entities/Product').Product[]>;
  existsBySku(sku: string): Promise<boolean>;
  search(query: string, pagination?: Pagination): Promise<PaginatedResult<import('@domain/entities/Product').Product>>;
}

export interface ManufacturingOrderFilters {
  readonly status?: string;
  readonly productId?: UUID;
  readonly createdBy?: UUID;
  readonly assignedTo?: UUID;
  readonly priority?: string;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly search?: string;
  readonly sortBy?: string;
  readonly sortOrder?: 'asc' | 'desc';
}

export interface IManufacturingOrderRepository extends Repository<import('@domain/entities/ManufacturingOrder').ManufacturingOrder> {
  findByMoNumber(moNumber: string): Promise<import('@domain/entities/ManufacturingOrder').ManufacturingOrder | null>;
  findByStatus(status: string, pagination?: Pagination): Promise<PaginatedResult<import('@domain/entities/ManufacturingOrder').ManufacturingOrder>>;
  findByProductId(productId: UUID, pagination?: Pagination): Promise<PaginatedResult<import('@domain/entities/ManufacturingOrder').ManufacturingOrder>>;
  findWithFilters(filters: ManufacturingOrderFilters, pagination?: Pagination): Promise<PaginatedResult<import('@domain/entities/ManufacturingOrder').ManufacturingOrder>>;
  findOverdueOrders(): Promise<import('@domain/entities/ManufacturingOrder').ManufacturingOrder[]>;
  generateMoNumber(): Promise<string>;
  existsByMoNumber(moNumber: string): Promise<boolean>;
}

export interface IRoleRepository extends Repository<import('@domain/entities/Role').Role> {
  findByName(name: string): Promise<import('@domain/entities/Role').Role | null>;
  findAllActive(): Promise<import('@domain/entities/Role').Role[]>;
  existsByName(name: string): Promise<boolean>;
}

export interface BOMFilters {
  productId?: UUID;
  isActive?: boolean;
  isDefault?: boolean;
  version?: string;
  createdBy?: UUID;
  search?: string;
}

export interface IBOMRepository extends Repository<import('@domain/entities/BOM').BOM> {
  findByProductId(productId: UUID): Promise<import('@domain/entities/BOM').BOM[]>;
  findActiveByProductId(productId: UUID): Promise<import('@domain/entities/BOM').BOM | null>;
  findWithComponents(bomId: UUID): Promise<import('@domain/entities/BOM').BOM | null>;
  findWithOperations(bomId: UUID): Promise<import('@domain/entities/BOM').BOM | null>;
  findComplete(bomId: UUID): Promise<import('@domain/entities/BOM').BOM | null>;
}

// Simple WorkOrder interface for repository return type
export interface WorkOrder {
  id: string;
  woNumber?: string;
  manufacturingOrderId?: string;
  operation?: string;
  workCenterName?: string;
  status: string;
  assignedTo?: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkOrderRepository extends Repository<WorkOrder> {
  findByWoNumber(woNumber: string): Promise<WorkOrder | null>;
  findByManufacturingOrderId(moId: UUID): Promise<WorkOrder[]>;
  findByStatus(status: string, pagination?: Pagination): Promise<PaginatedResult<WorkOrder>>;
  findByWorkCenterId(workCenterId: UUID, pagination?: Pagination): Promise<PaginatedResult<WorkOrder>>;
  findByAssignedTo(userId: UUID, pagination?: Pagination): Promise<PaginatedResult<WorkOrder>>;
  generateWoNumber(): Promise<string>;
  existsByWoNumber(woNumber: string): Promise<boolean>;
}

export interface IStockLedgerRepository {
  findByProductId(productId: UUID, warehouseId?: UUID): Promise<import('@domain/entities/StockLedger').StockLedger[]>;
  findLatestByProduct(productId: UUID, warehouseId?: UUID): Promise<import('@domain/entities/StockLedger').StockLedger | null>;
  getCurrentStock(productId: UUID, warehouseId?: UUID): Promise<number>;
  recordTransaction(entry: import('@domain/entities/StockLedger').StockLedger): Promise<import('@domain/entities/StockLedger').StockLedger>;
  findTransactionHistory(
    productId: UUID,
    warehouseId?: UUID,
    startDate?: Date,
    endDate?: Date,
    pagination?: Pagination
  ): Promise<PaginatedResult<import('@domain/entities/StockLedger').StockLedger>>;
}

// Simple StockMovement interface for repository return type
export interface StockMovement {
  id: string;
  productId: string;
  productName?: string;
  type: 'in' | 'out';
  quantity: number;
  reference?: string;
  referenceType?: string;
  notes?: string;
  createdAt: string;
}

export interface IStockMovementRepository {
  findRecent(options?: { limit?: number; warehouseId?: UUID }): Promise<StockMovement[]>;
  findByProductId(productId: UUID, warehouseId?: UUID): Promise<StockMovement[]>;
  findByReference(referenceId: UUID, referenceType?: string): Promise<StockMovement[]>;
  findByDateRange(startDate: Date, endDate: Date, warehouseId?: UUID): Promise<StockMovement[]>;
}

export interface IMaterialReservationRepository extends Repository<import('@domain/entities/MaterialReservation').MaterialReservation> {
  findByManufacturingOrderId(moId: UUID): Promise<import('@domain/entities/MaterialReservation').MaterialReservation[]>;
  findByProductId(productId: UUID): Promise<import('@domain/entities/MaterialReservation').MaterialReservation[]>;
  findActiveReservations(productId?: UUID, warehouseId?: UUID): Promise<import('@domain/entities/MaterialReservation').MaterialReservation[]>;
  getTotalReservedQuantity(productId: UUID, warehouseId?: UUID): Promise<number>;
}

export interface IWarehouseRepository extends Repository<import('@domain/entities/Warehouse').Warehouse> {
  findByCode(code: string): Promise<import('@domain/entities/Warehouse').Warehouse | null>;
  findActiveWarehouses(): Promise<import('@domain/entities/Warehouse').Warehouse[]>;
  existsByCode(code: string): Promise<boolean>;
}

// Simple WorkCenter interface for repository return type
export interface WorkCenter {
  id: string;
  code: string;
  name: string;
  status: string;
  utilization: number;
  capacity: number;
  efficiency: number;
  oeeScore?: number;
  downtimeHours?: number;
  productiveHours?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IWorkCenterRepository extends Repository<WorkCenter> {
  findByCode(code: string): Promise<WorkCenter | null>;
  findActiveWorkCenters(): Promise<WorkCenter[]>;
  existsByCode(code: string): Promise<boolean>;
}

export interface IRefreshTokenRepository {
  findByTokenHash(tokenHash: string): Promise<import('@domain/entities/RefreshToken').RefreshToken | null>;
  findByToken(token: string): Promise<import('@domain/entities/RefreshToken').RefreshToken | null>;
  findByUserId(userId: UUID): Promise<import('@domain/entities/RefreshToken').RefreshToken[]>;
  save(token: import('@domain/entities/RefreshToken').RefreshToken): Promise<import('@domain/entities/RefreshToken').RefreshToken>;
  revokeAllUserTokens(userId: UUID): Promise<void>;
  revokeToken(tokenId: UUID): Promise<void>;
  cleanupExpiredTokens(): Promise<number>;
  delete(tokenId: UUID): Promise<void>;
}
