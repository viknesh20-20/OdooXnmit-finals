import type React from "react"
import type { ManufacturingOrder } from "@/types"
import { cn } from "@/lib/utils"

interface OrderStatusBadgeProps {
  status: ManufacturingOrder["status"]
  className?: string
}

export const OrderStatusBadge: React.FC<OrderStatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (status: ManufacturingOrder["status"]) => {
    switch (status) {
      case "planned":
        return {
          label: "Planned",
          className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
        }
      case "in-progress":
        return {
          label: "In Progress",
          className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
        }
      case "completed":
        return {
          label: "Completed",
          className: "bg-green-500/10 text-green-400 border-green-500/20",
        }
      case "cancelled":
        return {
          label: "Cancelled",
          className: "bg-red-500/10 text-red-400 border-red-500/20",
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
