export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "manager" | "operator" | "inventory"
}

export interface ManufacturingOrder {
  id: string
  productName: string
  quantity: number
  status: "planned" | "in-progress" | "completed" | "cancelled"
  startDate: string
  dueDate: string
  assignee: string
  bomId: string
  workOrders: WorkOrder[]
  createdAt: string
  updatedAt: string
}

export interface WorkOrder {
  id: string
  manufacturingOrderId: string
  operation: string
  workCenter: string
  duration: number // in minutes
  status: "pending" | "in-progress" | "paused" | "completed"
  assignee: string
  startTime?: string
  endTime?: string
  comments?: string
}

export interface WorkCenter {
  id: string
  name: string
  description: string
  costPerHour: number
  capacity: number
  status: "active" | "maintenance" | "inactive"
  utilization: number
}

export interface Product {
  id: string
  name: string
  description: string
  unit: string
  currentStock: number
  minStock: number
  maxStock: number
  unitCost: number
  category: "raw-material" | "finished-good" | "component"
}

export interface BOM {
  id: string
  productId: string
  productName: string
  version: string
  components: BOMComponent[]
  operations: BOMOperation[]
  isActive: boolean
}

export interface BOMComponent {
  id: string
  productId: string
  productName: string
  quantity: number
  unit: string
}

export interface BOMOperation {
  id: string
  operation: string
  workCenter: string
  duration: number
  sequence: number
}

export interface StockMovement {
  id: string
  productId: string
  productName: string
  type: "in" | "out"
  quantity: number
  reference: string
  referenceType: "manufacturing-order" | "purchase" | "adjustment"
  timestamp: string
  notes?: string
}
