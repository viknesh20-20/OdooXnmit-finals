// Type constants for dropdown options
export const USER_ROLES = ['admin', 'manager', 'operator', 'inventory'] as const
export const ORDER_STATUS = ['planned', 'in-progress', 'completed', 'cancelled'] as const
export const WORK_ORDER_STATUS = ['pending', 'in-progress', 'paused', 'completed'] as const
export const WORK_CENTER_STATUS = ['active', 'maintenance', 'inactive'] as const
export const PRODUCT_CATEGORY = ['raw-material', 'finished-good', 'component'] as const
export const STOCK_MOVEMENT_TYPE = ['in', 'out'] as const
export const MOVEMENT_REFERENCE_TYPE = ['manufacturing-order', 'purchase', 'adjustment', 'transfer'] as const
export const PRIORITY_LEVELS = ['low', 'medium', 'high', 'urgent'] as const

// Type definitions from constants
export type UserRole = typeof USER_ROLES[number]
export type OrderStatus = typeof ORDER_STATUS[number]
export type WorkOrderStatus = typeof WORK_ORDER_STATUS[number]
export type WorkCenterStatus = typeof WORK_CENTER_STATUS[number]
export type ProductCategory = typeof PRODUCT_CATEGORY[number]
export type StockMovementType = typeof STOCK_MOVEMENT_TYPE[number]
export type MovementReferenceType = typeof MOVEMENT_REFERENCE_TYPE[number]
export type PriorityLevel = typeof PRIORITY_LEVELS[number]

// Main Interfaces
export interface User {
  id: string
  email: string
  name: string
  firstName: string
  lastName: string
  phone?: string
  role: UserRole
  department?: string
  avatar?: string
  isActive: boolean
  lastLogin?: string
  permissions?: string[]
  createdAt: string
  updatedAt: string
}

