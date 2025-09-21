import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import type { BOMOperation } from '@/types'

interface UseBOMOperationsOptions {
  bomId?: string
  autoFetch?: boolean
}

interface BOMOperationFilters {
  page?: number
  limit?: number
  search?: string
  bomId?: string
  operationType?: string
  workCenterId?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

interface BOMOperationCreateData {
  bomId: string
  operation: string
  operationType?: string
  workCenterId?: string
  duration: number
  setupTime?: number
  teardownTime?: number
  costPerHour?: number
  sequence: number
  description?: string
  instructions?: string
  qualityRequirements?: any[]
  toolsRequired?: string[]
  skillsRequired?: string[]
  metadata?: Record<string, any>
}

interface BOMOperationUpdateData extends Partial<BOMOperationCreateData> {}

export const useBOMOperations = (options: UseBOMOperationsOptions = {}) => {
  const { bomId, autoFetch = true } = options
  const { user } = useAuth()
  console.log('Current user:', user) // Keep user for potential future use
  const [operations, setOperations] = useState<BOMOperation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const fetchOperations = async (filters: BOMOperationFilters = {}) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filters.page) params.append('page', filters.page.toString())
      if (filters.limit) params.append('limit', filters.limit.toString())
      if (filters.search) params.append('search', filters.search)
      if (filters.bomId || bomId) params.append('bom_id', filters.bomId || bomId!)
      if (filters.operationType) params.append('operation_type', filters.operationType)
      if (filters.workCenterId) params.append('work_center_id', filters.workCenterId)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder)

      const response = await apiClient.get(`/bom-operations?${params.toString()}`)
      
      if (response.data.success) {
        setOperations(response.data.data.operations || [])
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch BOM operations')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch BOM operations'
      setError(errorMessage)
      console.error('Error fetching BOM operations:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchOperationsByBOM = async (bomId: string) => {
    try {
      setLoading(true)
      setError(null)

      const response = await apiClient.get(`/bom-operations/bom/${bomId}`)
      
      if (response.data.success) {
        setOperations(response.data.data.operations || [])
        return response.data.data.operations || []
      } else {
        throw new Error(response.data.error?.message || 'Failed to fetch BOM operations')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to fetch BOM operations'
      setError(errorMessage)
      console.error('Error fetching BOM operations:', err)
      return []
    } finally {
      setLoading(false)
    }
  }

  const createOperation = async (operationData: BOMOperationCreateData) => {
    try {
      setSubmitError(null)

      // Map frontend camelCase to backend snake_case
      const backendData = {
        bom_id: operationData.bomId,
        operation: operationData.operation,
        operation_type: operationData.operationType,
        work_center_id: operationData.workCenterId,
        duration: operationData.duration,
        setup_time: operationData.setupTime || 0,
        teardown_time: operationData.teardownTime || 0,
        cost_per_hour: operationData.costPerHour || 0,
        sequence: operationData.sequence,
        description: operationData.description,
        instructions: operationData.instructions,
        quality_requirements: operationData.qualityRequirements || [],
        tools_required: operationData.toolsRequired || [],
        skills_required: operationData.skillsRequired || [],
        metadata: operationData.metadata || {}
      }

      const response = await apiClient.post('/bom-operations', backendData)
      
      if (response.data.success) {
        const newOperation = response.data.data.operation
        setOperations(prev => [...prev, newOperation])
        return newOperation
      } else {
        throw new Error(response.data.error?.message || 'Failed to create BOM operation')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to create BOM operation'
      setSubmitError(errorMessage)
      console.error('Error creating BOM operation:', err)
      throw err
    }
  }

  const updateOperation = async (id: string, operationData: BOMOperationUpdateData) => {
    try {
      setSubmitError(null)

      // Map frontend camelCase to backend snake_case
      const backendData: any = {}
      if (operationData.bomId) backendData.bom_id = operationData.bomId
      if (operationData.operation) backendData.operation = operationData.operation
      if (operationData.operationType) backendData.operation_type = operationData.operationType
      if (operationData.workCenterId) backendData.work_center_id = operationData.workCenterId
      if (operationData.duration !== undefined) backendData.duration = operationData.duration
      if (operationData.setupTime !== undefined) backendData.setup_time = operationData.setupTime
      if (operationData.teardownTime !== undefined) backendData.teardown_time = operationData.teardownTime
      if (operationData.costPerHour !== undefined) backendData.cost_per_hour = operationData.costPerHour
      if (operationData.sequence !== undefined) backendData.sequence = operationData.sequence
      if (operationData.description !== undefined) backendData.description = operationData.description
      if (operationData.instructions !== undefined) backendData.instructions = operationData.instructions
      if (operationData.qualityRequirements !== undefined) backendData.quality_requirements = operationData.qualityRequirements
      if (operationData.toolsRequired !== undefined) backendData.tools_required = operationData.toolsRequired
      if (operationData.skillsRequired !== undefined) backendData.skills_required = operationData.skillsRequired
      if (operationData.metadata !== undefined) backendData.metadata = operationData.metadata

      const response = await apiClient.put(`/bom-operations/${id}`, backendData)
      
      if (response.data.success) {
        const updatedOperation = response.data.data.operation
        setOperations(prev => prev.map(op => op.id === id ? updatedOperation : op))
        return updatedOperation
      } else {
        throw new Error(response.data.error?.message || 'Failed to update BOM operation')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to update BOM operation'
      setSubmitError(errorMessage)
      console.error('Error updating BOM operation:', err)
      throw err
    }
  }

  const deleteOperation = async (id: string) => {
    try {
      setSubmitError(null)

      const response = await apiClient.delete(`/bom-operations/${id}`)
      
      if (response.data.success) {
        setOperations(prev => prev.filter(op => op.id !== id))
        return true
      } else {
        throw new Error(response.data.error?.message || 'Failed to delete BOM operation')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to delete BOM operation'
      setSubmitError(errorMessage)
      console.error('Error deleting BOM operation:', err)
      throw err
    }
  }

  const reorderOperations = async (bomId: string, operationOrder: { id: string; sequence: number }[]) => {
    try {
      setSubmitError(null)

      const response = await apiClient.put(`/bom-operations/bom/${bomId}/reorder`, {
        operations: operationOrder
      })
      
      if (response.data.success) {
        const reorderedOperations = response.data.data.operations
        setOperations(reorderedOperations)
        return reorderedOperations
      } else {
        throw new Error(response.data.error?.message || 'Failed to reorder BOM operations')
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || err.message || 'Failed to reorder BOM operations'
      setSubmitError(errorMessage)
      console.error('Error reordering BOM operations:', err)
      throw err
    }
  }

  const clearErrors = () => {
    setError(null)
    setSubmitError(null)
  }

  useEffect(() => {
    if (autoFetch && bomId) {
      fetchOperationsByBOM(bomId)
    }
  }, [bomId, autoFetch])

  return {
    operations,
    loading,
    error,
    submitError,
    fetchOperations,
    fetchOperationsByBOM,
    createOperation,
    updateOperation,
    deleteOperation,
    reorderOperations,
    clearErrors,
    refetch: () => bomId ? fetchOperationsByBOM(bomId) : fetchOperations()
  }
}
