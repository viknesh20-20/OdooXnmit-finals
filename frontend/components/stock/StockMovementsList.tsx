"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Package, ShoppingCart, Settings } from "lucide-react"
import type { StockMovement } from "@/types"
import { format } from "date-fns"

interface StockMovementsListProps {
  movements: StockMovement[]
}

export const StockMovementsList: React.FC<StockMovementsListProps> = ({ movements }) => {
  const getMovementIcon = (type: StockMovement["type"]) => {
    return type === "in" ? TrendingUp : TrendingDown
  }

  const getReferenceIcon = (referenceType: StockMovement["referenceType"]) => {
    switch (referenceType) {
      case "manufacturing-order":
        return Package
      case "purchase":
        return ShoppingCart
      case "adjustment":
        return Settings
      default:
        return Package
    }
  }

  const getMovementColor = (type: StockMovement["type"]) => {
    return type === "in" ? "text-green-400" : "text-red-400"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Stock Movements</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {movements.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No stock movements found</p>
          ) : (
            movements.map((movement) => {
              const MovementIcon = getMovementIcon(movement.type)
              const ReferenceIcon = getReferenceIcon(movement.referenceType)

              return (
                <div key={movement.id} className="flex items-center gap-4 p-4 border border-border rounded-lg">
                  <div className={`p-2 rounded-full bg-muted ${getMovementColor(movement.type)}`}>
                    <MovementIcon className="h-4 w-4" />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{movement.productName}</span>
                      <span className={`text-sm font-medium ${getMovementColor(movement.type)}`}>
                        {movement.type === "in" ? "+" : "-"}
                        {movement.quantity}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ReferenceIcon className="h-3 w-3" />
                      <span>{movement.reference}</span>
                      <span>•</span>
                      <span>{format(new Date(movement.timestamp), "MMM dd, yyyy HH:mm")}</span>
                    </div>
                    {movement.notes && <p className="text-sm text-muted-foreground mt-1">{movement.notes}</p>}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </CardContent>
    </Card>
  )
}
