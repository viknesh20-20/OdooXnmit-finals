import type React from "react"
import type { WorkCenter } from "@/types"
import { cn } from "@/lib/utils"

interface WorkCenterStatusBadgeProps {
  status: WorkCenter["status"]
  className?: string
}

export const WorkCenterStatusBadge: React.FC<WorkCenterStatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (status: WorkCenter["status"]) => {
    switch (status) {
      case "active":
        return {
          label: "Active",
          className: "bg-green-500/10 text-green-400 border-green-500/20",
        }
      case "maintenance":
        return {
          label: "Maintenance",
          className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        }
      case "inactive":
        return {
          label: "Inactive",
          className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        }
      default:
        return {
          label: "Unknown",
          className: "bg-gray-500/10 text-gray-400 border-gray-500/20",
        }
    }
  }

  const config = getStatusConfig(status)

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  )
}
