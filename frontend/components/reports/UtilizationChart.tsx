"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface WorkCenterUtilization {
  workCenter: string
  utilization: number
}

interface UtilizationChartProps {
  data: WorkCenterUtilization[]
}

export const UtilizationChart: React.FC<UtilizationChartProps> = ({ data }) => {
  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Work Center Utilization</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">{item.workCenter}</span>
                <span className="text-gray-300">{item.utilization}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${item.utilization}%`,
                    backgroundColor:
                      item.utilization >= 90
                        ? "#ef4444"
                        : item.utilization >= 75
                          ? "#f59e0b"
                          : item.utilization >= 50
                            ? "#22c55e"
                            : "#6b7280",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