export interface ManufacturingOrder {
  id: string
  reference?: string
  productId?: string
  productName: string
  quantity: number
  status: OrderStatus
  priority?: PriorityLevel
  startDate: string
  dueDate: string
  actualStartDate?: string
  actualEndDate?: string
  assigneeId?: string
  assigneeName?: string
  assignee?: string // Keep for backward compatibility
  bomId: string
  bomName?: string
  workCenterId?: string
  workCenterName?: string
  workOrders: WorkOrder[]
  totalDuration?: number
  completedQuantity?: number
  scrapQuantity?: number
  progress?: number
  notes?: string
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface WorkOrder {
  id: string
  reference?: string
  manufacturingOrderId: string
  manufacturingOrderRef?: string
  operation: string
  operationType?: string
  workCenterId?: string
  workCenterName?: string
  workCenter?: string // Keep for backward compatibility
  duration: number // in minutes
  estimatedDuration?: number
  actualDuration?: number
  status: WorkOrderStatus
  priority?: PriorityLevel
  assigneeId?: string
  assigneeName?: string
  assignee: string // Keep for backward compatibility
  sequence?: number
  startTime?: string
  endTime?: string
  pauseTime?: number
  dependencies?: string[]
  instructions?: string
  comments?: string
  qualityChecks?: QualityCheck[]
  timeEntries?: TimeEntry[]
  createdAt?: string
  updatedAt?: string
}

export interface WorkCenter {
  id: string
  name: string
  code?: string
  description: string
  location?: string
  costPerHour: number
  capacity: number
  efficiency?: number
  status: WorkCenterStatus
  utilization: number
  availability?: number
  maintenanceSchedule?: string
  nextMaintenance?: string
  operatorIds?: string[]
  operatorNames?: string[]
  capabilities?: string[]
  workingHours?: WorkingHours
  oeeScore?: number // Overall Equipment Effectiveness
  downtimeHours?: number
  productiveHours?: number
  createdAt?: string
  updatedAt?: string
}

export interface Product {
  id: string
  name: string
  code?: string
  description: string
  unit: string
  currentStock: number
  availableStock?: number
  reservedStock?: number
  minStock: number
  maxStock: number
  reorderPoint?: number
  unitCost: number
  sellingPrice?: number
  category: ProductCategory
  location?: string
  barcode?: string
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  supplier?: string
  leadTime?: number
  isActive?: boolean
  imageUrl?: string
  createdAt?: string
  updatedAt?: string
}

export interface BOM {
  id: string
  reference?: string
  productId: string
  productName: string
  version: string
  revision?: number
  quantity?: number // quantity this BOM produces
  components: BOMComponent[]
  operations: BOMOperation[]
  totalCost?: number
  estimatedTime?: number
  isActive: boolean
  isDefault?: boolean
  validFrom?: string
  validTo?: string
  notes?: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface BOMComponent {
  id: string
  bomId?: string
  productId: string
  productName: string
  productCode?: string
  quantity: number
  unit: string
  wastagePercentage?: number
  actualQuantity?: number
  unitCost?: number
  totalCost?: number
  isOptional?: boolean
  sequence?: number
  notes?: string
}

export interface BOMOperation {
  id: string
  bomId?: string
  operation: string
  operationType?: string
  workCenterId?: string
  workCenterName?: string
  workCenter?: string // Keep for backward compatibility
  duration: number
  setupTime?: number
  teardownTime?: number
  costPerHour?: number
  totalCost?: number
  sequence: number
  description?: string
  instructions?: string
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  productCode?: string
  type: StockMovementType
  quantity: number
  unit?: string
  unitCost?: number
  totalValue?: number
  reference: string
  referenceType: MovementReferenceType
  fromLocation?: string
  toLocation?: string
  timestamp: string
  processedBy?: string
  processedByName?: string
  notes?: string
  batchNumber?: string
  expiryDate?: string
}

// Additional Supporting Interfaces
export interface QualityCheck {
  id: string
  workOrderId: string
  checkType: string
  parameter: string
  expectedValue: string
  actualValue: string
  status: 'pass' | 'fail' | 'pending'
  checkedBy: string
  checkedAt: string
  notes?: string
}

export interface TimeEntry {
  id: string
  workOrderId: string
  operatorId: string
  operatorName: string
  startTime: string
  endTime?: string
  duration: number
  activityType: 'productive' | 'setup' | 'waiting' | 'break'
  description?: string
}

export interface WorkingHours {
  monday: { start: string; end: string; isWorking: boolean }
  tuesday: { start: string; end: string; isWorking: boolean }
  wednesday: { start: string; end: string; isWorking: boolean }
  thursday: { start: string; end: string; isWorking: boolean }
  friday: { start: string; end: string; isWorking: boolean }
  saturday: { start: string; end: string; isWorking: boolean }
  sunday: { start: string; end: string; isWorking: boolean }
}

// Dashboard and Analytics Interfaces
export interface DashboardKPI {
  id: string
  title: string
  value: number
  unit: string
  change: number
  changeType: 'increase' | 'decrease'
  trend: number[]
  color: string
}

export interface ProductionReport {
  id: string
  period: string
  ordersPlanned: number
  ordersCompleted: number
  ordersDelayed: number
  totalQuantityProduced: number
  totalQuantityPlanned: number
  averageCompletionTime: number
  efficiencyRate: number
  utilizationRate: number
}

// Form and API Interfaces
export interface CreateManufacturingOrderForm {
  productId: string
  quantity: number
  priority: PriorityLevel
  dueDate: string
  assigneeId: string
  bomId: string
  workCenterId?: string
  notes?: string
}

export interface CreateWorkOrderForm {
  manufacturingOrderId: string
  operation: string
  operationType: string
  workCenterId: string
  estimatedDuration: number
  assigneeId: string
  sequence: number
  instructions?: string
}

export interface CreateProductForm {
  name: string
  code: string
  description: string
  unit: string
  category: ProductCategory
  minStock: number
  maxStock: number
  reorderPoint: number
  unitCost: number
  sellingPrice: number
  location: string
  supplier?: string
  leadTime: number
}

export interface CreateBOMForm {
  productId: string
  version: string
  quantity: number
  components: Omit<BOMComponent, 'id' | 'bomId'>[]
  operations: Omit<BOMOperation, 'id' | 'bomId'>[]
  notes?: string
}

// Dropdown Option Interface
export interface DropdownOption {
  value: string
  label: string
  disabled?: boolean
  extra?: any
}

// API Response Interfaces
export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// Filter and Search Interfaces
export interface ManufacturingOrderFilters {
  status?: string[]
  priority?: string[]
  assigneeId?: string
  dateFrom?: string
  dateTo?: string
  productId?: string
  search?: string
}

export interface WorkOrderFilters {
  status?: string[]
  workCenterId?: string
  assigneeId?: string
  manufacturingOrderId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}
