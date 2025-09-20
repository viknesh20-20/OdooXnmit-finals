"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import { Calendar, Clock, User, Package, Factory, AlertCircle, CheckCircle2, XCircle, Pause } from "lucide-react"
import type { ManufacturingOrder } from "@/types"
import { format } from "date-fns"

interface ManufacturingOrderDetailProps {
  order: ManufacturingOrder | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (order: ManufacturingOrder) => void
}

export const ManufacturingOrderDetail: React.FC<ManufacturingOrderDetailProps> = ({
  order,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!order) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <Clock className="h-4 w-4 text-blue-500" />
      case "paused":
        return <Pause className="h-4 w-4 text-yellow-500" />
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "in-progress":
        return "bg-blue-100 text-blue-800"
      case "paused":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      case "planned":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "low":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">{order.reference}</DialogTitle>
              <DialogDescription className="text-lg mt-1">
                Manufacturing Order Details
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(order.status)}
              <Badge className={getStatusColor(order.status)}>
                {order.status.replace("-", " ").toUpperCase()}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Product</label>
                  <p className="text-sm font-semibold">{order.productName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Quantity</label>
                  <p className="text-sm font-semibold">{order.quantity} units</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">BOM Reference</label>
                  <p className="text-sm font-semibold">{order.bomName || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Priority</label>
                  <Badge className={getPriorityColor(order.priority || "medium")}>
                    {(order.priority || "medium").toUpperCase()}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule & Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="text-sm font-semibold">
                    {format(new Date(order.startDate), "MMM dd, yyyy 'at' HH:mm")}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Due Date</label>
                  <p className={`text-sm font-semibold ${
                    new Date(order.dueDate) < new Date() && order.status !== "completed" 
                      ? "text-red-600" : "text-gray-900"
                  }`}>
                    {format(new Date(order.dueDate), "MMM dd, yyyy 'at' HH:mm")}
                    {new Date(order.dueDate) < new Date() && order.status !== "completed" && (
                      <span className="ml-2 text-xs text-red-500">(OVERDUE)</span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Estimated Duration</label>
                  <p className="text-sm font-semibold">{order.totalDuration} minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Assignment & Work Center
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned To</label>
                  <p className="text-sm font-semibold">{order.assigneeName || order.assignee || "Unassigned"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Work Center</label>
                  <p className="text-sm font-semibold">{order.workCenterName || "Not specified"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <p className="text-sm font-semibold">{order.createdBy || "System"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Production Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Progress</label>
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${order.progress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm font-semibold mt-1">{order.progress}%</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Completed Qty</label>
                  <p className="text-sm font-semibold">{order.completedQuantity} / {order.quantity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Scrap Quantity</label>
                  <p className="text-sm font-semibold text-red-600">{order.scrapQuantity || 0} units</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Work Orders</label>
                  <p className="text-sm font-semibold">{order.workOrders?.length || 0} operations</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes Section */}
        {order.notes && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{order.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Work Orders Section */}
        {order.workOrders && order.workOrders.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Work Orders</CardTitle>
              <CardDescription>Associated operations and tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.workOrders.map((workOrder, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{workOrder.operation || `Operation ${index + 1}`}</p>
                      <p className="text-sm text-gray-500">
                        {workOrder.workCenter} • {workOrder.duration} min
                      </p>
                    </div>
                    <Badge className={getStatusColor(workOrder.status)}>
                      {workOrder.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="border-t my-6" />

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onEdit && (
            <Button onClick={() => onEdit(order)}>
              Edit Order
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}