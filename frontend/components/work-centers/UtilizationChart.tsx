"use client"

import type React from "react"

interface UtilizationChartProps {
  utilization: number
}

export const UtilizationChart: React.FC<UtilizationChartProps> = ({ utilization }) => {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (utilization / 100) * circumference

  const getColor = (utilization: number) => {
    if (utilization >= 90) return "#ef4444" // red
    if (utilization >= 75) return "#f59e0b" // yellow
    if (utilization >= 50) return "#22c55e" // green
    return "#6b7280" // gray
  }

  return (
    <div className="relative w-24 h-24">
      <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="8"
          fill="transparent"
          className="text-muted"
        />
        {/* Progress circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke={getColor(utilization)}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold" style={{ color: getColor(utilization) }}>
          {utilization}%
        </span>
      </div>
    </div>
  )
}
