"use client"

import type React from "react"
import { useState } from "react"
import { useWorkOrders } from "@/hooks/useWorkOrders"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { WorkOrderCard } from "@/components/work-orders/WorkOrderCard"
import { CreateWorkOrderModal } from "@/components/work-orders/CreateWorkOrderModal"
import { Plus, Search, Filter, Loader2, Clock } from "lucide-react"
import type { WorkOrder } from "@/types"

export const WorkOrders: React.FC = () => {
  const { workOrders, loading, startWorkOrder, pauseWorkOrder, completeWorkOrder, createWorkOrder } = useWorkOrders()
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<WorkOrder["status"] | "all">("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  // Filter work orders based on search and status
  const filteredWorkOrders = workOrders.filter((workOrder) => {
    const matchesSearch =
      workOrder.operation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (workOrder.assignee || workOrder.assigneeName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (workOrder.workCenter || workOrder.workCenterName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      workOrder.manufacturingOrderId.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || workOrder.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Calculate KPIs
  const kpis = {
    total: workOrders.length,
    pending: workOrders.filter((wo) => wo.status === "pending").length,
    inProgress: workOrders.filter((wo) => wo.status === "in-progress").length,
    paused: workOrders.filter((wo) => wo.status === "paused").length,
    completed: workOrders.filter((wo) => wo.status === "completed").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Work Orders</h1>
          <p className="text-muted-foreground">Manage and execute manufacturing operations with real-time tracking</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Work Order
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="h-2 w-2 rounded-full bg-gray-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">{kpis.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{kpis.inProgress}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paused</CardTitle>
            <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{kpis.paused}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{kpis.completed}</div>
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
                placeholder="Search work orders, operations, assignees, or work centers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as WorkOrder["status"] | "all")}
                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Work Orders List */}
      <div className="grid gap-4">
        {filteredWorkOrders.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">No work orders found</p>
            </CardContent>
          </Card>
        ) : (
          filteredWorkOrders.map((workOrder) => (
            <WorkOrderCard
              key={workOrder.id}
              workOrder={workOrder}
              onStart={startWorkOrder}
              onPause={pauseWorkOrder}
              onComplete={completeWorkOrder}
            />
          ))
        )}
      </div>

      {/* Create Work Order Modal */}
      <CreateWorkOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={createWorkOrder}
      />
    </div>
  )
}
