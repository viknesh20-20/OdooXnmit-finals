"use client"

import { useState, useEffect } from "react"

interface ReportData {
  productionSummary: {
    completionRate: number
    avgCycleTime: number
  }
  qualityMetrics: {
    firstPassYield: number
    defectRate: number
  }
  workCenterUtilization: Array<{
    workCenter: string
    utilization: number
  }>
  inventoryReport: {
    totalProducts: number
    lowStockItems: number
    totalValue: number
    categoryBreakdown: Array<{
      category: string
      count: number
      value: number
    }>
  }
}

const mockReportData: ReportData = {
  productionSummary: {
    completionRate: 87,
    avgCycleTime: 3.2,
  },
  qualityMetrics: {
    firstPassYield: 94,
    defectRate: 2.1,
  },
  workCenterUtilization: [
    { workCenter: "Assembly Line A", utilization: 85 },
    { workCenter: "Paint Booth 1", utilization: 72 },
    { workCenter: "CNC Machine 1", utilization: 0 },
    { workCenter: "Assembly Line B", utilization: 65 },
    { workCenter: "Quality Control", utilization: 90 },
  ],
  inventoryReport: {
    totalProducts: 6,
    lowStockItems: 2,
    totalValue: 12450,
    categoryBreakdown: [
      { category: "Raw Materials", count: 4, value: 8200 },
      { category: "Finished Goods", count: 2, value: 4250 },
    ],
  },
}

export const useReports = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchReports = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 1000))
      setReportData(mockReportData)
      setLoading(false)
    }

    fetchReports()
  }, [])

  const exportReport = async (format: "pdf" | "excel") => {
    // Simulate export functionality
    console.log(`Exporting report as ${format}`)
    // In a real app, this would trigger a download
  }

  return {
    reportData,
    loading,
    exportReport,
  }
}
