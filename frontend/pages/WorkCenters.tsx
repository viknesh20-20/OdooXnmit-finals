"use client"

import type React from "react"
import { useState } from "react"
import { useWorkCenters } from "@/hooks/useWorkCenters"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkCenterCard } from "@/components/work-centers/WorkCenterCard"
import { CreateWorkCenterModal } from "@/components/work-centers/CreateWorkCenterModal"
import { Plus, Search, Filter, Building2, Activity, DollarSign, TrendingUp, RefreshCw } from "lucide-react"
import { ErrorState, LoadingState } from "@/components/ui/error-state"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import type { WorkCenter } from "@/types"

export const WorkCenters: React.FC = () => {
  const { workCenters, loading, error, createWorkCenter, updateWorkCenter, refreshWorkCenters } = useWorkCenters()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<WorkCenter["status"] | "all">("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingWorkCenter, setEditingWorkCenter] = useState<WorkCenter | null>(null)

  // Filter work centers based on search and status
  const filteredWorkCenters = workCenters.filter((workCenter) => {
    const matchesSearch =
      workCenter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workCenter.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workCenter.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || workCenter.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate KPIs
  const kpis = {
    total: workCenters.length,
    active: workCenters.filter((wc) => wc.status === "active").length,
    maintenance: workCenters.filter((wc) => wc.status === "maintenance").length,
    inactive: workCenters.filter((wc) => wc.status === "inactive").length,
    avgUtilization: Math.round(workCenters.reduce((sum, wc) => sum + wc.utilization, 0) / (workCenters.length || 1)),
    totalCapacity: workCenters.reduce((sum, wc) => sum + wc.capacity, 0),
    avgCostPerHour: Math.round(workCenters.reduce((sum, wc) => sum + wc.costPerHour, 0) / (workCenters.length || 1)),
  }

  const handleStatusChange = async (id: string, status: WorkCenter["status"]) => {
    await updateWorkCenter(id, { status, utilization: status === "active" ? 75 : 0 })
  }

  const handleEdit = (workCenter: WorkCenter) => {
    setEditingWorkCenter(workCenter)
    setIsCreateModalOpen(true)
  }

  const handleSubmit = async (workCenterData: Omit<WorkCenter, "id">) => {
    if (editingWorkCenter) {
      await updateWorkCenter(editingWorkCenter.id, workCenterData)
      setEditingWorkCenter(null)
    } else {
      await createWorkCenter(workCenterData)
    }
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
    setEditingWorkCenter(null)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Work Centers</h1>
            <p className="text-muted-foreground">
              Manage machines, capacity, and monitor utilization across your facility
            </p>
          </div>
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            Create Work Center
          </Button>
        </div>
        <LoadingState message="Loading work centers..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Work Centers</h1>
            <p className="text-muted-foreground">
              Manage machines, capacity, and monitor utilization across your facility
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={refreshWorkCenters} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Work Center
            </Button>
          </div>
        </div>
        <ErrorState
          error={error}
          onRetry={refreshWorkCenters}
          title="Failed to load work centers"
          description="Unable to fetch work center data. Please check your connection and try again."
        />
      </div>
    )
  }

  return (
    <ErrorBoundary>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Centers</h1>
          <p className="text-muted-foreground">
            Manage machines, capacity, and monitor utilization across your facility
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshWorkCenters} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Work Center
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Work Centers</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total}</div>
            <div className="text-xs text-muted-foreground">
              {kpis.active} active, {kpis.maintenance} maintenance, {kpis.inactive} inactive
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Utilization</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{kpis.avgUtilization}%</div>
            <div className="text-xs text-muted-foreground">Across all work centers</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalCapacity}</div>
            <div className="text-xs text-muted-foreground">Combined capacity units</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Cost Rate</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis.avgCostPerHour}</div>
            <div className="text-xs text-muted-foreground">Per hour average</div>
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
                placeholder="Search work centers, names, or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as WorkCenter["status"] | "all")}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Centers Grid */}
      <div className="grid gap-6">
        {filteredWorkCenters.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No work centers found</p>
            </CardContent>
          </Card>
        ) : (
          filteredWorkCenters.map((workCenter) => (
            <WorkCenterCard
              key={workCenter.id}
              workCenter={workCenter}
              onStatusChange={handleStatusChange}
              onEdit={handleEdit}
            />
          ))
        )}
      </div>

      {/* Create/Edit Work Center Modal */}
      <CreateWorkCenterModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingWorkCenter={editingWorkCenter}
      />
    </div>
    </ErrorBoundary>
  )
}
