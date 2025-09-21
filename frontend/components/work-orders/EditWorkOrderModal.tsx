"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Loader2 } from "lucide-react"
import type { WorkOrder } from "@/types"
import { useManufacturingOrders } from "@/hooks/useManufacturingOrders"
import { useWorkCenters } from "@/hooks/useWorkCenters"
import { useActiveUsers } from "@/hooks/useUsers"

interface EditWorkOrderModalProps {
  workOrder: WorkOrder | null
  isOpen: boolean
  onClose: () => void
  onSubmit: (id: string, updates: Partial<WorkOrder>) => Promise<void>
}

export const EditWorkOrderModal: React.FC<EditWorkOrderModalProps> = ({ 
  workOrder, 
  isOpen, 
  onClose, 
  onSubmit 
}) => {
  const { orders } = useManufacturingOrders()
  const { workCenters } = useWorkCenters()
  const { users } = useActiveUsers()
  
  const [formData, setFormData] = useState({
    manufacturingOrderId: "",
    operation: "",
    workCenterId: "",
    estimatedDuration: 0,
    assignedTo: "",
    status: "pending" as WorkOrder["status"],
    instructions: "",
    comments: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize form data when workOrder changes
  useEffect(() => {
    if (workOrder) {
      setFormData({
        manufacturingOrderId: workOrder.manufacturingOrderId || "",
        operation: workOrder.operation || "",
        workCenterId: workOrder.workCenterId || "",
        estimatedDuration: workOrder.estimatedDuration || 0,
        assignedTo: workOrder.assigneeId || "",
        status: workOrder.status || "pending",
        instructions: workOrder.instructions || "",
        comments: workOrder.comments || "",
      })
    }
  }, [workOrder])

  const operationTypes = [
    { value: "assembly", label: "Assembly" },
    { value: "cutting", label: "Cutting" },
    { value: "painting", label: "Painting" },
    { value: "welding", label: "Welding" },
    { value: "machining", label: "Machining" },
    { value: "packaging", label: "Packaging" },
    { value: "quality-check", label: "Quality Check" },
  ]

  const statusOptions = [
    { value: "pending", label: "Pending" },
    { value: "in-progress", label: "In Progress" },
    { value: "paused", label: "Paused" },
    { value: "completed", label: "Completed" },
    { value: "cancelled", label: "Cancelled" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workOrder) return

    setLoading(true)
    setError(null)

    try {
      const updates = {
        manufacturingOrderId: formData.manufacturingOrderId,
        operation: formData.operation,
        workCenterId: formData.workCenterId,
        estimatedDuration: formData.estimatedDuration,
        assignedTo: formData.assignedTo,
        status: formData.status,
        instructions: formData.instructions,
        comments: formData.comments,
      }

      await onSubmit(workOrder.id, updates)
      onClose()
    } catch (err) {
      console.error("Error updating work order:", err)
      setError(err instanceof Error ? err.message : "Failed to update work order")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen || !workOrder) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Edit Work Order</CardTitle>
            <CardDescription>Update work order details</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="manufacturingOrder">Manufacturing Order</Label>
                <Select
                  value={formData.manufacturingOrderId}
                  onValueChange={(value) => handleInputChange('manufacturingOrderId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manufacturing order" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.map((order) => (
                      <SelectItem key={order.id} value={order.id}>
                        {order.reference} - {order.productName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="operation">Operation</Label>
                <Select
                  value={formData.operation}
                  onValueChange={(value) => handleInputChange('operation', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select operation type" />
                  </SelectTrigger>
                  <SelectContent>
                    {operationTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                    {workCenters.filter(wc => wc.status === "active").map((center) => (
                      <SelectItem key={center.id} value={center.id}>
                        {center.name} ({center.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.estimatedDuration}
                  onChange={(e) => handleInputChange('estimatedDuration', parseInt(e.target.value) || 0)}
                  placeholder="Enter duration in minutes"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="assignee">Assignee</Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) => handleInputChange('assignedTo', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.fullName || `${user.firstName} ${user.lastName}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleInputChange('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => handleInputChange('instructions', e.target.value)}
                placeholder="Enter work instructions..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => handleInputChange('comments', e.target.value)}
                placeholder="Enter additional comments..."
                rows={2}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Work Order"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
