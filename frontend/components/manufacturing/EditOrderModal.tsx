"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { ManufacturingOrder, BOM, User, CreateManufacturingOrderForm } from "@/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useManufacturingOrders } from "@/hooks/useManufacturingOrders"
import { useProducts } from "@/hooks/useProducts"
import { useBOMs } from "@/hooks/useBOMs"
import { useWorkCenters } from "@/hooks/useWorkCenters"
import { PRIORITY_LEVELS } from "@/types"

interface EditOrderModalProps {
  order: ManufacturingOrder | null
  isOpen: boolean
  onClose: () => void
  onOrderUpdated: (order: ManufacturingOrder) => void
}

// Mock users data - in real app this would come from a users API
const mockUsers: User[] = [
  {
    id: "1", email: "john.doe@manufacturing.com", name: "John Doe", firstName: "John", lastName: "Doe",
    role: "manager", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: "2", email: "jane.smith@manufacturing.com", name: "Jane Smith", firstName: "Jane", lastName: "Smith",
    role: "operator", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
  {
    id: "3", email: "mike.wilson@manufacturing.com", name: "Mike Wilson", firstName: "Mike", lastName: "Wilson",
    role: "manager", isActive: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  },
]

export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, isOpen, onClose, onOrderUpdated }) => {
  const { updateOrder } = useManufacturingOrders()
  const { products } = useProducts()
  const { boms } = useBOMs()
  const { workCenters } = useWorkCenters()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState<CreateManufacturingOrderForm>({
    productId: "",
    quantity: 1,
    priority: "medium",
    dueDate: "",
    assigneeId: "",
    bomId: "",
    workCenterId: "",
    notes: "",
  })

  const [filteredBOMs, setFilteredBOMs] = useState<BOM[]>([])

  // Initialize form data when order changes
  useEffect(() => {
    if (order) {
      setFormData({
        productId: order.productId || "",
        quantity: order.quantity,
        priority: order.priority || "medium",
        dueDate: order.dueDate ? new Date(order.dueDate).toISOString().slice(0, 16) : "",
        assigneeId: order.assigneeId || "",
        bomId: order.bomId || "",
        workCenterId: order.workCenterId || "",
        notes: order.notes || "",
      })
    }
  }, [order])

  // Filter BOMs based on selected product
  useEffect(() => {
    if (formData.productId) {
      const productBOMs = boms.filter(bom => bom.productId === formData.productId && bom.isActive)
      setFilteredBOMs(productBOMs)
    } else {
      setFilteredBOMs([])
    }
  }, [formData.productId, boms])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return
    
    setIsSubmitting(true)

    try {
      const selectedProduct = products.find(p => p.id === formData.productId)
      const selectedBOM = boms.find(b => b.id === formData.bomId)
      const selectedAssignee = mockUsers.find(u => u.id === formData.assigneeId)
      const selectedWorkCenter = workCenters.find(wc => wc.id === formData.workCenterId)

      const updatedOrder: ManufacturingOrder = {
        ...order,
        productId: formData.productId,
        productName: selectedProduct?.name || order.productName,
        quantity: formData.quantity,
        priority: formData.priority,
        dueDate: formData.dueDate,
        assigneeId: formData.assigneeId,
        assigneeName: selectedAssignee?.name || "",
        assignee: selectedAssignee?.name || "", // Backward compatibility
        bomId: formData.bomId,
        bomName: selectedBOM?.reference || selectedBOM?.productName || "",
        workCenterId: formData.workCenterId,
        workCenterName: selectedWorkCenter?.name || "",
        totalDuration: selectedBOM?.estimatedTime || order.totalDuration,
        notes: formData.notes,
        updatedAt: new Date().toISOString(),
      }

      await updateOrder(order.id, updatedOrder)
      onOrderUpdated(updatedOrder)
      onClose()
    } catch (error) {
      console.error("Error updating manufacturing order:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof CreateManufacturingOrderForm, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!order) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Manufacturing Order</DialogTitle>
          <DialogDescription>
            Update the details for manufacturing order {order.reference}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Product</Label>
              <Select
                value={formData.productId}
                onValueChange={(value) => handleInputChange('productId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a product" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', Number.parseInt(e.target.value))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITY_LEVELS.map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                value={formData.dueDate}
                onChange={(e) => handleInputChange('dueDate', e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={formData.assigneeId}
                onValueChange={(value) => handleInputChange('assigneeId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workCenter">Work Center</Label>
              <Select
                value={formData.workCenterId}
                onValueChange={(value) => handleInputChange('workCenterId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work center" />
                </SelectTrigger>
                <SelectContent>
                  {workCenters.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredBOMs.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="bom">Bill of Materials</Label>
              <Select
                value={formData.bomId}
                onValueChange={(value) => handleInputChange('bomId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select BOM (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {filteredBOMs.map((bom) => (
                    <SelectItem key={bom.id} value={bom.id}>
                      {bom.reference || bom.productName} {bom.isDefault && "(Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Additional notes or requirements..."
              rows={3}
            />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}