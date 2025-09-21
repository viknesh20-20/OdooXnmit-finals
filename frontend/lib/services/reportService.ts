import { apiClient } from '../api'

export interface ProductionSummaryData {
  manufacturingOrderStats: {
    total: number
    completed: number
    in_progress: number
    pending: number
    completion_rate: number
  }
  workOrderStats: {
    total: number
    completed: number
    in_progress: number
    pending: number
    completion_rate: number
  }
  topProducts: Array<{
    id: string
    sku: string
    name: string
    order_count: number
    total_quantity: number
  }>
  reportGeneratedAt: string
}

export interface WorkCenterUtilizationData {
  utilizationData: Array<{
    work_center_id: string
    work_center_name: string
    capacity_per_hour: number
    total_work_orders: number
    total_duration: number
    utilization_percentage: number
  }>
  reportGeneratedAt: string
}

export interface InventorySummaryData {
  inventoryData: Array<{
    id: string
    sku: string
    name: string
    type: string
    cost_price: string
    current_stock: string
    stock_value: string
    last_movement_date: string | null
  }>
  movementSummary: Array<{
    type: string
    count: string
    total_quantity: string
    total_value: string
  }>
  totalStockValue: string
  reportGeneratedAt: string
}

export interface ProductionEfficiencyData {
  dailyEfficiency: Array<{
    date: string
    total_orders: number
    completed_orders: number
    avg_estimated_duration: number
    avg_actual_duration: number
    efficiency_percentage: number
    on_time_orders: number
  }>
  overallMetrics: {
    total_work_orders: number
    completed_orders: number
    completion_rate: number
    avg_estimated_duration: number
    avg_actual_duration: number
    overall_efficiency: number
  }
  reportGeneratedAt: string
}

export interface ReportFilters {
  start_date?: string
  end_date?: string
  work_center_id?: string
  product_id?: string
}

class ReportService {
  async getProductionSummary(filters?: ReportFilters): Promise<ProductionSummaryData> {
    const params = new URLSearchParams()
    if (filters?.start_date) params.append('start_date', filters.start_date)
    if (filters?.end_date) params.append('end_date', filters.end_date)
    
    const response = await apiClient.get(`/reports/production-summary?${params.toString()}`)
    return response.data.data
  }

  async getWorkCenterUtilization(filters?: ReportFilters): Promise<WorkCenterUtilizationData> {
    const params = new URLSearchParams()
    if (filters?.start_date) params.append('start_date', filters.start_date)
    if (filters?.end_date) params.append('end_date', filters.end_date)
    if (filters?.work_center_id) params.append('work_center_id', filters.work_center_id)
    
    const response = await apiClient.get(`/reports/work-center-utilization?${params.toString()}`)
    return response.data.data
  }

  async getInventorySummary(filters?: ReportFilters): Promise<InventorySummaryData> {
    const params = new URLSearchParams()
    if (filters?.product_id) params.append('product_id', filters.product_id)
    
    const response = await apiClient.get(`/reports/inventory-summary?${params.toString()}`)
    return response.data.data
  }

  async getProductionEfficiency(filters?: ReportFilters): Promise<ProductionEfficiencyData> {
    const params = new URLSearchParams()
    if (filters?.start_date) params.append('start_date', filters.start_date)
    if (filters?.end_date) params.append('end_date', filters.end_date)
    
    const response = await apiClient.get(`/reports/production-efficiency?${params.toString()}`)
    return response.data.data
  }

  async exportReport(
    reportType: 'production-summary' | 'work-center-utilization' | 'inventory-summary' | 'production-efficiency',
    format: 'json' | 'csv',
    filters?: ReportFilters
  ): Promise<void> {
    const params = new URLSearchParams()
    params.append('format', format)
    if (filters?.start_date) params.append('start_date', filters.start_date)
    if (filters?.end_date) params.append('end_date', filters.end_date)
    if (filters?.work_center_id) params.append('work_center_id', filters.work_center_id)
    if (filters?.product_id) params.append('product_id', filters.product_id)

    const response = await apiClient.get(`/reports/export/${reportType}?${params.toString()}`, {
      responseType: 'blob'
    })

    // Create download link
    const blob = new Blob([response.data], {
      type: format === 'csv' ? 'text/csv' : 'application/json'
    })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Get filename from response headers or generate one
    const contentDisposition = response.headers['content-disposition']
    let filename = `${reportType}-${new Date().toISOString().split('T')[0]}.${format}`
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/)
      if (filenameMatch) {
        filename = filenameMatch[1]
      }
    }
    
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // For PDF and Excel exports, we'll need to implement client-side generation
  // or add backend support for these formats
  async exportToPDF(reportData: any, reportType: string): Promise<void> {
    // This would require a PDF generation library like jsPDF or html2pdf
    console.log('PDF export not yet implemented - would generate PDF from:', reportData)
    
    // For now, export as CSV as a fallback
    await this.exportReport(reportType as any, 'csv')
  }

  async exportToExcel(reportData: any, reportType: string): Promise<void> {
    // This would require an Excel generation library like xlsx
    console.log('Excel export not yet implemented - would generate Excel from:', reportData)
    
    // For now, export as CSV as a fallback
    await this.exportReport(reportType as any, 'csv')
  }
}

export const reportService = new ReportService()
