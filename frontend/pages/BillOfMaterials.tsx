"use client"

import type React from "react"
import { useState } from "react"
import { useBOMs } from "@/hooks/useBOMs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BOMCard } from "@/components/bom/BOMCard"
import { CreateBOMModal } from "@/components/bom/CreateBOMModal"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { Plus, Search, Filter, Loader2, FileText, Package, Clock, Building2 } from "lucide-react"
import type { BOM } from "@/types"

export const BillOfMaterials: React.FC = () => {
  const { boms, loading, createBOM, updateBOM, deleteBOM, duplicateBOM } = useBOMs()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingBOM, setEditingBOM] = useState<BOM | null>(null)

  // Filter BOMs based on search and status
  const filteredBOMs = boms.filter((bom) => {
    const matchesSearch =
      (bom.productName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bom.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bom.version || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? bom.isActive : !bom.isActive)
    return matchesSearch && matchesStatus
  })

  // Calculate KPIs
  const kpis = {
    totalBOMs: boms.length,
    activeBOMs: boms.filter((bom) => bom.isActive).length,
    totalComponents: boms.reduce((sum, bom) => sum + (bom.components?.length || 0), 0),
    avgOperations: Math.round(boms.reduce((sum, bom) => sum + (bom.operations?.length || 0), 0) / (boms.length || 1)),
    avgCycleTime: Math.round(
      boms.reduce((sum, bom) => sum + (bom.operations || []).reduce((opSum, op) => opSum + (op.duration || 0), 0), 0) /
        (boms.length || 1),
    ),
  }

  const handleEdit = (bom: BOM) => {
    setEditingBOM(bom)
    setIsCreateModalOpen(true)
  }

  const handleSubmit = async (bomData: Omit<BOM, "id">) => {
    if (editingBOM) {
      await updateBOM(editingBOM.id, bomData)
      setEditingBOM(null)
    } else {
      await createBOM(bomData)
    }
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
    setEditingBOM(null)
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateBOM(id, { isActive })
  }

  const handleDuplicate = async (id: string) => {
    await duplicateBOM(id)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this BOM?")) {
      await deleteBOM(id)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Bills of Material</h1>
          <p className="text-muted-foreground">
            Define material requirements and manufacturing operations for your products
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create BOM
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total BOMs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalBOMs}</div>
            <div className="text-xs text-muted-foreground">{kpis.activeBOMs} active</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active BOMs</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{kpis.activeBOMs}</div>
            <div className="text-xs text-muted-foreground">Currently in use</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Components</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalComponents}</div>
            <div className="text-xs text-muted-foreground">Across all BOMs</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Operations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avgOperations}</div>
            <div className="text-xs text-muted-foreground">Per BOM</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cycle Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.avgCycleTime} min</div>
            <div className="text-xs text-muted-foreground">Manufacturing time</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search BOMs, products, or versions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">All BOMs</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BOMs Grid */}
      <div className="grid gap-6">
        {filteredBOMs.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No bills of material found</p>
            </CardContent>
          </Card>
        ) : (
          filteredBOMs.map((bom) => (
            <BOMCard
              key={bom.id}
              bom={bom}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onToggleActive={handleToggleActive}
            />
          ))
        )}
      </div>

      {/* Create/Edit BOM Modal */}
      <CreateBOMModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingBOM={editingBOM}
      />
      </div>
    </ErrorBoundary>
  )
}
