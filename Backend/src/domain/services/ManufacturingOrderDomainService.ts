import { UUID } from '@/types/common';
import { ManufacturingOrder } from '@domain/entities/ManufacturingOrder';
import { Product } from '@domain/entities/Product';
import { BusinessRuleViolationError, InsufficientStockError } from '@domain/exceptions/DomainException';
import { Quantity } from '@domain/value-objects/Money';

export interface BOMComponent {
  readonly componentId: UUID;
  readonly quantity: Quantity;
  readonly scrapFactor: number;
}

export interface StockAvailability {
  readonly productId: UUID;
  readonly availableQuantity: Quantity;
  readonly reservedQuantity: Quantity;
}

export interface MaterialRequirement {
  readonly componentId: UUID;
  readonly requiredQuantity: Quantity;
  readonly availableQuantity: Quantity;
  readonly shortfall: Quantity | null;
}

export class ManufacturingOrderDomainService {
  /**
   * Validates if a manufacturing order can be created for the given product and quantity
   */
  public validateManufacturingOrderCreation(
    product: Product,
    quantity: Quantity,
    bomComponents: BOMComponent[]
  ): void {
    // Validate product is active
    if (!product.isActive) {
      throw new BusinessRuleViolationError(`Cannot create manufacturing order for inactive product: ${product.sku}`);
    }

    // Validate product type
    if (product.isRawMaterial()) {
      throw new BusinessRuleViolationError(`Cannot create manufacturing order for raw material: ${product.sku}`);
    }

    // Validate quantity
    if (quantity.isZero() || quantity.value <= 0) {
      throw new BusinessRuleViolationError('Manufacturing order quantity must be greater than zero');
    }

    // Validate BOM exists and has components
    if (bomComponents.length === 0) {
      throw new BusinessRuleViolationError(`No BOM components found for product: ${product.sku}`);
    }
  }

  /**
   * Calculates material requirements for a manufacturing order
   */
  public calculateMaterialRequirements(
    orderQuantity: Quantity,
    bomComponents: BOMComponent[]
  ): MaterialRequirement[] {
    return bomComponents.map(component => {
      // Calculate required quantity including scrap factor
      const baseRequirement = component.quantity.multiply(orderQuantity.value);
      const scrapQuantity = baseRequirement.multiply(component.scrapFactor);
      const totalRequired = baseRequirement.add(scrapQuantity);

      return {
        componentId: component.componentId,
        requiredQuantity: totalRequired,
        availableQuantity: Quantity.zero(component.quantity.unit), // Will be filled by application service
        shortfall: null, // Will be calculated after availability check
      };
    });
  }

  /**
   * Validates material availability for manufacturing order confirmation
   */
  public validateMaterialAvailability(
    materialRequirements: MaterialRequirement[],
    stockAvailability: StockAvailability[]
  ): MaterialRequirement[] {
    const availabilityMap = new Map(
      stockAvailability.map(stock => [stock.productId, stock])
    );

    return materialRequirements.map(requirement => {
      const availability = availabilityMap.get(requirement.componentId);
      
      if (!availability) {
        throw new BusinessRuleViolationError(
          `No stock information available for component: ${requirement.componentId}`
        );
      }

      // Calculate net available (total - reserved)
      const netAvailable = availability.availableQuantity.subtract(availability.reservedQuantity);
      
      // Check if sufficient stock is available
      const shortfall = requirement.requiredQuantity.isGreaterThan(netAvailable)
        ? requirement.requiredQuantity.subtract(netAvailable)
        : null;

      return {
        ...requirement,
        availableQuantity: netAvailable,
        shortfall,
      };
    });
  }

  /**
   * Validates if a manufacturing order can be confirmed
   */
  public validateManufacturingOrderConfirmation(
    manufacturingOrder: ManufacturingOrder,
    materialRequirements: MaterialRequirement[]
  ): void {
    // Check if order can be confirmed
    if (!manufacturingOrder.canBeConfirmed()) {
      throw new BusinessRuleViolationError(
        `Manufacturing order ${manufacturingOrder.moNumber} cannot be confirmed in current status: ${manufacturingOrder.status}`
      );
    }

    // Check for material shortfalls
    const shortfalls = materialRequirements.filter(req => req.shortfall !== null);
    if (shortfalls.length > 0) {
      const shortfallDetails = shortfalls.map(req => ({
        componentId: req.componentId,
        required: req.requiredQuantity.value,
        available: req.availableQuantity.value,
        shortfall: req.shortfall!.value,
        unit: req.requiredQuantity.unit,
      }));

      throw new InsufficientStockError(
        'Multiple components',
        shortfallDetails.reduce((sum, s) => sum + s.shortfall, 0),
        shortfallDetails.reduce((sum, s) => sum + s.available, 0)
      );
    }
  }

