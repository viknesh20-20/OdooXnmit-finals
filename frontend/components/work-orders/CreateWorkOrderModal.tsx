"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { X, Loader2 } from "lucide-react"
import type { WorkOrder, User } from "@/types"
import { generateReference } from "@/lib/idGenerator"
import { useManufacturingOrders } from "@/hooks/useManufacturingOrders"
import { useWorkCenters } from "@/hooks/useWorkCenters"

interface CreateWorkOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (workOrderData: Omit<WorkOrder, "id">) => Promise<WorkOrder>
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { orders } = useManufacturingOrders()
  const { workCenters } = useWorkCenters()
  
  const [formData, setFormData] = useState({
    manufacturingOrderId: "",
    operation: "",
    workCenter: "",
    duration: "",
    assignee: "",
    status: "pending" as WorkOrder["status"],
  })
  const [loading, setLoading] = useState(false)

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

    try {
      await onSubmit({
        reference: generateReference('workorder'),
        manufacturingOrderId: formData.manufacturingOrderId,
        operation: formData.operation,
        workCenter: formData.workCenter,
        duration: Number.parseInt(formData.duration),
        assignee: formData.assignee,
        status: formData.status,
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
                      {order.reference} - {order.productName}
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
                      {center.name} - {center.status}
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
                  {mockUsers.map((user) => (
                    <SelectItem key={user.id} value={user.name}>
                      {user.name} - {user.role}
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
