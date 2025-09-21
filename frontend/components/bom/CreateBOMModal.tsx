"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X, Loader2, Plus, Trash2 } from "lucide-react"
import type { BOM, BOMComponent, BOMOperation } from "@/types"
import { generateReference, generateId } from "@/lib/idGenerator"
import { useWorkCenters } from "@/hooks/useWorkCenters"
import { useProducts } from "@/hooks/useProducts"
import { useBOMOperations } from "@/hooks/useBOMOperations"
import { FormError, FieldError } from "@/components/ui/form-error"

interface CreateBOMModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (bomData: Omit<BOM, "id">) => Promise<void>
  editingBOM?: BOM | null
}

// Predefined operation types based on seeded data
const OPERATION_TYPES = [
  { value: 'Material Preparation', label: 'Material Preparation', type: 'preparation' },
  { value: 'Cutting', label: 'Cutting', type: 'machining' },
  { value: 'Assembly', label: 'Assembly', type: 'assembly' },
  { value: 'Quality Control', label: 'Quality Control', type: 'inspection' },
  { value: 'Packaging', label: 'Packaging', type: 'finishing' },
  { value: 'Welding', label: 'Welding', type: 'machining' },
  { value: 'Drilling', label: 'Drilling', type: 'machining' },
  { value: 'Painting', label: 'Painting', type: 'finishing' },
  { value: 'Testing', label: 'Testing', type: 'inspection' },
  { value: 'Polishing', label: 'Polishing', type: 'finishing' }
]

