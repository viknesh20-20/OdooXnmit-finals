"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { X, Loader2 } from "lucide-react"
import type { StockMovement, Product } from "@/types"
import { useProducts } from "@/hooks/useProducts"

interface StockMovementModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (movementData: Omit<StockMovement, "id">) => Promise<void>
  editingMovement?: StockMovement | null
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingMovement
}) => {
  const { products } = useProducts()
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState({
    productId: editingMovement?.productId || "",
    type: editingMovement?.type || "in" as "in" | "out",
    quantity: editingMovement?.quantity || 1,
    unit: editingMovement?.unit || "pieces",
    unitCost: editingMovement?.unitCost || 0,
    reference: editingMovement?.reference || `MOV-${Date.now()}`,
    referenceType: editingMovement?.referenceType || "adjustment" as StockMovement["referenceType"],
    fromLocation: editingMovement?.fromLocation || "",
    toLocation: editingMovement?.toLocation || "",
    notes: editingMovement?.notes || ""
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.productId) {
      newErrors.productId = 'Product is required'
    }
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0'
    }
    if (!formData.reference.trim()) {
      newErrors.reference = 'Reference is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    try {
      const selectedProduct = products.find(p => p.id === formData.productId)
      const movementData: Omit<StockMovement, "id"> = {
        ...formData,
        productName: selectedProduct?.name || "",
        totalValue: formData.quantity * formData.unitCost,
        timestamp: new Date().toISOString()
      }

      await onSubmit(movementData)
      // Clear any previous errors on successful submission
      setErrors({})
      onClose()
    } catch (error) {
      console.error('Failed to save stock movement:', error)

      // Extract validation errors from API response
      let errorMessage = 'Failed to save stock movement'
      if (error instanceof Error) {
        errorMessage = error.message
      }

      // Set a general error that can be displayed to the user
      setErrors({ submit: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field-specific errors and submit errors when user starts typing
    if (errors[field] || errors.submit) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        delete newErrors.submit
        return newErrors
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{editingMovement ? 'Edit Stock Movement' : 'Create Stock Movement'}</CardTitle>
              <CardDescription>
                {editingMovement ? 'Update stock movement details' : 'Record a new stock movement transaction'}
              </CardDescription>
            </div>
            <Button onClick={onClose} variant="ghost" size="sm">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productId">Product *</Label>
                <Select value={formData.productId} onValueChange={(value) => handleInputChange('productId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name} ({product.sku})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.productId && <p className="text-sm text-red-500">{errors.productId}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Movement Type *</Label>
                <Select value={formData.type} onValueChange={(value: "in" | "out") => handleInputChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Stock In</SelectItem>
                    <SelectItem value="out">Stock Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                  placeholder="Enter quantity"
                />
                {errors.quantity && <p className="text-sm text-red-500">{errors.quantity}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  placeholder="pieces, kg, liters, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unitCost">Unit Cost</Label>
                <Input
                  id="unitCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.unitCost}
                  onChange={(e) => handleInputChange('unitCost', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referenceType">Reference Type</Label>
                <Select value={formData.referenceType} onValueChange={(value: StockMovement["referenceType"]) => handleInputChange('referenceType', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manufacturing_order">Manufacturing Order</SelectItem>
                    <SelectItem value="purchase_order">Purchase Order</SelectItem>
                    <SelectItem value="sales_order">Sales Order</SelectItem>
                    <SelectItem value="adjustment">Adjustment</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="reference">Reference *</Label>
              <Input
                id="reference"
                value={formData.reference}
                onChange={(e) => handleInputChange('reference', e.target.value)}
                placeholder="Reference number or identifier"
              />
              {errors.reference && <p className="text-sm text-red-500">{errors.reference}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fromLocation">From Location</Label>
                <Input
                  id="fromLocation"
                  value={formData.fromLocation}
                  onChange={(e) => handleInputChange('fromLocation', e.target.value)}
                  placeholder="Source location"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="toLocation">To Location</Label>
                <Input
                  id="toLocation"
                  value={formData.toLocation}
                  onChange={(e) => handleInputChange('toLocation', e.target.value)}
                  placeholder="Destination location"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes or comments"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingMovement ? 'Update Movement' : 'Create Movement'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