  /**
   * Validates if a manufacturing order can be started
   */
  public validateManufacturingOrderStart(manufacturingOrder: ManufacturingOrder): void {
    if (!manufacturingOrder.canBeStarted()) {
      throw new BusinessRuleViolationError(
        `Manufacturing order ${manufacturingOrder.moNumber} cannot be started in current status: ${manufacturingOrder.status}`
      );
    }

    // Additional business rules for starting
    if (!manufacturingOrder.assignedTo) {
      throw new BusinessRuleViolationError(
        `Manufacturing order ${manufacturingOrder.moNumber} must be assigned to a user before starting`
      );
    }
  }

  /**
   * Validates if a manufacturing order can be completed
   */
  public validateManufacturingOrderCompletion(
    manufacturingOrder: ManufacturingOrder,
    workOrdersCompleted: boolean
  ): void {
    if (!manufacturingOrder.canBeCompleted()) {
      throw new BusinessRuleViolationError(
        `Manufacturing order ${manufacturingOrder.moNumber} cannot be completed in current status: ${manufacturingOrder.status}`
      );
    }

    if (!workOrdersCompleted) {
      throw new BusinessRuleViolationError(
        `All work orders must be completed before completing manufacturing order ${manufacturingOrder.moNumber}`
      );
    }
  }

  /**
   * Calculates the priority score for scheduling
   */
  public calculatePriorityScore(manufacturingOrder: ManufacturingOrder): number {
    let score = 0;

    // Base priority score
    switch (manufacturingOrder.priority) {
      case 'urgent':
        score += 100;
        break;
      case 'high':
        score += 75;
        break;
      case 'normal':
        score += 50;
        break;
      case 'low':
        score += 25;
        break;
    }

    // Add urgency based on planned dates
    if (manufacturingOrder.plannedEndDate) {
      const now = new Date();
      const daysUntilDue = Math.ceil(
        (manufacturingOrder.plannedEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilDue < 0) {
        // Overdue - highest priority
        score += 200;
      } else if (daysUntilDue <= 1) {
        // Due today or tomorrow
        score += 50;
      } else if (daysUntilDue <= 3) {
        // Due within 3 days
        score += 25;
      } else if (daysUntilDue <= 7) {
        // Due within a week
        score += 10;
      }
    }

    // Add score based on order age
    const ageInDays = Math.ceil(
      (new Date().getTime() - manufacturingOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (ageInDays > 7) {
      score += Math.min(ageInDays - 7, 30); // Cap at 30 points for age
    }

    return score;
  }

  /**
   * Validates business rules for manufacturing order cancellation
   */
  public validateManufacturingOrderCancellation(manufacturingOrder: ManufacturingOrder): void {
    if (!manufacturingOrder.canBeCancelled()) {
      throw new BusinessRuleViolationError(
        `Manufacturing order ${manufacturingOrder.moNumber} cannot be cancelled in current status: ${manufacturingOrder.status}`
      );
    }

    // Additional business rules can be added here
    // For example, checking if materials have already been consumed
  }

  /**
   * Determines if a manufacturing order should be automatically prioritized
   */
  public shouldAutoPrioritize(manufacturingOrder: ManufacturingOrder): boolean {
    // Auto-prioritize if overdue
    if (manufacturingOrder.isOverdue()) {
      return true;
    }

    // Auto-prioritize if due within 24 hours
    if (manufacturingOrder.plannedEndDate) {
      const hoursUntilDue = (manufacturingOrder.plannedEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
      return hoursUntilDue <= 24;
    }

    return false;
  }

  /**
   * Calculates estimated completion time based on BOM operations
   */
  public calculateEstimatedDuration(
    orderQuantity: Quantity,
    bomOperations: Array<{
      setupTimeMinutes: number;
      runTimeMinutes: number;
      workCenterEfficiency: number;
    }>
  ): number {
    return bomOperations.reduce((totalMinutes, operation) => {
      const setupTime = operation.setupTimeMinutes;
      const runTime = operation.runTimeMinutes * orderQuantity.value;
      const adjustedTime = (setupTime + runTime) / operation.workCenterEfficiency;
      return totalMinutes + adjustedTime;
    }, 0);
  }
}
