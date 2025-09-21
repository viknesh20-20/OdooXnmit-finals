"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { X, Loader2 } from "lucide-react"
import type { WorkOrder, WorkOrderCreateRequest } from "@/types"
import { generateReference } from "@/lib/idGenerator"
import { useManufacturingOrders } from "@/hooks/useManufacturingOrders"
import { useWorkCenters } from "@/hooks/useWorkCenters"
import { useActiveUsers } from "@/hooks/useUsers"

interface CreateWorkOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (workOrderData: WorkOrderCreateRequest) => Promise<WorkOrder>
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { orders } = useManufacturingOrders()
  const { workCenters } = useWorkCenters()
  const { users } = useActiveUsers()
  
  const [formData, setFormData] = useState({
    manufacturingOrderId: "",
    operation: "",
    workCenter: "",
    duration: "",
    assignee: "",
    status: "pending" as WorkOrder["status"],
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)



  const operationTypes = [
    { value: "assembly", label: "Assembly" },
    { value: "cutting", label: "Cutting" },
    { value: "painting", label: "Painting" },
    { value: "welding", label: "Welding" },
    { value: "machining", label: "Machining" },
    { value: "packaging", label: "Packaging" },
    { value: "quality-check", label: "Quality Check" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Validate required fields
      if (!formData.manufacturingOrderId) {
        setError("Manufacturing Order is required")
        return
      }
      if (!formData.workCenter) {
        setError("Work Center is required")
        return
      }
      if (!formData.operation) {
        setError("Operation is required")
        return
      }
      if (!formData.duration || Number.parseInt(formData.duration) <= 0) {
        setError("Duration must be greater than 0")
        return
      }

      // Backend expects snake_case field names and UUIDs
      await onSubmit({
        wo_number: generateReference('workorder'),
        manufacturing_order_id: formData.manufacturingOrderId,
        operation: formData.operation,
        work_center_id: formData.workCenter, // This should be a UUID
        duration: Number.parseInt(formData.duration),
        assigned_to: formData.assignee || undefined, // This should be a UUID or undefined
        status: formData.status,
        sequence: 1, // Required field
        pause_time: 0, // Required field with default
        dependencies: [], // Required field with default
        quality_checks: [], // Required field with default
        time_entries: [], // Required field with default
        metadata: {}, // Required field with default
      })

      // Reset form
      setFormData({
        manufacturingOrderId: "",
        operation: "",
        workCenter: "",
        duration: "",
        assignee: "",
        status: "pending",
      })
      onClose()
    } catch (err) {
      console.error('Failed to create work order:', err)
      let errorMessage = 'Failed to create work order'

      if (err instanceof Error) {
        errorMessage = err.message
        // If it's an API error with validation details, use the detailed message
        if (errorMessage.includes('Validation failed') || errorMessage.includes('required') || errorMessage.includes('must be')) {
          // The enhanced API error handler will have already formatted validation messages
          errorMessage = err.message
        }
      }

      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Create Work Order</CardTitle>
              <CardDescription>Add a new work order operation</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="manufacturingOrderId">Manufacturing Order</Label>
              <Select
                value={formData.manufacturingOrderId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, manufacturingOrderId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select manufacturing order" />
                </SelectTrigger>
                <SelectContent>
                  {orders.map((order) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.reference || order.id} - {order.productName || 'Unknown Product'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="operation">Operation Type</Label>
              <Select
                value={formData.operation}
                onValueChange={(value) => setFormData(prev => ({ ...prev, operation: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select operation type" />
                </SelectTrigger>
                <SelectContent>
                  {operationTypes.map((operation) => (
                    <SelectItem key={operation.value} value={operation.value}>
                      {operation.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="workCenter">Work Center</Label>
              <Select
                value={formData.workCenter}
                onValueChange={(value) => setFormData(prev => ({ ...prev, workCenter: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work center" />
                </SelectTrigger>
                <SelectContent>
                  {workCenters.map((center) => (
                    <SelectItem key={center.id} value={center.id}>
                      {center.name} - {typeof center.status === 'string' ? center.status : 'active'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label htmlFor="duration" className="text-sm font-medium">
                Duration (minutes)
              </label>
              <Input
                id="duration"
                name="duration"
                type="number"
                value={formData.duration}
                onChange={handleChange}
                placeholder="60"
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee</Label>
              <Select
                value={formData.assignee}
                onValueChange={(value) => setFormData(prev => ({ ...prev, assignee: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.fullName || `${user.firstName} ${user.lastName}`} - {user.roleName || 'User'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as WorkOrder["status"] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Work Order"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
