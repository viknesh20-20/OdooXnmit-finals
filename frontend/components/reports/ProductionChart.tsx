"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProductionData {
  completionRate: number
  avgCycleTime: number
}

interface ProductionChartProps {
  data: ProductionData
}

export const ProductionChart: React.FC<ProductionChartProps> = ({ data }) => {
  // Mock chart data - in a real app, this would use a charting library like Recharts
  const chartData = [
    { month: "Jan", completed: 85, planned: 100 },
    { month: "Feb", completed: 92, planned: 100 },
    { month: "Mar", completed: 78, planned: 100 },
    { month: "Apr", completed: 88, planned: 100 },
    { month: "May", completed: 95, planned: 100 },
    { month: "Jun", completed: 89, planned: 100 },
  ]

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">Production Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-gray-300 text-sm w-12">{item.month}</span>
              <div className="flex-1 mx-4">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${item.completed}%` }}
                  />
                </div>
              </div>
              <span className="text-gray-300 text-sm w-12 text-right">{item.completed}%</span>
            </div>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-green-400">{data.completionRate}%</p>
            <p className="text-gray-400 text-sm">Avg Completion</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-400">{data.avgCycleTime}</p>
            <p className="text-gray-400 text-sm">Avg Cycle Time</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
