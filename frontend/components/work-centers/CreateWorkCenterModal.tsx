"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Loader2 } from "lucide-react"
import type { WorkCenter } from "@/types"

interface CreateWorkCenterModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (workCenterData: Omit<WorkCenter, "id">) => Promise<void>
  editingWorkCenter?: WorkCenter | null
}

export const CreateWorkCenterModal: React.FC<CreateWorkCenterModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingWorkCenter,
}) => {
  const [formData, setFormData] = useState({
    name: editingWorkCenter?.name || "",
    description: editingWorkCenter?.description || "",
    costPerHour: editingWorkCenter?.costPerHour?.toString() || "",
    capacity: editingWorkCenter?.capacity?.toString() || "",
    status: editingWorkCenter?.status || ("active" as WorkCenter["status"]),
    utilization: editingWorkCenter?.utilization?.toString() || "0",
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        name: formData.name,
        description: formData.description,
        costPerHour: Number.parseFloat(formData.costPerHour),
        capacity: Number.parseInt(formData.capacity),
        status: formData.status,
        utilization: Number.parseInt(formData.utilization),
      })

      // Reset form
      setFormData({
        name: "",
        description: "",
        costPerHour: "",
        capacity: "",
        status: "active",
        utilization: "0",
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
              <CardTitle>{editingWorkCenter ? "Edit Work Center" : "Create Work Center"}</CardTitle>
              <CardDescription>
                {editingWorkCenter ? "Update work center details" : "Add a new work center to the system"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Assembly Line A"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Primary assembly line for wooden furniture"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="costPerHour" className="text-sm font-medium">
                  Cost per Hour ($)
                </label>
                <Input
                  id="costPerHour"
                  name="costPerHour"
                  type="number"
                  step="0.01"
                  value={formData.costPerHour}
                  onChange={handleChange}
                  placeholder="45.00"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="capacity" className="text-sm font-medium">
                  Capacity
                </label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleChange}
                  placeholder="8"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="utilization" className="text-sm font-medium">
                  Utilization (%)
                </label>
                <Input
                  id="utilization"
                  name="utilization"
                  type="number"
                  value={formData.utilization}
                  onChange={handleChange}
                  placeholder="85"
                  min="0"
                  max="100"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingWorkCenter ? "Updating..." : "Creating..."}
                  </>
                ) : editingWorkCenter ? (
                  "Update Work Center"
                ) : (
                  "Create Work Center"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
