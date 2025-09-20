"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Clock, Building2, Copy, Edit, Trash2, Eye, EyeOff } from "lucide-react"
import type { BOM } from "@/types"

interface BOMCardProps {
  bom: BOM
  onEdit: (bom: BOM) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, isActive: boolean) => void
}

export const BOMCard: React.FC<BOMCardProps> = ({ bom, onEdit, onDuplicate, onDelete, onToggleActive }) => {
  const [showDetails, setShowDetails] = useState(false)

  const totalDuration = bom.operations.reduce((sum, op) => sum + op.duration, 0)
  const totalComponents = bom.components.length

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg">{bom.productName}</CardTitle>
              <Badge variant={bom.isActive ? "default" : "secondary"}>{bom.version}</Badge>
              {bom.isActive && <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Active</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">#{bom.id}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => onToggleActive(bom.id, !bom.isActive)}
              variant="outline"
              size="sm"
              className="bg-transparent"
            >
              {bom.isActive ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
              {bom.isActive ? "Deactivate" : "Activate"}
            </Button>
            <Button onClick={() => onDuplicate(bom.id)} variant="outline" size="sm" className="bg-transparent">
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Button onClick={() => onEdit(bom)} variant="outline" size="sm" className="bg-transparent">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              onClick={() => onDelete(bom.id)}
              variant="outline"
              size="sm"
              className="bg-transparent text-red-400 hover:text-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Package className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{totalComponents} Components</div>
                <div className="text-xs text-muted-foreground">Raw materials needed</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{bom.operations.length} Operations</div>
                <div className="text-xs text-muted-foreground">Manufacturing steps</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">{totalDuration} min</div>
                <div className="text-xs text-muted-foreground">Total cycle time</div>
              </div>
            </div>
          </div>

          {/* Toggle Details */}
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
            size="sm"
            className="w-full justify-center"
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>

          {/* Detailed View */}
          {showDetails && (
            <div className="space-y-4 border-t border-border pt-4">
              {/* Components */}
              <div>
                <h4 className="font-medium mb-2">Components</h4>
                <div className="space-y-2">
                  {bom.components.map((component) => (
                    <div
                      key={component.id}
                      className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded"
                    >
                      <span>{component.productName}</span>
                      <span className="font-medium">
                        {component.quantity} {component.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Operations */}
              <div>
                <h4 className="font-medium mb-2">Operations</h4>
                <div className="space-y-2">
                  {bom.operations
                    .sort((a, b) => a.sequence - b.sequence)
                    .map((operation) => (
                      <div
                        key={operation.id}
                        className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded"
                      >
                        <div>
                          <span className="font-medium">
                            {operation.sequence}. {operation.operation}
                          </span>
                          <div className="text-xs text-muted-foreground">{operation.workCenter}</div>
                        </div>
                        <span className="font-medium">{operation.duration} min</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
