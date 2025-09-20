"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Package, AlertTriangle, TrendingUp, TrendingDown, Edit, Plus, Minus } from "lucide-react"
import type { Product } from "@/types"

interface ProductCardProps {
  product: Product
  onEdit: (product: Product) => void
  onStockAdjust: (id: string, quantity: number, type: "in" | "out") => void
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onEdit, onStockAdjust }) => {
  const [showAdjustment, setShowAdjustment] = useState(false)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState("")
  const [adjustmentType, setAdjustmentType] = useState<"in" | "out">("in")

  const getStockStatus = () => {
    if (product.currentStock <= product.minStock) {
      return { status: "low", color: "text-red-400", icon: AlertTriangle }
    }
    if (product.currentStock >= product.maxStock) {
      return { status: "high", color: "text-yellow-400", icon: TrendingUp }
    }
    return { status: "normal", color: "text-green-400", icon: Package }
  }

  const getCategoryBadge = () => {
    const colors = {
      "raw-material": "bg-blue-500/10 text-blue-400 border-blue-500/20",
      "finished-good": "bg-green-500/10 text-green-400 border-green-500/20",
      component: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    }

    const labels = {
      "raw-material": "Raw Material",
      "finished-good": "Finished Good",
      component: "Component",
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[product.category]}`}
      >
        {labels[product.category]}
      </span>
    )
  }

  const handleAdjustment = () => {
    const quantity = Number.parseInt(adjustmentQuantity)
    if (quantity > 0) {
      onStockAdjust(product.id, quantity, adjustmentType)
      setAdjustmentQuantity("")
      setShowAdjustment(false)
    }
  }

  const stockStatus = getStockStatus()
  const StatusIcon = stockStatus.icon

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg">{product.name}</CardTitle>
              {getCategoryBadge()}
            </div>
            <p className="text-sm text-muted-foreground">{product.description}</p>
            <p className="text-xs text-muted-foreground mt-1">#{product.id}</p>
          </div>
          <Button onClick={() => onEdit(product)} variant="outline" size="sm" className="bg-transparent">
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stock Level */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon className={`h-5 w-5 ${stockStatus.color}`} />
              <div>
                <div className="text-2xl font-bold">
                  {product.currentStock} {product.unit}
                </div>
                <div className="text-sm text-muted-foreground">Current Stock</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">${(product.currentStock * product.unitCost).toFixed(2)}</div>
              <div className="text-sm text-muted-foreground">Total Value</div>
            </div>
          </div>

          {/* Stock Range */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Stock Range</span>
              <span>
                {product.minStock} - {product.maxStock} {product.unit}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min((product.currentStock / product.maxStock) * 100, 100)}%`,
                  backgroundColor:
                    product.currentStock <= product.minStock
                      ? "#ef4444"
                      : product.currentStock >= product.maxStock
                        ? "#f59e0b"
                        : "#22c55e",
                }}
              />
            </div>
          </div>

          {/* Unit Cost */}
          <div className="flex justify-between text-sm">
            <span>Unit Cost</span>
            <span className="font-medium">${product.unitCost.toFixed(2)}</span>
          </div>

          {/* Stock Adjustment */}
          {!showAdjustment ? (
            <Button onClick={() => setShowAdjustment(true)} variant="outline" className="w-full bg-transparent">
              <Package className="mr-2 h-4 w-4" />
              Adjust Stock
            </Button>
          ) : (
            <div className="space-y-3 border-t border-border pt-4">
              <div className="flex gap-2">
                <Button
                  onClick={() => setAdjustmentType("in")}
                  variant={adjustmentType === "in" ? "default" : "outline"}
                  size="sm"
                  className={adjustmentType === "out" ? "bg-transparent" : ""}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Stock In
                </Button>
                <Button
                  onClick={() => setAdjustmentType("out")}
                  variant={adjustmentType === "out" ? "default" : "outline"}
                  size="sm"
                  className={adjustmentType === "in" ? "bg-transparent" : ""}
                >
                  <Minus className="mr-2 h-4 w-4" />
                  Stock Out
                </Button>
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={adjustmentQuantity}
                  onChange={(e) => setAdjustmentQuantity(e.target.value)}
                  min="1"
                />
                <Button onClick={handleAdjustment} disabled={!adjustmentQuantity}>
                  {adjustmentType === "in" ? (
                    <TrendingUp className="mr-2 h-4 w-4" />
                  ) : (
                    <TrendingDown className="mr-2 h-4 w-4" />
                  )}
                  Apply
                </Button>
              </div>
              <Button onClick={() => setShowAdjustment(false)} variant="ghost" size="sm" className="w-full">
                Cancel
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
