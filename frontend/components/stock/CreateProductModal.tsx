"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { X, Loader2 } from "lucide-react"
import type { Product } from "@/types"
import { generateReference } from "@/lib/idGenerator"

interface CreateProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (productData: Omit<Product, "id">) => Promise<void>
  editingProduct?: Product | null
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingProduct,
}) => {
  const [formData, setFormData] = useState({
    name: editingProduct?.name || "",
    description: editingProduct?.description || "",
    unit: editingProduct?.unit || "",
    currentStock: editingProduct?.currentStock?.toString() || "0",
    minStock: editingProduct?.minStock?.toString() || "",
    maxStock: editingProduct?.maxStock?.toString() || "",
    unitCost: editingProduct?.unitCost?.toString() || "",
    category: editingProduct?.category || ("raw-material" as Product["category"]),
  })
  const [loading, setLoading] = useState(false)

  const unitOptions = [
    { value: "pieces", label: "Pieces (pcs)" },
    { value: "kg", label: "Kilograms (kg)" },
    { value: "g", label: "Grams (g)" },
    { value: "m", label: "Meters (m)" },
    { value: "cm", label: "Centimeters (cm)" },
    { value: "L", label: "Liters (L)" },
    { value: "ml", label: "Milliliters (ml)" },
    { value: "hours", label: "Hours" },
    { value: "sets", label: "Sets" },
  ]

  const categoryOptions = [
    { value: "raw-material", label: "Raw Material" },
    { value: "finished-good", label: "Finished Good" },
    { value: "component", label: "Component" },
    { value: "consumable", label: "Consumable" },
    { value: "service", label: "Service" },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await onSubmit({
        name: formData.name,
        code: generateReference('product'),
        description: formData.description,
        unit: formData.unit,
        currentStock: Number.parseInt(formData.currentStock),
        minStock: Number.parseInt(formData.minStock),
        maxStock: Number.parseInt(formData.maxStock),
        unitCost: Number.parseFloat(formData.unitCost),
        category: formData.category,
      })

      // Reset form
      setFormData({
        name: "",
        description: "",
        unit: "",
        currentStock: "0",
        minStock: "",
        maxStock: "",
        unitCost: "",
        category: "raw-material",
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
              <CardTitle>{editingProduct ? "Edit Product" : "Create Product"}</CardTitle>
              <CardDescription>
                {editingProduct ? "Update product details" : "Add a new product to inventory"}
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
                Product Name
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Wooden Legs"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Product Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed description of the product..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="unit">Unit of Measure</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, unit: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitOptions.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Product Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as Product["category"] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="currentStock" className="text-sm font-medium">
                  Current Stock
                </label>
                <Input
                  id="currentStock"
                  name="currentStock"
                  type="number"
                  value={formData.currentStock}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="minStock" className="text-sm font-medium">
                  Min Stock
                </label>
                <Input
                  id="minStock"
                  name="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={handleChange}
                  placeholder="10"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="maxStock" className="text-sm font-medium">
                  Max Stock
                </label>
                <Input
                  id="maxStock"
                  name="maxStock"
                  type="number"
                  value={formData.maxStock}
                  onChange={handleChange}
                  placeholder="100"
                  min="1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="unitCost" className="text-sm font-medium">
                Unit Cost ($)
              </label>
              <Input
                id="unitCost"
                name="unitCost"
                type="number"
                step="0.01"
                value={formData.unitCost}
                onChange={handleChange}
                placeholder="15.00"
                min="0"
                required
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 bg-transparent">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingProduct ? "Updating..." : "Creating..."}
                  </>
                ) : editingProduct ? (
                  "Update Product"
                ) : (
                  "Create Product"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
