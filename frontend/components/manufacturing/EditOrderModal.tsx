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
import { useActiveUsers } from "@/hooks/useUsers"
import { PRIORITY_LEVELS } from "@/types"

interface EditOrderModalProps {
  order: ManufacturingOrder | null
  isOpen: boolean
  onClose: () => void
  onOrderUpdated: (order: ManufacturingOrder) => void
}

export const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, isOpen, onClose, onOrderUpdated }) => {
  const { updateOrder } = useManufacturingOrders()
  const { products } = useProducts()
  const { boms, loading: bomsLoading, error: bomsError } = useBOMs()
  const { workCenters, loading: workCentersLoading, error: workCentersError } = useWorkCenters()
  const { users, loading: usersLoading, error: usersError } = useActiveUsers()
  
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
        priority: order.priority || "normal",
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
      const selectedAssignee = users.find(u => u.id === formData.assigneeId)
      const selectedWorkCenter = workCenters.find(wc => wc.id === formData.workCenterId)

      const updatedOrder: ManufacturingOrder = {
        ...order,
        productId: formData.productId,
        productName: selectedProduct?.name || order.productName,
        quantity: formData.quantity,
        priority: formData.priority,
        dueDate: formData.dueDate,
        assigneeId: formData.assigneeId,
        assigneeName: selectedAssignee ? (selectedAssignee.fullName || `${selectedAssignee.firstName} ${selectedAssignee.lastName}`) : "",
        assignee: selectedAssignee ? (selectedAssignee.fullName || `${selectedAssignee.firstName} ${selectedAssignee.lastName}`) : "", // Backward compatibility
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
    setFormData(prev => {
      const newData = { ...prev, [field]: value }

      // Clear BOM selection when product changes
      if (field === 'productId') {
        newData.bomId = ""
      }

      return newData
    })
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
                  {usersLoading ? (
                    <SelectItem value="loading-users" disabled>Loading users...</SelectItem>
                  ) : usersError ? (
                    <SelectItem value="error-users" disabled>Error loading users</SelectItem>
                  ) : users.length === 0 ? (
                    <SelectItem value="no-users" disabled>No users available</SelectItem>
                  ) : (
                    users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName || `${user.firstName} ${user.lastName}`} - {user.roleName || 'User'}
                      </SelectItem>
                    ))
                  )}
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
                  {workCentersLoading ? (
                    <SelectItem value="loading-workcenters" disabled>Loading work centers...</SelectItem>
                  ) : workCentersError ? (
                    <SelectItem value="error-workcenters" disabled>Error loading work centers</SelectItem>
                  ) : workCenters.length === 0 ? (
                    <SelectItem value="no-workcenters" disabled>No work centers available</SelectItem>
                  ) : (
                    workCenters.map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bom">Bill of Materials</Label>
            <Select
              value={formData.bomId}
              onValueChange={(value) => handleInputChange('bomId', value)}
              disabled={!formData.productId}
            >
              <SelectTrigger>
                <SelectValue placeholder={!formData.productId ? "Select product first" : "Select BOM (optional)"} />
              </SelectTrigger>
              <SelectContent>
                {bomsLoading ? (
                  <SelectItem value="loading-boms" disabled>Loading BOMs...</SelectItem>
                ) : bomsError ? (
                  <SelectItem value="error-boms" disabled>Error loading BOMs</SelectItem>
                ) : !formData.productId ? (
                  <SelectItem value="select-product-first" disabled>Select product first</SelectItem>
                ) : filteredBOMs.length === 0 ? (
                  <SelectItem value="no-boms" disabled>No BOMs available for this product</SelectItem>
                ) : (
                  filteredBOMs.map((bom) => (
                    <SelectItem key={bom.id} value={bom.id}>
                      {bom.reference || bom.productName} {bom.isDefault && "(Default)"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

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