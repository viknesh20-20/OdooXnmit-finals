import { UUID, Timestamp, ManufacturingOrderStatus, PriorityLevel } from '@/types/common';

// Request DTOs
export interface CreateManufacturingOrderRequestDTO {
  readonly productId: UUID;
  readonly bomId: UUID;
  readonly quantity: number;
  readonly priority?: PriorityLevel;
  readonly plannedStartDate?: Timestamp;
  readonly plannedEndDate?: Timestamp;
  readonly assignedTo?: UUID;
  readonly notes?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface UpdateManufacturingOrderRequestDTO {
  readonly priority?: PriorityLevel;
  readonly plannedStartDate?: Timestamp;
  readonly plannedEndDate?: Timestamp;
  readonly assignedTo?: UUID;
  readonly notes?: string;
  readonly metadata?: Record<string, unknown>;
}

export interface ConfirmManufacturingOrderRequestDTO {
  readonly id: UUID;
}

export interface StartManufacturingOrderRequestDTO {
  readonly id: UUID;
}

export interface CompleteManufacturingOrderRequestDTO {
  readonly id: UUID;
  readonly actualQuantityProduced?: number;
  readonly warehouseId: UUID;
  readonly locationId?: UUID;
  readonly batchNumber?: string;
  readonly qualityNotes?: string;
}

export interface CancelManufacturingOrderRequestDTO {
  readonly id: UUID;
  readonly reason?: string;
}

// Response DTOs
export interface ManufacturingOrderResponseDTO {
  readonly id: UUID;
  readonly moNumber: string;
  readonly productId: UUID;
  readonly productSku: string;
  readonly productName: string;
  readonly bomId: UUID;
  readonly bomVersion: string;
  readonly quantity: number;
  readonly quantityUnit: string;
  readonly status: ManufacturingOrderStatus;
  readonly priority: PriorityLevel;
  readonly plannedStartDate?: Timestamp;
  readonly plannedEndDate?: Timestamp;
  readonly actualStartDate?: Timestamp;
  readonly actualEndDate?: Timestamp;
  readonly createdBy: UUID;
  readonly createdByName: string;
  readonly assignedTo?: UUID;
  readonly assignedToName?: string;
  readonly notes?: string;
  readonly metadata: Record<string, unknown>;
  readonly progress: number;
  readonly isOverdue: boolean;
  readonly estimatedDuration?: number;
  readonly actualDuration?: number;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface ManufacturingOrderDetailResponseDTO extends ManufacturingOrderResponseDTO {
  readonly workOrders: readonly WorkOrderSummaryDTO[];
  readonly materialReservations: readonly MaterialReservationDTO[];
  readonly qualityControls: readonly QualityControlSummaryDTO[];
  readonly costBreakdown: CostBreakdownDTO;
}

export interface WorkOrderSummaryDTO {
  readonly id: UUID;
  readonly woNumber: string;
  readonly operationName: string;
  readonly sequenceNumber: number;
  readonly workCenterId: UUID;
  readonly workCenterName: string;
  readonly status: string;
  readonly plannedDuration: number;
  readonly actualDuration?: number;
  readonly assignedTo?: UUID;
  readonly assignedToName?: string;
  readonly startedAt?: Timestamp;
  readonly completedAt?: Timestamp;
}

export interface MaterialReservationDTO {
  readonly id: UUID;
  readonly productId: UUID;
  readonly productSku: string;
  readonly productName: string;
  readonly warehouseId: UUID;
  readonly warehouseName: string;
  readonly locationId?: UUID;
  readonly locationName?: string;
  readonly reservedQuantity: number;
  readonly consumedQuantity: number;
  readonly quantityUnit: string;
  readonly unitCost: number;
  readonly batchNumber?: string;
  readonly expiryDate?: Date;
  readonly reservedAt: Timestamp;
}

export interface QualityControlSummaryDTO {
  readonly id: UUID;
  readonly inspectorId: UUID;
  readonly inspectorName: string;
  readonly status: string;
  readonly quantityInspected: number;
  readonly quantityPassed: number;
  readonly quantityFailed: number;
  readonly inspectionDate: Timestamp;
  readonly defectNotes?: string;
}

export interface CostBreakdownDTO {
  readonly materialCost: number;
  readonly laborCost: number;
  readonly overheadCost: number;
  readonly totalCost: number;
  readonly costPerUnit: number;
  readonly currency: string;
}

export interface ManufacturingOrderListResponseDTO {
  readonly orders: readonly ManufacturingOrderResponseDTO[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

// Query DTOs
export interface GetManufacturingOrdersQueryDTO {
  readonly page?: number;
  readonly limit?: number;
  readonly status?: ManufacturingOrderStatus;
  readonly productId?: UUID;
  readonly createdBy?: UUID;
  readonly assignedTo?: UUID;
  readonly priority?: PriorityLevel;
  readonly startDate?: Date;
  readonly endDate?: Date;
  readonly search?: string;
  readonly sortBy?: 'moNumber' | 'productName' | 'status' | 'priority' | 'plannedStartDate' | 'createdAt';
  readonly sortOrder?: 'asc' | 'desc';
}

export interface GetManufacturingOrderByIdQueryDTO {
  readonly id: UUID;
}

export interface GetManufacturingOrderByMoNumberQueryDTO {
  readonly moNumber: string;
}

export interface GetOverdueManufacturingOrdersQueryDTO {
  readonly page?: number;
  readonly limit?: number;
}

// Command DTOs
export interface CreateManufacturingOrderCommandDTO {
  readonly productId: UUID;
  readonly bomId: UUID;
  readonly quantity: number;
  readonly priority?: PriorityLevel;
  readonly plannedStartDate?: Timestamp;
  readonly plannedEndDate?: Timestamp;
  readonly assignedTo?: UUID;
  readonly notes?: string;
  readonly metadata?: Record<string, unknown>;
  readonly createdBy: UUID;
}

export interface UpdateManufacturingOrderCommandDTO {
  readonly id: UUID;
  readonly priority?: PriorityLevel;
  readonly plannedStartDate?: Timestamp;
  readonly plannedEndDate?: Timestamp;
  readonly assignedTo?: UUID;
  readonly notes?: string;
  readonly metadata?: Record<string, unknown>;
  readonly updatedBy: UUID;
}

export interface ConfirmManufacturingOrderCommandDTO {
  readonly id: UUID;
  readonly confirmedBy: UUID;
}

export interface StartManufacturingOrderCommandDTO {
  readonly id: UUID;
  readonly startedBy: UUID;
}

export interface CompleteManufacturingOrderCommandDTO {
  readonly id: UUID;
  readonly actualQuantityProduced?: number;
  readonly warehouseId: UUID;
  readonly locationId?: UUID;
  readonly batchNumber?: string;
  readonly qualityNotes?: string;
  readonly completedBy: UUID;
}

export interface CancelManufacturingOrderCommandDTO {
  readonly id: UUID;
  readonly reason?: string;
  readonly cancelledBy: UUID;
}

// Product DTOs
export interface ProductResponseDTO {
  readonly id: UUID;
  readonly sku: string;
  readonly name: string;
  readonly description?: string;
  readonly categoryId?: UUID;
  readonly categoryName?: string;
  readonly uomId: UUID;
  readonly uomName: string;
  readonly uomSymbol: string;
  readonly type: string;
  readonly costPrice: number;
  readonly sellingPrice: number;
  readonly minStockLevel: number;
  readonly maxStockLevel: number;
  readonly reorderPoint: number;
  readonly leadTimeDays: number;
  readonly isActive: boolean;
  readonly specifications: Record<string, unknown>;
  readonly attachments: readonly string[];
  readonly currentStock?: number;
  readonly reservedStock?: number;
  readonly availableStock?: number;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface CreateProductRequestDTO {
  readonly sku: string;
  readonly name: string;
  readonly description?: string;
  readonly categoryId?: UUID;
  readonly uomId: UUID;
  readonly type: string;
  readonly costPrice?: number;
  readonly sellingPrice?: number;
  readonly minStockLevel?: number;
  readonly maxStockLevel?: number;
  readonly reorderPoint?: number;
  readonly leadTimeDays?: number;
  readonly specifications?: Record<string, unknown>;
  readonly attachments?: string[];
}

export interface UpdateProductRequestDTO {
  readonly name?: string;
  readonly description?: string;
  readonly categoryId?: UUID;
  readonly costPrice?: number;
  readonly sellingPrice?: number;
  readonly minStockLevel?: number;
  readonly maxStockLevel?: number;
  readonly reorderPoint?: number;
  readonly leadTimeDays?: number;
  readonly specifications?: Record<string, unknown>;
}

export interface ProductListResponseDTO {
  readonly products: readonly ProductResponseDTO[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly totalPages: number;
}

export interface GetProductsQueryDTO {
  readonly page?: number;
  readonly limit?: number;
  readonly type?: string;
  readonly categoryId?: UUID;
  readonly isActive?: boolean;
  readonly search?: string;
  readonly sortBy?: 'sku' | 'name' | 'type' | 'createdAt';
  readonly sortOrder?: 'asc' | 'desc';
}
