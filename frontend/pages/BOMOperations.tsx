"use client"

import type React from "react"
import { useState } from "react"
import { useBOMOperations } from "@/hooks/useBOMOperations"
import { useBOMs } from "@/hooks/useBOMs"
import { useWorkCenters } from "@/hooks/useWorkCenters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { Search, Filter, Loader2, Settings, Clock, DollarSign, Edit, Trash2 } from "lucide-react"
import type { BOMOperation } from "@/types"

// Predefined operation types
const OPERATION_TYPES = [
  { value: 'preparation', label: 'Preparation' },
  { value: 'machining', label: 'Machining' },
  { value: 'assembly', label: 'Assembly' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'finishing', label: 'Finishing' }
]



interface BOMOperationCardProps {
  operation: BOMOperation
  onEdit: (operation: BOMOperation) => void
  onDelete: (id: string) => void
}

const BOMOperationCard: React.FC<BOMOperationCardProps> = ({ operation, onEdit, onDelete }) => {
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-500" />
            {operation.operation}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={operation.operationType === 'machining' ? 'default' : 
                           operation.operationType === 'assembly' ? 'secondary' :
                           operation.operationType === 'inspection' ? 'outline' : 'destructive'}>
              {operation.operationType || 'General'}
            </Badge>
            <span className="text-sm text-muted-foreground">Seq: {operation.sequence}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Operation Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              <span className="font-medium">{operation.duration}min</span>
              {(operation.setupTime || operation.teardownTime) && (
                <span className="text-muted-foreground">
                  {' '}(+{(operation.setupTime || 0) + (operation.teardownTime || 0)}min setup/teardown)
                </span>
              )}
            </span>
          </div>
          {operation.totalCost && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">${operation.totalCost.toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Work Center */}
        {(operation.workCenterName || operation.workCenter) && (
          <div className="text-sm">
            <span className="text-muted-foreground">Work Center: </span>
            <span className="font-medium">{operation.workCenterName || operation.workCenter}</span>
          </div>
        )}

        {/* Description */}
        {operation.description && (
          <div className="text-sm text-muted-foreground">
            {operation.description}
          </div>
        )}



        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button
            onClick={() => onEdit(operation)}
            variant="outline"
            size="sm"
          >
            <Edit className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            onClick={() => onDelete(operation.id)}
            variant="outline"
            size="sm"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export const BOMOperations: React.FC = () => {
  const { operations, loading, error, fetchOperations, deleteOperation } = useBOMOperations({ autoFetch: false })
  const { boms } = useBOMs()
  const { workCenters } = useWorkCenters()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedBOM, setSelectedBOM] = useState("")
  const [selectedOperationType, setSelectedOperationType] = useState("")
  const [selectedWorkCenter, setSelectedWorkCenter] = useState("")


  const handleSearch = () => {
    fetchOperations({
      search: searchTerm || undefined,
      bomId: selectedBOM || undefined,
      operationType: selectedOperationType || undefined,
      workCenterId: selectedWorkCenter || undefined,
      sortBy: 'sequence',
      sortOrder: 'asc'
    })
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this operation?')) {
      try {
        await deleteOperation(id)
      } catch (error) {
        console.error('Failed to delete operation:', error)
      }
    }
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedBOM("")
    setSelectedOperationType("")
    setSelectedWorkCenter("")
    fetchOperations()
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">BOM Operations</h1>
            <p className="text-muted-foreground">
              Manage manufacturing operations for Bill of Materials
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search operations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">BOM</label>
                <Select value={selectedBOM} onValueChange={setSelectedBOM}>
                  <SelectTrigger>
                    <SelectValue placeholder="All BOMs" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All BOMs</SelectItem>
                    {boms.map((bom) => (
                      <SelectItem key={bom.id} value={bom.id}>
                        {bom.productName} v{bom.version}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Operation Type</label>
                <Select value={selectedOperationType} onValueChange={setSelectedOperationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    {OPERATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Work Center</label>
                <Select value={selectedWorkCenter} onValueChange={setSelectedWorkCenter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All work centers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All work centers</SelectItem>
                    {workCenters.map((wc) => (
                      <SelectItem key={wc.id} value={wc.id}>
                        {wc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSearch} className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Search
              </Button>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Operations Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading operations...</span>
          </div>
        ) : error ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => fetchOperations()} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : operations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Operations Found</h3>
              <p className="text-muted-foreground mb-4">
                No BOM operations match your current filters.
              </p>
              <Button onClick={clearFilters} variant="outline">
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {operations.map((operation) => (
              <BOMOperationCard
                key={operation.id}
                operation={operation}
                onEdit={(operation) => console.log('Edit operation:', operation)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}
