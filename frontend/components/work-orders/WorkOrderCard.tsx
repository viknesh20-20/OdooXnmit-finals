"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { WorkOrderStatusBadge } from "./WorkOrderStatusBadge"
import { Play, Pause, CheckCircle, Clock, User, Building2, MessageSquare, Calendar } from "lucide-react"
import type { WorkOrder } from "@/types"
import { format } from "date-fns"

interface WorkOrderCardProps {
  workOrder: WorkOrder
  onStart: (id: string) => void
  onPause: (id: string, comments?: string) => void
  onComplete: (id: string, comments?: string) => void
}

export const WorkOrderCard: React.FC<WorkOrderCardProps> = ({ workOrder, onStart, onPause, onComplete }) => {
  const [showCommentInput, setShowCommentInput] = useState(false)
  const [comment, setComment] = useState("")

  const handleAction = (action: "start" | "pause" | "complete") => {
    switch (action) {
      case "start":
        onStart(workOrder.id)
        break
      case "pause":
        onPause(workOrder.id, comment || undefined)
        setComment("")
        setShowCommentInput(false)
        break
      case "complete":
        onComplete(workOrder.id, comment || undefined)
        setComment("")
        setShowCommentInput(false)
        break
    }
  }

  const getActionButton = () => {
    switch (workOrder.status) {
      case "pending":
        return (
          <Button onClick={() => handleAction("start")} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Play className="mr-2 h-4 w-4" />
            Start
          </Button>
        )
      case "in-progress":
        return (
          <div className="flex gap-2">
            <Button onClick={() => setShowCommentInput(true)} variant="outline" size="sm" className="bg-transparent">
              <Pause className="mr-2 h-4 w-4" />
              Pause
            </Button>
            <Button onClick={() => setShowCommentInput(true)} size="sm" className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete
            </Button>
          </div>
        )
      case "paused":
        return (
          <div className="flex gap-2">
            <Button onClick={() => handleAction("start")} size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Play className="mr-2 h-4 w-4" />
              Resume
            </Button>
            <Button onClick={() => setShowCommentInput(true)} size="sm" className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="mr-2 h-4 w-4" />
              Complete
            </Button>
          </div>
        )
      case "completed":
        return (
          <div className="flex items-center text-green-400 text-sm">
            <CheckCircle className="mr-2 h-4 w-4" />
            Completed
          </div>
        )
      default:
        return null
    }
  }

  const calculateDuration = () => {
    if (workOrder.startTime && workOrder.endTime) {
      const start = new Date(workOrder.startTime)
      const end = new Date(workOrder.endTime)
      const diffMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
      return `${diffMinutes} min`
    }
    if (workOrder.startTime && workOrder.status === "in-progress") {
      const start = new Date(workOrder.startTime)
      const now = new Date()
      const diffMinutes = Math.floor((now.getTime() - start.getTime()) / (1000 * 60))
      return `${diffMinutes} min (running)`
    }
    return `${workOrder.duration} min (estimated)`
  }

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{workOrder.operation}</h3>
              <WorkOrderStatusBadge status={workOrder.status} />
              <span className="text-sm text-muted-foreground">#{workOrder.id}</span>
            </div>
            <p className="text-sm text-muted-foreground">MO: {workOrder.manufacturingOrderId}</p>
          </div>
          {getActionButton()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span>{workOrder.workCenter}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-muted-foreground" />
            <span>{workOrder.assignee}</span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{calculateDuration()}</span>
          </div>
        </div>

        {workOrder.startTime && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>Started: {format(new Date(workOrder.startTime), "MMM dd, yyyy HH:mm")}</span>
            </div>
            {workOrder.endTime && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Completed: {format(new Date(workOrder.endTime), "MMM dd, yyyy HH:mm")}</span>
              </div>
            )}
          </div>
        )}

        {workOrder.comments && (
          <div className="flex items-start gap-2 text-sm bg-muted/50 p-3 rounded-md">
            <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span>{workOrder.comments}</span>
          </div>
        )}

        {showCommentInput && (
          <div className="mt-4 space-y-3 border-t border-border pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Add Comment (Optional)</label>
              <Input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Enter any notes or issues..."
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              {workOrder.status === "in-progress" && (
                <>
                  <Button onClick={() => handleAction("pause")} variant="outline" size="sm" className="bg-transparent">
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </Button>
                  <Button
                    onClick={() => handleAction("complete")}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete
                  </Button>
                </>
              )}
              {workOrder.status === "paused" && (
                <Button onClick={() => handleAction("complete")} size="sm" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Complete
                </Button>
              )}
              <Button onClick={() => setShowCommentInput(false)} variant="ghost" size="sm">
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
