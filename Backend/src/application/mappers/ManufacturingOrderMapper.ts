import { ManufacturingOrder } from '@domain/entities/ManufacturingOrder';
import {
  ManufacturingOrderResponseDTO
} from '@application/dtos/ManufacturingOrderDTOs';
import { Quantity } from '@domain/value-objects/Money';
import { ManufacturingOrderStatus, PriorityLevel } from '@/types/common';

export class ManufacturingOrderMapper {
  public static toResponseDTO(order: ManufacturingOrder): ManufacturingOrderResponseDTO {
    return {
      id: order.id,
      moNumber: order.moNumber,
      productId: order.productId,
      productSku: 'UNKNOWN', // TODO: Get from product
      productName: 'UNKNOWN', // TODO: Get from product
      bomId: order.bomId,
      bomVersion: 'v1.0', // TODO: Get from BOM
      quantity: order.quantity.value,
      quantityUnit: order.quantityUnit,
      status: order.status,
      priority: order.priority,
      plannedStartDate: order.plannedStartDate,
      plannedEndDate: order.plannedEndDate,
      actualStartDate: order.actualStartDate,
      actualEndDate: order.actualEndDate,
      createdBy: order.createdBy,
      createdByName: 'UNKNOWN', // TODO: Get from user
      assignedTo: order.assignedTo,
      assignedToName: undefined, // TODO: Get from user
      notes: order.notes,
      metadata: order.metadata,
      progress: 0, // TODO: Calculate progress
      isOverdue: false, // TODO: Calculate if overdue
      estimatedDuration: order.getPlannedDuration() || undefined,
      actualDuration: order.getDuration() || undefined,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  public static toDomain(dto: any): ManufacturingOrder {
    return ManufacturingOrder.fromPersistence({
      id: dto.id,
      moNumber: dto.moNumber || dto.mo_number,
      productId: dto.productId || dto.product_id,
      bomId: dto.bomId || dto.bom_id,
      quantity: new Quantity(dto.quantity, dto.quantityUnit || dto.quantity_unit),
      status: dto.status as ManufacturingOrderStatus,
      priority: dto.priority as PriorityLevel,
      plannedStartDate: dto.plannedStartDate || dto.planned_start_date,
      plannedEndDate: dto.plannedEndDate || dto.planned_end_date,
      actualStartDate: dto.actualStartDate || dto.actual_start_date,
      actualEndDate: dto.actualEndDate || dto.actual_end_date,
      assignedTo: dto.assignedTo || dto.assigned_to,
      createdBy: dto.createdBy || dto.created_by,
      notes: dto.notes,
      metadata: dto.metadata ? (typeof dto.metadata === 'string' ? JSON.parse(dto.metadata) : dto.metadata) : undefined,
      createdAt: dto.createdAt || dto.created_at,
      updatedAt: dto.updatedAt || dto.updated_at,
    });
  }

  public static toPersistence(order: ManufacturingOrder): Record<string, any> {
    return {
      id: order.id,
      mo_number: order.moNumber,
      product_id: order.productId,
      bom_id: order.bomId,
      quantity: order.quantity.value,
      quantity_unit: order.quantityUnit,
      status: order.status,
      priority: order.priority,
      planned_start_date: order.plannedStartDate,
      planned_end_date: order.plannedEndDate,
      actual_start_date: order.actualStartDate,
      actual_end_date: order.actualEndDate,
      assigned_to: order.assignedTo,
      created_by: order.createdBy,
      notes: order.notes,
      metadata: order.metadata ? JSON.stringify(order.metadata) : null,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
    };
  }

  public static toListDTO(orders: ManufacturingOrder[]): ManufacturingOrderResponseDTO[] {
    return orders.map(order => this.toResponseDTO(order));
  }
}
