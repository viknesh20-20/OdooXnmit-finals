"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Loader2, Plus, Trash2 } from "lucide-react"
import type { BOM, BOMComponent, BOMOperation } from "@/types"

interface CreateBOMModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (bomData: Omit<BOM, "id">) => Promise<void>
  editingBOM?: BOM | null
}

export const CreateBOMModal: React.FC<CreateBOMModalProps> = ({ isOpen, onClose, onSubmit, editingBOM }) => {
  const [formData, setFormData] = useState({
    productId: editingBOM?.productId || "",
    productName: editingBOM?.productName || "",
    version: editingBOM?.version || "v1.0",
    isActive: editingBOM?.isActive ?? true,
  })
  const [components, setComponents] = useState<Omit<BOMComponent, "id">[]>(
    editingBOM?.components.map(({ id, ...comp }) => comp) || [
      { productId: "", productName: "", quantity: 1, unit: "pieces" },
    ],
  )
  const [operations, setOperations] = useState<Omit<BOMOperation, "id">[]>(
    editingBOM?.operations.map(({ id, ...op }) => op) || [{ operation: "", workCenter: "", duration: 60, sequence: 1 }],
  )
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const bomData: Omit<BOM, "id"> = {
        ...formData,
        components: components.map((comp, index) => ({
          ...comp,
          id: `BC-${index + 1}`,
        })),
        operations: operations.map((op, index) => ({
          ...op,
          id: `BO-${index + 1}`,
        })),
      }

      await onSubmit(bomData)

      // Reset form
      setFormData({
        productId: "",
        productName: "",
        version: "v1.0",
        isActive: true,
      })
      setComponents([{ productId: "", productName: "", quantity: 1, unit: "pieces" }])
      setOperations([{ operation: "", workCenter: "", duration: 60, sequence: 1 }])
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  const addComponent = () => {
    setComponents((prev) => [...prev, { productId: "", productName: "", quantity: 1, unit: "pieces" }])
  }

  const removeComponent = (index: number) => {
    setComponents((prev) => prev.filter((_, i) => i !== index))
  }

  const updateComponent = (index: number, field: keyof Omit<BOMComponent, "id">, value: string | number) => {
    setComponents((prev) => prev.map((comp, i) => (i === index ? { ...comp, [field]: value } : comp)))
  }

  const addOperation = () => {
    setOperations((prev) => [...prev, { operation: "", workCenter: "", duration: 60, sequence: prev.length + 1 }])
  }

  const removeOperation = (index: number) => {
    setOperations((prev) => prev.filter((_, i) => i !== index).map((op, i) => ({ ...op, sequence: i + 1 })))
  }

  const updateOperation = (index: number, field: keyof Omit<BOMOperation, "id">, value: string | number) => {
    setOperations((prev) => prev.map((op, i) => (i === index ? { ...op, [field]: value } : op)))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{editingBOM ? "Edit Bill of Materials" : "Create Bill of Materials"}</CardTitle>
              <CardDescription>
                {editingBOM ? "Update BOM details" : "Define components and operations for manufacturing"}
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="productId" className="text-sm font-medium">
                  Product ID
                </label>
                <Input
                  id="productId"
                  name="productId"
                  value={formData.productId}
                  onChange={handleChange}
                  placeholder="P-005"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="productName" className="text-sm font-medium">
                  Product Name
                </label>
                <Input
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  placeholder="Wooden Table"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="version" className="text-sm font-medium">
                  Version
                </label>
                <Input
                  id="version"
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  placeholder="v1.0"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                className="rounded border-input"
              />
              <label htmlFor="isActive" className="text-sm font-medium">
                Active BOM
              </label>
            </div>

            {/* Components Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Components</h3>
                <Button type="button" onClick={addComponent} variant="outline" size="sm" className="bg-transparent">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Component
                </Button>
              </div>

              <div className="space-y-3">
                {components.map((component, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border border-border rounded-lg"
                  >
                    <Input
                      placeholder="Product ID"
                      value={component.productId}
                      onChange={(e) => updateComponent(index, "productId", e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Product Name"
                      value={component.productName}
                      onChange={(e) => updateComponent(index, "productName", e.target.value)}
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={component.quantity}
                      onChange={(e) => updateComponent(index, "quantity", Number.parseInt(e.target.value))}
                      min="1"
                      required
                    />
                    <Input
                      placeholder="Unit"
                      value={component.unit}
                      onChange={(e) => updateComponent(index, "unit", e.target.value)}
                      required
                    />
                    <Button
                      type="button"
                      onClick={() => removeComponent(index)}
                      variant="outline"
                      size="sm"
                      className="bg-transparent text-red-400 hover:text-red-300"
                      disabled={components.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Operations Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Operations</h3>
                <Button type="button" onClick={addOperation} variant="outline" size="sm" className="bg-transparent">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Operation
                </Button>
              </div>

              <div className="space-y-3">
                {operations.map((operation, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-5 gap-3 p-3 border border-border rounded-lg"
                  >
                    <Input
                      placeholder="Operation"
                      value={operation.operation}
                      onChange={(e) => updateOperation(index, "operation", e.target.value)}
                      required
                    />
                    <Input
                      placeholder="Work Center"
                      value={operation.workCenter}
                      onChange={(e) => updateOperation(index, "workCenter", e.target.value)}
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Duration (min)"
                      value={operation.duration}
                      onChange={(e) => updateOperation(index, "duration", Number.parseInt(e.target.value))}
                      min="1"
                      required
                    />
                    <Input
                      type="number"
                      placeholder="Sequence"
                      value={operation.sequence}
                      onChange={(e) => updateOperation(index, "sequence", Number.parseInt(e.target.value))}
                      min="1"
                      required
                    />
                    <Button
                      type="button"
                      onClick={() => removeOperation(index)}
                      variant="outline"
                      size="sm"
                      className="bg-transparent text-red-400 hover:text-red-300"
                      disabled={operations.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
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
                    {editingBOM ? "Updating..." : "Creating..."}
                  </>
                ) : editingBOM ? (
                  "Update BOM"
                ) : (
                  "Create BOM"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
