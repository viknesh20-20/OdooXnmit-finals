"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { ManufacturingOrder, BOM, User, CreateManufacturingOrderForm } from "@/types"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useManufacturingOrders } from "@/hooks/useManufacturingOrders"
import { useProducts } from "@/hooks/useProducts"
import { useBOMs } from "@/hooks/useBOMs"
import { useWorkCenters } from "@/hooks/useWorkCenters"
import { Plus } from "lucide-react"
import { PRIORITY_LEVELS } from "@/types"
import { generateReference } from "@/lib/idGenerator"

interface CreateOrderModalProps {
  onOrderCreated: (order: ManufacturingOrder) => void
}

// Mock users data - in real app this would come from a users API
const mockUsers: User[] = [
  {
    id: "1",
    email: "john.doe@manufacturing.com",
    name: "John Doe",
    firstName: "John",
    lastName: "Doe",
    role: "manager",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    email: "jane.smith@manufacturing.com",
    name: "Jane Smith",
    firstName: "Jane",
    lastName: "Smith",
    role: "operator",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    email: "mike.wilson@manufacturing.com",
    name: "Mike Wilson",
    firstName: "Mike",
    lastName: "Wilson",
    role: "manager",
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ onOrderCreated }) => {
  const { createOrder } = useManufacturingOrders()
  const { products } = useProducts()
  const { boms } = useBOMs()
  const { workCenters } = useWorkCenters()
  
  const [open, setOpen] = useState(false)
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

  // Filter BOMs based on selected product
  useEffect(() => {
    if (formData.productId) {
      const productBOMs = boms.filter(bom => bom.productId === formData.productId && bom.isActive)
      setFilteredBOMs(productBOMs)
      // Auto-select default BOM if available
      const defaultBOM = productBOMs.find(bom => bom.isDefault)
      if (defaultBOM && !formData.bomId) {
        setFormData(prev => ({ ...prev, bomId: defaultBOM.id }))
      }
    } else {
      setFilteredBOMs([])
    }
  }, [formData.productId, boms])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const selectedProduct = products.find(p => p.id === formData.productId)
      const selectedBOM = boms.find(b => b.id === formData.bomId)
      const selectedAssignee = mockUsers.find(u => u.id === formData.assigneeId)
      const selectedWorkCenter = workCenters.find(wc => wc.id === formData.workCenterId)

      const newOrder: Omit<ManufacturingOrder, 'id' | 'createdAt' | 'updatedAt'> = {
        reference: generateReference('manufacturing'),
        productId: formData.productId,
        productName: selectedProduct?.name || "",
        quantity: formData.quantity,
        status: "planned",
        priority: formData.priority,
        startDate: new Date().toISOString(),
        dueDate: formData.dueDate,
        assigneeId: formData.assigneeId,
        assigneeName: selectedAssignee?.name || "",
        assignee: selectedAssignee?.name || "", // Backward compatibility
        bomId: formData.bomId,
        bomName: selectedBOM?.reference || selectedBOM?.productName || "",
        workCenterId: formData.workCenterId,
        workCenterName: selectedWorkCenter?.name || "",
        workOrders: [],
        totalDuration: selectedBOM?.estimatedTime || 0,
        completedQuantity: 0,
        scrapQuantity: 0,
        progress: 0,
        notes: formData.notes,
        createdBy: "current-user", // In real app, get from auth context
      }

      const createdOrder = await createOrder(newOrder)
      onOrderCreated(createdOrder)
      
      // Reset form
      setFormData({
        productId: "",
        quantity: 1,
        priority: "medium",
        dueDate: "",
        assigneeId: "",
        bomId: "",
        workCenterId: "",
        notes: "",
      })
      setOpen(false)
    } catch (error) {
      console.error("Error creating manufacturing order:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const finishedGoods = products.filter(p => p.category === "finished-good")

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Order
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Manufacturing Order</DialogTitle>
          <DialogDescription>Create a new manufacturing order to start production planning.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Product *</Label>
              <Select 
                value={formData.productId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value, bomId: "" }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product to manufacture" />
                </SelectTrigger>
                <SelectContent>
                  {finishedGoods.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - {product.code || product.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                placeholder="Enter quantity"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bomId">Bill of Materials *</Label>
              <Select 
                value={formData.bomId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, bomId: value }))}
                disabled={!formData.productId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!formData.productId ? "Select product first" : "Select BOM"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredBOMs.map((bom) => (
                    <SelectItem key={bom.id} value={bom.id}>
                      {bom.reference || bom.version} {bom.isDefault && "(Default)"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigneeId">Assignee *</Label>
              <Select 
                value={formData.assigneeId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, assigneeId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {mockUsers.filter(user => user.isActive).map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name} - {user.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
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
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="workCenterId">Preferred Work Center</Label>
            <Select 
              value={formData.workCenterId || ""} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, workCenterId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select work center (optional)" />
              </SelectTrigger>
              <SelectContent>
                {workCenters.filter(wc => wc.status === "active").map((workCenter) => (
                  <SelectItem key={workCenter.id} value={workCenter.id}>
                    {workCenter.name} - ${workCenter.costPerHour}/hr
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter any additional notes or instructions..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !formData.productId || !formData.bomId || !formData.assigneeId}>
              {isSubmitting ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
