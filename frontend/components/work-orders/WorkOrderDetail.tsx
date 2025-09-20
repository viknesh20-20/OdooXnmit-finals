"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Calendar, Clock, User, Factory, AlertCircle, CheckCircle2, XCircle, Pause, PlayCircle } from "lucide-react"
import type { WorkOrder } from "@/types"
import { format } from "date-fns"

interface WorkOrderDetailProps {
  workOrder: WorkOrder | null
  isOpen: boolean
  onClose: () => void
  onEdit?: (workOrder: WorkOrder) => void
}

export const WorkOrderDetail: React.FC<WorkOrderDetailProps> = ({
  workOrder,
  isOpen,
  onClose,
  onEdit,
}) => {
  if (!workOrder) return null

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case "in-progress":
        return <PlayCircle className="h-4 w-4 text-blue-500" />
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
      case "pending":
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold">
                {workOrder.reference || `Work Order ${workOrder.id}`}
              </DialogTitle>
              <DialogDescription className="text-lg mt-1">
                Work Order Details
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(workOrder.status)}
              <Badge className={getStatusColor(workOrder.status)}>
                {workOrder.status.replace("-", " ").toUpperCase()}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Operation Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Factory className="h-5 w-5" />
                Operation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Operation</label>
                  <p className="text-sm font-semibold">{workOrder.operation}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Operation Type</label>
                  <p className="text-sm font-semibold">{workOrder.operationType || "N/A"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Work Center</label>
                  <p className="text-sm font-semibold">
                    {workOrder.workCenterName || workOrder.workCenter || "Not specified"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Sequence</label>
                  <p className="text-sm font-semibold">{workOrder.sequence || "N/A"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assignment & Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Assignment & Priority
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Assigned To</label>
                  <p className="text-sm font-semibold">
                    {workOrder.assigneeName || workOrder.assignee || "Unassigned"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Manufacturing Order</label>
                  <p className="text-sm font-semibold">
                    {workOrder.manufacturingOrderRef || workOrder.manufacturingOrderId}
                  </p>
                </div>
                {workOrder.priority && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Priority</label>
                    <Badge className={getPriorityColor(workOrder.priority)}>
                      {workOrder.priority.toUpperCase()}
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Time Tracking */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Time Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p className="text-sm font-semibold">{workOrder.duration} minutes</p>
                </div>
                {workOrder.estimatedDuration && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Estimated</label>
                    <p className="text-sm font-semibold">{workOrder.estimatedDuration} minutes</p>
                  </div>
                )}
                {workOrder.actualDuration && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Actual</label>
                    <p className="text-sm font-semibold">{workOrder.actualDuration} minutes</p>
                  </div>
                )}
                {workOrder.pauseTime && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Pause Time</label>
                    <p className="text-sm font-semibold">{workOrder.pauseTime} minutes</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                {workOrder.startTime && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Start Time</label>
                    <p className="text-sm font-semibold">
                      {format(new Date(workOrder.startTime), "MMM dd, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                )}
                {workOrder.endTime && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">End Time</label>
                    <p className="text-sm font-semibold">
                      {format(new Date(workOrder.endTime), "MMM dd, yyyy 'at' HH:mm")}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dependencies */}
        {workOrder.dependencies && workOrder.dependencies.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Dependencies</CardTitle>
              <CardDescription>Other work orders that must be completed first</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {workOrder.dependencies.map((dep, index) => (
                  <Badge key={index} variant="outline">
                    {dep}
                  </Badge>
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
            <Button onClick={() => onEdit(workOrder)}>
              Edit Work Order
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}