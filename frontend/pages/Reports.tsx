"use client"

import type React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { ProductionChart } from "../components/reports/ProductionChart"
import { UtilizationChart } from "../components/reports/UtilizationChart"
import { ErrorState, LoadingState, EmptyState } from "../components/ui/error-state"
import { ErrorBoundary } from "../components/ui/error-boundary"
import { useReports } from "../hooks/useReports"
import { FileText, Table, RefreshCw, BarChart3 } from "lucide-react"

export const Reports: React.FC = () => {
  const { reportData, loading, error, exportReport, refreshReports } = useReports()

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Manufacturing Reports</h1>
          <div className="flex gap-2">
            <Button disabled variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button disabled variant="outline">
              <Table className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>
        <LoadingState message="Loading report data..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Manufacturing Reports</h1>
          <Button onClick={refreshReports} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <ErrorState
          error={error}
          onRetry={refreshReports}
          title="Failed to load reports"
          description="Unable to fetch report data. Please check your connection and try again."
        />
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Manufacturing Reports</h1>
          <Button onClick={refreshReports} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <EmptyState
          title="No report data available"
          description="There's no data to display at the moment. Try refreshing or check back later."
          icon={<BarChart3 className="h-12 w-12" />}
          action={{
            label: "Refresh Data",
            onClick: refreshReports
          }}
        />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Manufacturing Reports</h1>
          <div className="flex gap-2">
            <Button onClick={refreshReports} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={() => exportReport("pdf")} className="bg-red-600 hover:bg-red-700">
              <FileText className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button onClick={() => exportReport("excel")} className="bg-green-600 hover:bg-green-700">
              <Table className="w-4 h-4 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Completion Rate</p>
                <p className="text-2xl font-bold text-green-400">{reportData.productionSummary.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Avg Cycle Time</p>
                <p className="text-2xl font-bold text-blue-400">{reportData.productionSummary.avgCycleTime} days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">First Pass Yield</p>
                <p className="text-2xl font-bold text-green-400">{reportData.qualityMetrics.firstPassYield}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Defect Rate</p>
                <p className="text-2xl font-bold text-red-400">{reportData.qualityMetrics.defectRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductionChart data={reportData.productionSummary} />
        <UtilizationChart data={reportData.workCenterUtilization} />
      </div>

      {/* Inventory Report */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Inventory Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-400">{reportData.inventoryReport.totalProducts}</p>
              <p className="text-gray-400 text-sm">Total Products</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-400">{reportData.inventoryReport.lowStockItems}</p>
              <p className="text-gray-400 text-sm">Low Stock Items</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400">
                ${reportData.inventoryReport.totalValue.toLocaleString()}
              </p>
              <p className="text-gray-400 text-sm">Total Value</p>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-white font-semibold">Category Breakdown</h4>
            {reportData.inventoryReport.categoryBreakdown.map((category) => (
              <div key={category.category} className="flex justify-between items-center p-3 bg-gray-700 rounded">
                <span className="text-gray-300">{category.category}</span>
                <div className="text-right">
                  <div className="text-white font-semibold">{category.count} items</div>
                  <div className="text-gray-400 text-sm">${category.value.toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
    </ErrorBoundary>
  )
}
