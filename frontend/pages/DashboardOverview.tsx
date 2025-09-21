"use client"

import React from "react"
import { useNavigate } from "react-router-dom"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Package,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlayCircle,
  Factory,
  Wrench,
  ClipboardList,
  Archive,
  Calendar,
  Activity,
  ArrowRight,
} from "lucide-react"
import { useManufacturingOrders } from "@/hooks/useManufacturingOrders"
import { useWorkOrders } from "@/hooks/useWorkOrders"
import { useWorkCenters } from "@/hooks/useWorkCenters"
import { useProducts } from "@/hooks/useProducts"
import { useStockMovements } from "@/hooks/useStockMovements"
import { formatDistanceToNow } from "date-fns"

export const DashboardOverview: React.FC = () => {
  const navigate = useNavigate()
  const { orders } = useManufacturingOrders()
  const { workOrders } = useWorkOrders()
  const { workCenters } = useWorkCenters()
  const { products } = useProducts()
  const { movements } = useStockMovements()



  // Calculate KPIs
  const totalOrders = orders.length
  const completedOrders = orders.filter(o => o.status === "completed").length
  const inProgressOrders = orders.filter(o => o.status === "in-progress").length
  const plannedOrders = orders.filter(o => o.status === "planned").length
  const delayedOrders = orders.filter(o => {
    const dueDate = new Date(o.dueDate)
    const today = new Date()
    return o.status !== "completed" && dueDate < today
  }).length

  const activeWorkOrders = workOrders.filter(wo => wo.status === "in-progress").length
  const pendingWorkOrders = workOrders.filter(wo => wo.status === "pending").length
  const completedWorkOrders = workOrders.filter(wo => wo.status === "completed").length

  const activeWorkCenters = workCenters.filter(wc => wc.status === "active").length
  const maintenanceWorkCenters = workCenters.filter(wc => wc.status === "maintenance").length
  
  const lowStockProducts = products.filter(p => p.currentStock <= p.minStock).length
  const totalProducts = products.length

  // Recent activities
  const recentMovements = movements
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5)

  const recentOrders = orders
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)

  // Quick stats cards
  const statsCards = [
    {
      title: "Manufacturing Orders",
      value: totalOrders,
      change: "+12%",
      changeType: "increase" as const,
      icon: Factory,
      color: "bg-blue-500",
      onClick: () => navigate("/dashboard/manufacturing-orders"),
      details: [
        { label: "Completed", value: completedOrders, color: "text-green-600" },
        { label: "In Progress", value: inProgressOrders, color: "text-blue-600" },
        { label: "Planned", value: plannedOrders, color: "text-gray-600" },
        { label: "Delayed", value: delayedOrders, color: "text-red-600" },
      ]
    },
    {
      title: "Work Orders",
      value: workOrders.length,
      change: "+8%",
      changeType: "increase" as const,
      icon: ClipboardList,
      color: "bg-green-500",
      onClick: () => navigate("/dashboard/work-orders"),
      details: [
        { label: "Active", value: activeWorkOrders, color: "text-green-600" },
        { label: "Pending", value: pendingWorkOrders, color: "text-yellow-600" },
        { label: "Completed", value: completedWorkOrders, color: "text-gray-600" },
      ]
    },
    {
      title: "Work Centers",
      value: workCenters.length,
      change: "0%",
      changeType: "neutral" as const,
      icon: Wrench,
      color: "bg-purple-500",
      onClick: () => navigate("/dashboard/work-centers"),
      details: [
        { label: "Active", value: activeWorkCenters, color: "text-green-600" },
        { label: "Maintenance", value: maintenanceWorkCenters, color: "text-orange-600" },
      ]
    },
    {
      title: "Inventory",
      value: totalProducts,
      change: "-2%",
      changeType: "decrease" as const,
      icon: Package,
      color: "bg-orange-500",
      onClick: () => navigate("/dashboard/stock-ledger"),
      details: [
        { label: "Low Stock", value: lowStockProducts, color: "text-red-600" },
        { label: "Total Products", value: totalProducts, color: "text-gray-600" },
      ]
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your manufacturing operations.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <Card key={index} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={card.onClick}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`p-2 rounded-full ${card.color}`}>
                <card.icon className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <span className={`flex items-center ${
                  card.changeType === 'increase' ? 'text-green-600' : 
                  card.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                }`}>
                  {card.changeType === 'increase' ? <TrendingUp className="h-3 w-3 mr-1" /> :
                   card.changeType === 'decrease' ? <TrendingDown className="h-3 w-3 mr-1" /> : 
                   <BarChart3 className="h-3 w-3 mr-1" />}
                  {card.change}
                </span>
                <span>from last month</span>
              </div>
              <div className="mt-3 space-y-1">
                {card.details.map((detail, idx) => (
                  <div key={idx} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{detail.label}</span>
                    <span className={detail.color}>{detail.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Quick Actions
          </CardTitle>
          <CardDescription>Frequently used operations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => navigate("/dashboard/manufacturing-orders")}
            >
              <Factory className="h-6 w-6" />
              New Manufacturing Order
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => navigate("/dashboard/work-orders")}
            >
              <ClipboardList className="h-6 w-6" />
              Create Work Order
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => navigate("/dashboard/stock-ledger")}
            >
              <Package className="h-6 w-6" />
              Add Product
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col space-y-2"
              onClick={() => navigate("/dashboard/bom")}
            >
              <Archive className="h-6 w-6" />
              Create BOM
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Manufacturing Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Recent Manufacturing Orders
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/dashboard/manufacturing-orders")}
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{order.productName}</div>
                    <div className="text-sm text-muted-foreground">
                      Qty: {order.quantity} • Due: {new Date(order.dueDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      order.status === 'completed' ? 'default' :
                      order.status === 'in-progress' ? 'secondary' :
                      order.status === 'planned' ? 'outline' : 'destructive'
                    }>
                      {order.status}
                    </Badge>
                    {order.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    {order.status === 'in-progress' && <PlayCircle className="h-4 w-4 text-blue-500" />}
                    {order.status === 'planned' && <Clock className="h-4 w-4 text-gray-500" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Stock Movements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Recent Stock Movements
              </span>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/dashboard/stock-ledger")}
              >
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentMovements.map((movement) => (
                <div key={movement.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{movement.productName}</div>
                    <div className="text-sm text-muted-foreground">
                      {movement.type === 'in' ? '+' : '-'}{movement.quantity} • {formatDistanceToNow(new Date(movement.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={movement.type === 'in' ? 'default' : 'secondary'}>
                      {movement.type === 'in' ? 'IN' : 'OUT'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts & Notifications */}
      {(delayedOrders > 0 || lowStockProducts > 0 || maintenanceWorkCenters > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Alerts & Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {delayedOrders > 0 && (
                <div className="flex items-center justify-between p-2 bg-red-50 border border-red-200 rounded">
                  <span className="text-red-800">
                    {delayedOrders} manufacturing order{delayedOrders > 1 ? 's' : ''} overdue
                  </span>
                  <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/manufacturing-orders")}>
                    Review
                  </Button>
                </div>
              )}
              {lowStockProducts > 0 && (
                <div className="flex items-center justify-between p-2 bg-yellow-50 border border-yellow-200 rounded">
                  <span className="text-yellow-800">
                    {lowStockProducts} product{lowStockProducts > 1 ? 's' : ''} running low on stock
                  </span>
                  <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/stock-ledger")}>
                    Review
                  </Button>
                </div>
              )}
              {maintenanceWorkCenters > 0 && (
                <div className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded">
                  <span className="text-orange-800">
                    {maintenanceWorkCenters} work center{maintenanceWorkCenters > 1 ? 's' : ''} under maintenance
                  </span>
                  <Button size="sm" variant="outline" onClick={() => navigate("/dashboard/work-centers")}>
                    Review
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}