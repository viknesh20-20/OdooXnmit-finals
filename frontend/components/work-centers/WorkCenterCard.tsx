"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { WorkCenterStatusBadge } from "./WorkCenterStatusBadge"
import { UtilizationChart } from "./UtilizationChart"
import { DollarSign, Users, Settings, Play, Pause, Wrench } from "lucide-react"
import type { WorkCenter } from "@/types"

interface WorkCenterCardProps {
  workCenter: WorkCenter
  onStatusChange: (id: string, status: WorkCenter["status"]) => void
  onEdit: (workCenter: WorkCenter) => void
}

export const WorkCenterCard: React.FC<WorkCenterCardProps> = ({ workCenter, onStatusChange, onEdit }) => {
  const [isUpdating, setIsUpdating] = useState(false)

  const handleStatusChange = async (newStatus: WorkCenter["status"]) => {
    setIsUpdating(true)
    await onStatusChange(workCenter.id, newStatus)
    setIsUpdating(false)
  }

  const getStatusActions = () => {
    switch (workCenter.status) {
      case "active":
        return (
          <div className="flex gap-2">
            <Button
              onClick={() => handleStatusChange("maintenance")}
              variant="outline"
              size="sm"
              disabled={isUpdating}
              className="bg-transparent"
            >
              <Wrench className="mr-2 h-4 w-4" />
              Maintenance
            </Button>
            <Button
              onClick={() => handleStatusChange("inactive")}
              variant="outline"
              size="sm"
              disabled={isUpdating}
              className="bg-transparent"
            >
              <Pause className="mr-2 h-4 w-4" />
              Stop
            </Button>
          </div>
        )
      case "maintenance":
        return (
          <Button
            onClick={() => handleStatusChange("active")}
            size="sm"
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="mr-2 h-4 w-4" />
            Activate
          </Button>
        )
      case "inactive":
        return (
          <Button
            onClick={() => handleStatusChange("active")}
            size="sm"
            disabled={isUpdating}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="mr-2 h-4 w-4" />
            Start
          </Button>
        )
      default:
        return null
    }
  }

  return (
    <Card className="hover:bg-accent/50 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CardTitle className="text-lg">{workCenter.name}</CardTitle>
              <WorkCenterStatusBadge status={workCenter.status} />
            </div>
            <p className="text-sm text-muted-foreground">{workCenter.description}</p>
            <p className="text-xs text-muted-foreground mt-1">#{workCenter.id}</p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusActions()}
            <Button onClick={() => onEdit(workCenter)} variant="outline" size="sm" className="bg-transparent">
              <Settings className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Metrics */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">${workCenter.costPerHour}/hr</div>
                  <div className="text-xs text-muted-foreground">Cost Rate</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="font-medium">{workCenter.capacity}</div>
                  <div className="text-xs text-muted-foreground">Capacity</div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Utilization</span>
                <span className="font-medium">{workCenter.utilization}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${workCenter.utilization}%`,
                    backgroundColor:
                      workCenter.utilization >= 90
                        ? "#ef4444"
                        : workCenter.utilization >= 75
                          ? "#f59e0b"
                          : workCenter.utilization >= 50
                            ? "#22c55e"
                            : "#6b7280",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Utilization Chart */}
          <div className="flex justify-center">
            <UtilizationChart utilization={workCenter.utilization} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
