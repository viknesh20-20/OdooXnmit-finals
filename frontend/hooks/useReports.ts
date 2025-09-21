"use client"

import { useState, useEffect, useCallback } from "react"
import { workCenterService } from "@/lib/services/workCenterService"
import { productService } from "@/lib/services/productService"
import { ApiError } from "@/lib/api"

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

export const useReports = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch report data from various APIs
  const fetchReports = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch data from multiple sources in parallel
      const [workCentersResponse, productsResponse] = await Promise.all([
        workCenterService.getWorkCenters(),
        productService.getProducts({ status: 'active' })
      ])

      // Process work center utilization data
      const workCenterUtilization = workCentersResponse.workCenters.map(wc => ({
        workCenter: wc.name,
        utilization: wc.utilization
      }))

      // Process inventory data
      const products = productsResponse.products
      const totalProducts = products.length
      const lowStockItems = products.filter(p => p.minStockLevel < 50).length // Placeholder logic
      const totalValue = products.reduce((sum, p) => sum + (p.costPrice * p.minStockLevel), 0) // Placeholder calculation

      // Category breakdown (simplified)
      const categoryBreakdown = [
        {
          category: "Raw Materials",
          count: products.filter(p => p.type === 'raw_material').length,
          value: products.filter(p => p.type === 'raw_material').reduce((sum, p) => sum + (p.costPrice * p.minStockLevel), 0)
        },
        {
          category: "Finished Goods",
          count: products.filter(p => p.type === 'finished_good').length,
          value: products.filter(p => p.type === 'finished_good').reduce((sum, p) => sum + (p.costPrice * p.minStockLevel), 0)
        },
        {
          category: "Components",
          count: products.filter(p => p.type === 'work_in_progress').length,
          value: products.filter(p => p.type === 'work_in_progress').reduce((sum, p) => sum + (p.costPrice * p.minStockLevel), 0)
        }
      ]

      // TODO: Replace with real API calls for production and quality metrics
      const reportData: ReportData = {
        productionSummary: {
          completionRate: 0, // TODO: Get from manufacturing orders API
          avgCycleTime: 0,   // TODO: Get from work orders API
        },
        qualityMetrics: {
          firstPassYield: 0, // TODO: Get from quality checks API
          defectRate: 0,     // TODO: Get from quality checks API
        },
        workCenterUtilization,
        inventoryReport: {
          totalProducts,
          lowStockItems,
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
    // Simulate export functionality
    console.log(`Exporting report as ${format}`)
    // In a real app, this would trigger a download or call an export API
  }

  const refreshReports = useCallback(() => {
    fetchReports()
  }, [fetchReports])

  return {
    reportData,
    loading,
    error,
    exportReport,
    refreshReports,
  }
}