export const CreateBOMModal: React.FC<CreateBOMModalProps> = ({ isOpen, onClose, onSubmit, editingBOM }) => {
  const { workCenters, loading: workCentersLoading, error: workCentersError } = useWorkCenters()
  const { products } = useProducts()

  const [formData, setFormData] = useState({
    productId: editingBOM?.productId || "",
    productName: editingBOM?.productName || "",
    version: editingBOM?.version || "v1.0",
    isActive: editingBOM?.isActive ?? true,
  })
  const [components, setComponents] = useState<Omit<BOMComponent, "id">[]>(
    editingBOM?.components?.map(({ id, ...comp }) => comp) || [
      { productId: "", productName: "", quantity: 1, unit: "pieces" },
    ],
  )
  const [operations, setOperations] = useState<Omit<BOMOperation, "id">[]>(
    editingBOM?.operations?.map(({ id, ...op }) => op) || [{ operation: "", workCenter: "", duration: 60, sequence: 1 }],
  )
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.productId.trim()) {
      newErrors.productId = 'Product ID is required'
    }
    if (!formData.productName.trim()) {
      newErrors.productName = 'Product name is required'
    }
    if (!formData.version.trim()) {
      newErrors.version = 'Version is required'
    }

    // Validate components
    components.forEach((comp, index) => {
      if (!comp.productId.trim()) {
        newErrors[`component_${index}_productId`] = `Component ${index + 1} product ID is required`
      }
      if (!comp.productName.trim()) {
        newErrors[`component_${index}_productName`] = `Component ${index + 1} product name is required`
      }
      if (comp.quantity <= 0) {
        newErrors[`component_${index}_quantity`] = `Component ${index + 1} quantity must be greater than 0`
      }
    })

    // Validate operations
    operations.forEach((op, index) => {
      if (!op.operation.trim()) {
        newErrors[`operation_${index}_operation`] = `Operation ${index + 1} name is required`
      }
      if (!op.workCenter?.trim()) {
        newErrors[`operation_${index}_workCenter`] = `Operation ${index + 1} work center is required`
      }
      if (op.duration <= 0) {
        newErrors[`operation_${index}_duration`] = `Operation ${index + 1} duration must be greater than 0`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setErrors({})

    try {
      const bomData: Omit<BOM, "id"> = {
        ...formData,
        reference: generateReference('bom'),
        components: components.map((comp) => ({
          ...comp,
          id: generateId(),
        })),
        operations: operations.map((op) => ({
          ...op,
          id: generateId(),
        })),
      }

      await onSubmit(bomData)

      // Clear any previous errors on successful submission
      setErrors({})

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
    } catch (error) {
      console.error('Error creating BOM:', error)

      // Extract validation errors from API response
      let errorMessage = 'Failed to create BOM'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      // Set a general error that can be displayed to the user
      setErrors({ submit: errorMessage })
      setErrors({ submit: error instanceof Error ? error.message : 'Failed to create BOM' })
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

    // Clear field-specific errors and submit errors when user starts typing
    if (errors[name] || errors.submit) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        delete newErrors.submit
        return newErrors
      })
    }
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
          {errors.submit && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Form Error Summary */}
            {Object.keys(errors).filter(key => key !== 'submit').length > 0 && (
              <FormError
                error={Object.values(errors).filter((_, index) => Object.keys(errors)[index] !== 'submit')}
                variant="destructive"
                className="mb-4"
              />
            )}

            {/* Work Centers Loading Error */}
            {workCentersError && (
              <FormError
                error={`Failed to load work centers: ${workCentersError}`}
                variant="destructive"
                className="mb-4"
              />
            )}

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="productId" className="text-sm font-medium">
                  Product *
                </label>
                <Select
                  value={formData.productId}
                  onValueChange={(value) => {
                    const selectedProduct = products.find(p => p.id === value)
                    setFormData(prev => ({
                      ...prev,
                      productId: value,
                      productName: selectedProduct?.name || ""
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError error={errors.productId} />
              </div>

              <div className="space-y-2">
                <label htmlFor="productName" className="text-sm font-medium">
                  Product Name *
                </label>
                <Input
                  id="productName"
                  name="productName"
                  value={formData.productName}
                  onChange={handleChange}
                  placeholder="Product name"
                  required
                  disabled
                  className="bg-muted"
                />
                <FieldError error={errors.productName} />
              </div>

              <div className="space-y-2">
                <label htmlFor="version" className="text-sm font-medium">
                  Version *
                </label>
                <Input
                  id="version"
                  name="version"
                  value={formData.version}
                  onChange={handleChange}
                  placeholder="v1.0"
                  required
                />
                <FieldError error={errors.version} />
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
                    <Select
                      value={component.productId}
                      onValueChange={(value) => {
                        const selectedProduct = products.find(p => p.id === value)
                        updateComponent(index, "productId", value)
                        if (selectedProduct) {
                          updateComponent(index, "productName", selectedProduct.name)
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} ({product.id})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Product Name"
                      value={component.productName}
                      onChange={(e) => updateComponent(index, "productName", e.target.value)}
                      required
                      disabled
                      className="bg-muted"
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
                    <div className="space-y-1">
                      <Select
                        value={operation.operation}
                        onValueChange={(value) => updateOperation(index, "operation", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select operation" />
                        </SelectTrigger>
                        <SelectContent>
                          {OPERATION_TYPES.map((opType) => (
                            <SelectItem key={opType.value} value={opType.value}>
                              {opType.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FieldError error={errors[`operation_${index}_operation`]} />
                    </div>
                    <div className="space-y-1">
                      <Select
                        value={operation.workCenter}
                        onValueChange={(value) => updateOperation(index, "workCenter", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select work center" />
                        </SelectTrigger>
                        <SelectContent>
                          {workCentersLoading ? (
                            <SelectItem value="" disabled>
                              Loading work centers...
                            </SelectItem>
                          ) : workCentersError ? (
                            <SelectItem value="" disabled>
                              Error loading work centers
                            </SelectItem>
                          ) : workCenters.length === 0 ? (
                            <SelectItem value="" disabled>
                              No work centers available
                            </SelectItem>
                          ) : (
                            workCenters.map((workCenter) => (
                              <SelectItem key={workCenter.id} value={workCenter.id}>
                                {workCenter.code} - {workCenter.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FieldError error={errors[`operation_${index}_workCenter`]} />
                    </div>
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
