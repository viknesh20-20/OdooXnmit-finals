"use client"

import { useState, useEffect, useCallback } from "react"
import { reportService } from "@/lib/services/reportService"
import { ApiError } from "@/lib/api"

interface ReportData {
  productionSummary: {
    completionRate: number
    avgCycleTime: number
    totalOrders: number
    completedOrders: number
    inProgressOrders: number
    pendingOrders: number
  }
  qualityMetrics: {
    firstPassYield: number
    defectRate: number
    overallEfficiency: number
  }
  workCenterUtilization: Array<{
    workCenter: string
    utilization: number
    capacity: number
    totalOrders: number
  }>
  inventoryReport: {
    totalProducts: number
    lowStockItems: number
    outOfStockItems: number
    totalValue: number
    categoryBreakdown: Array<{
      category: string
      count: number
      value: number
    }>
  }
}

export const useReports = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch report data from backend APIs
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get date range for last 30 days
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const filters = {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }

      // Fetch data from backend report APIs in parallel
      const [
        productionSummaryData,
        workCenterUtilizationData,
        inventorySummaryData,
        productionEfficiencyData
      ] = await Promise.all([
        reportService.getProductionSummary(filters),
        reportService.getWorkCenterUtilization(filters),
        reportService.getInventorySummary(),
        reportService.getProductionEfficiency(filters)
      ])

      // Process work center utilization data
      const workCenterUtilization = workCenterUtilizationData.data?.utilizationData?.map(wc => ({
        workCenter: wc.work_center_name,
        utilization: wc.utilization_percentage,
        capacity: wc.capacity,
        totalOrders: wc.total_work_orders
      })) || []

      // Process inventory data for category breakdown
      const inventoryData = inventorySummaryData.data?.inventoryData || []
      const categoryBreakdown = [
        {
          category: "Raw Materials",
          count: inventoryData.filter(p => p.type === 'raw_material').length,
          value: inventoryData.filter(p => p.type === 'raw_material').reduce((sum, p) => sum + parseFloat(p.stock_value), 0)
        },
        {
          category: "Finished Goods",
          count: inventoryData.filter(p => p.type === 'finished_good').length,
          value: inventoryData.filter(p => p.type === 'finished_good').reduce((sum, p) => sum + parseFloat(p.stock_value), 0)
        },
        {
          category: "Components",
          count: inventoryData.filter(p => p.type === 'work_in_progress').length,
          value: inventoryData.filter(p => p.type === 'work_in_progress').reduce((sum, p) => sum + parseFloat(p.stock_value), 0)
        }
      ]

      // Calculate summary statistics from inventory data
      const totalProducts = inventoryData.length
      const lowStockItems = inventoryData.filter(p => parseFloat(p.current_stock) < 50).length
      const outOfStockItems = inventoryData.filter(p => parseFloat(p.current_stock) === 0).length
      const totalValue = parseFloat(inventorySummaryData.data?.totalStockValue) || 0

      // Combine all data into the expected format
      const reportData: ReportData = {
        productionSummary: {
          completionRate: productionSummaryData.data?.manufacturingOrderStats?.completion_rate || 0,
          avgCycleTime: productionEfficiencyData.data?.overallMetrics?.avg_actual_duration || 0,
          totalOrders: productionSummaryData.data?.manufacturingOrderStats?.total || 0,
          completedOrders: productionSummaryData.data?.manufacturingOrderStats?.completed || 0,
          inProgressOrders: productionSummaryData.data?.manufacturingOrderStats?.in_progress || 0,
          pendingOrders: productionSummaryData.data?.manufacturingOrderStats?.pending || 0
        },
        qualityMetrics: {
          firstPassYield: productionEfficiencyData.data?.overallMetrics?.completion_rate || 0,
          defectRate: Math.max(0, 100 - (productionEfficiencyData.data?.overallMetrics?.completion_rate || 0)),
          overallEfficiency: productionEfficiencyData.data?.overallMetrics?.overall_efficiency || 0
        },
        workCenterUtilization,
        inventoryReport: {
          totalProducts,
          lowStockItems,
          outOfStockItems,
          totalValue: Math.round(totalValue),
          categoryBreakdown: categoryBreakdown.filter(cat => cat.count > 0)
        }
      }

      setReportData(reportData)
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch report data'
      setError(errorMessage)
      console.error('Error fetching report data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchReports()
  }, [fetchReports])

  const exportReport = async (format: "pdf" | "excel") => {
    try {
      if (!reportData) {
        throw new Error('No report data available to export')
      }

      // Get date range for export
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const filters = {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }

      if (format === "pdf") {
        // For now, export production summary as CSV since PDF generation requires additional libraries
        await reportService.exportReport('production-summary', 'csv', filters)
      } else if (format === "excel") {
        // For now, export production summary as CSV since Excel generation requires additional libraries
        await reportService.exportReport('production-summary', 'csv', filters)
      }
    } catch (err) {
      console.error('Error exporting report:', err)
      // You might want to show a toast notification here
    }
  }

  const exportSpecificReport = async (
    reportType: 'production-summary' | 'work-center-utilization' | 'inventory-summary' | 'production-efficiency',
    format: 'json' | 'csv' = 'csv'
  ) => {
    try {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - 30)

      const filters = {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString()
      }

      await reportService.exportReport(reportType, format, filters)
    } catch (err) {
      console.error('Error exporting specific report:', err)
    }
  }

  const refreshReports = useCallback(() => {
    fetchReports()
  }, [fetchReports])

  return {
    reportData,
    loading,
    error,
    exportReport,
    exportSpecificReport,
    refreshReports,
  }
}
