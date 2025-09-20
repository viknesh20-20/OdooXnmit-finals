"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Loader2 } from "lucide-react"
import type { WorkOrder } from "@/types"

interface CreateWorkOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (workOrderData: Omit<WorkOrder, "id">) => Promise<WorkOrder>
}

export const CreateWorkOrderModal: React.FC<CreateWorkOrderModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    manufacturingOrderId: "",
    operation: "",
    workCenter: "",
    duration: "",
    assignee: "",
    status: "pending" as WorkOrder["status"],
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
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
              <label htmlFor="manufacturingOrderId" className="text-sm font-medium">
                Manufacturing Order ID
              </label>
              <Input
                id="manufacturingOrderId"
                name="manufacturingOrderId"
                value={formData.manufacturingOrderId}
                onChange={handleChange}
                placeholder="MO-001"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="operation" className="text-sm font-medium">
                Operation
              </label>
              <Input
                id="operation"
                name="operation"
                value={formData.operation}
                onChange={handleChange}
                placeholder="Assembly, Painting, Cutting..."
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="workCenter" className="text-sm font-medium">
                Work Center
              </label>
              <Input
                id="workCenter"
                name="workCenter"
                value={formData.workCenter}
                onChange={handleChange}
                placeholder="Assembly Line A, Paint Booth 1..."
                required
              />
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
              <label htmlFor="assignee" className="text-sm font-medium">
                Assignee
              </label>
              <Input
                id="assignee"
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                placeholder="John Smith"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="status" className="text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            <div className="flex gap-2 pt-4">
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
