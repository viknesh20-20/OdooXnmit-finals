"use client"

import type React from "react"
import { useState, useEffect } from "react"
import type { ManufacturingOrder, BOM, CreateManufacturingOrderForm } from "@/types"
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
import { useActiveUsers } from "@/hooks/useUsers"
import { useAuth } from "@/contexts/AuthContext"
import { FormError, FieldError } from "@/components/ui/form-error"
import { Plus } from "lucide-react"
import { PRIORITY_LEVELS } from "@/types"
import { generateReference } from "@/lib/idGenerator"
import { validateManufacturingOrderForm, hasValidationErrors, type ValidationErrors } from "@/lib/validation/manufacturingOrderValidation"

interface CreateOrderModalProps {
  onOrderCreated: (order: ManufacturingOrder) => void
}

export const CreateOrderModal: React.FC<CreateOrderModalProps> = ({ onOrderCreated }) => {
  const { createOrder } = useManufacturingOrders()
  const { products, loading: productsLoading, error: productsError } = useProducts()
  const { boms, loading: bomsLoading, error: bomsError } = useBOMs()
  const { workCenters, loading: workCentersLoading, error: workCentersError } = useWorkCenters()
  const { users, loading: usersLoading, error: usersError } = useActiveUsers()
  const { user } = useAuth()

  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [formData, setFormData] = useState<CreateManufacturingOrderForm>({
    productId: "",
    quantity: 1,
    priority: "normal",
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

  const validateForm = (): boolean => {
    const validationErrors = validateManufacturingOrderForm(formData)
    setErrors(validationErrors)
    return !hasValidationErrors(validationErrors)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      const selectedProduct = products.find(p => p.id === formData.productId)
      const selectedBOM = boms.find(b => b.id === formData.bomId)
      const selectedAssignee = users.find(u => u.id === formData.assigneeId)
      const selectedWorkCenter = workCenters.find(wc => wc.id === formData.workCenterId)

      const newOrder: Omit<ManufacturingOrder, 'id' | 'createdAt' | 'updatedAt'> = {
        reference: generateReference('manufacturing'),
        moNumber: `MO-${Date.now()}`,
        productId: formData.productId,
        productName: selectedProduct?.name || "",
        productCode: selectedProduct?.code || "",
        quantity: formData.quantity,
        quantityUnit: selectedProduct?.unit || "pieces",
        status: "planned",
        priority: formData.priority,
        startDate: new Date().toISOString(),
        dueDate: formData.dueDate,
        plannedStartDate: new Date().toISOString(),
        plannedEndDate: formData.dueDate,
        assigneeId: formData.assigneeId,
        assigneeName: selectedAssignee?.fullName || `${selectedAssignee?.firstName} ${selectedAssignee?.lastName}` || "",
        assignee: selectedAssignee?.fullName || `${selectedAssignee?.firstName} ${selectedAssignee?.lastName}` || "", // Backward compatibility
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
        createdBy: user.id, // Current authenticated user
      }

      const createdOrder = await createOrder(newOrder)
      onOrderCreated(createdOrder)
      
      // Reset form
      setFormData({
        productId: "",
        quantity: 1,
        priority: "normal",
        dueDate: "",
        assigneeId: "",
        bomId: "",
        workCenterId: "",
        notes: "",
      })
      setErrors({})
      setOpen(false)
    } catch (error) {
      console.error("Error creating manufacturing order:", error)
      let errorMessage = 'Failed to create manufacturing order'

      if (error instanceof Error) {
        errorMessage = error.message
      }

      // Set a general error that can be displayed to the user
      setErrors({ submit: errorMessage })
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

        {/* Submit Error Display */}
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Form Error Summary */}
        {Object.keys(errors).filter(key => key !== 'submit').length > 0 && (
          <FormError
            error={Object.values(errors).filter((_, index) => Object.keys(errors)[index] !== 'submit')}
            variant="destructive"
            className="mb-4"
          />
        )}

        {/* Loading Errors */}
        {(productsError || bomsError || workCentersError || usersError) && (
          <FormError
            error={[
              productsError && `Products: ${productsError}`,
              bomsError && `BOMs: ${bomsError}`,
              workCentersError && `Work Centers: ${workCentersError}`,
              usersError && `Users: ${usersError}`
            ].filter((error): error is string => Boolean(error))}
            variant="destructive"
            className="mb-4"
          />
        )}

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
                  {productsLoading ? (
                    <SelectItem value="loading" disabled>Loading products...</SelectItem>
                  ) : finishedGoods.length === 0 ? (
                    <SelectItem value="no-products" disabled>No products available</SelectItem>
                  ) : (
                    finishedGoods.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} - {product.code || product.id}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FieldError error={errors.productId} />
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
              <FieldError error={errors.quantity} />
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
                  {bomsLoading ? (
                    <SelectItem value="loading-boms" disabled>Loading BOMs...</SelectItem>
                  ) : !formData.productId ? (
                    <SelectItem value="select-product-first" disabled>Select product first</SelectItem>
                  ) : filteredBOMs.length === 0 ? (
                    <SelectItem value="no-boms" disabled>No BOMs available for this product</SelectItem>
                  ) : (
                    filteredBOMs.map((bom) => (
                      <SelectItem key={bom.id} value={bom.id}>
                        {bom.reference || bom.version} {bom.isDefault && "(Default)"}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FieldError error={errors.bomId} />
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
                  {usersLoading ? (
                    <SelectItem value="loading-users" disabled>Loading users...</SelectItem>
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
              <FieldError error={errors.assigneeId} />
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
              <FieldError error={errors.dueDate} />
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
                {workCentersLoading ? (
                  <SelectItem value="loading-workcenters" disabled>Loading work centers...</SelectItem>
                ) : workCentersError ? (
                  <SelectItem value="error-workcenters" disabled>Error loading work centers</SelectItem>
                ) : workCenters.filter(wc => wc.status === "active").length === 0 ? (
                  <SelectItem value="no-workcenters" disabled>No active work centers available</SelectItem>
                ) : (
                  workCenters.filter(wc => wc.status === "active").map((workCenter) => (
                    <SelectItem key={workCenter.id} value={workCenter.id}>
                      {workCenter.name} - ${workCenter.costPerHour}/hr
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
