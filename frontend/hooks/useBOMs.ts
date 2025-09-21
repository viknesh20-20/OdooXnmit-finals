"use client"

import { useState, useEffect } from "react"
import type { BOM } from "@/types"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

// Use real API data instead of mock data
export const useBOMs = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [boms, setBOMs] = useState<BOM[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)

  const fetchBOMs = async (force = false) => {
    // Prevent duplicate calls within 30 seconds unless forced
    const now = Date.now()
    if (!force && now - lastFetch < 30000 && boms.length > 0) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get('/boms')
      setBOMs(response.data?.boms || [])
      setLastFetch(now)
    } catch (err) {
      console.error('Failed to fetch BOMs:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch BOMs')
      setBOMs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch BOMs if user is authenticated and auth is not loading
    if (isAuthenticated && !authLoading) {
      fetchBOMs()
    } else if (!authLoading && !isAuthenticated) {
      // User is not authenticated, clear data
      setBOMs([])
      setLoading(false)
    }
  }, [isAuthenticated, authLoading])

  const createBOM = async (bomData: Omit<BOM, "id">) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      // Map frontend camelCase to backend snake_case
      const backendData = {
        product_id: bomData.productId,
        version: bomData.version,
        name: bomData.productName || `BOM for ${bomData.productId}`, // Use productName as name, fallback to generated name
        description: bomData.notes || undefined,
        is_active: bomData.isActive ?? true,
        is_default: bomData.isDefault ?? false,
        created_by: user.id,
        metadata: {
          reference: bomData.reference,
          components: bomData.components || [],
          operations: bomData.operations || [],
          totalCost: bomData.totalCost,
          estimatedTime: bomData.estimatedTime,
          validFrom: bomData.validFrom,
          validTo: bomData.validTo
        }
      }

      const response = await apiClient.post('/boms', backendData)
      const newBOM = response.data?.bom || response.data
      if (newBOM) {
        setBOMs((prev) => [...prev, newBOM])
      }
      return newBOM
    } catch (err) {
      console.error('Failed to create BOM:', err)
      throw err
    }
  }

  const updateBOM = async (id: string, updates: Partial<BOM>) => {
    try {
      // Map frontend camelCase to backend snake_case for updates
      const backendUpdates: any = {}

      if (updates.productId !== undefined) backendUpdates.product_id = updates.productId
      if (updates.version !== undefined) backendUpdates.version = updates.version
      if (updates.productName !== undefined) backendUpdates.name = updates.productName
      if (updates.notes !== undefined) backendUpdates.description = updates.notes
      if (updates.isActive !== undefined) backendUpdates.is_active = updates.isActive
      if (updates.isDefault !== undefined) backendUpdates.is_default = updates.isDefault

      // Update metadata if any of these fields are provided
      if (updates.reference !== undefined || updates.components !== undefined ||
          updates.operations !== undefined || updates.totalCost !== undefined ||
          updates.estimatedTime !== undefined || updates.validFrom !== undefined ||
          updates.validTo !== undefined) {
        backendUpdates.metadata = {
          reference: updates.reference,
          components: updates.components,
          operations: updates.operations,
          totalCost: updates.totalCost,
          estimatedTime: updates.estimatedTime,
          validFrom: updates.validFrom,
          validTo: updates.validTo
        }
      }

      const response = await apiClient.put(`/boms/${id}`, backendUpdates)
      const updatedBOM = response.data?.bom || response.data
      if (updatedBOM) {
        setBOMs((prev) => prev.map((bom) => (bom.id === id ? updatedBOM : bom)))
      }
      return updatedBOM
    } catch (err) {
      console.error('Failed to update BOM:', err)
      throw err
    }
  }

  const deleteBOM = async (id: string) => {
    try {
      await apiClient.delete(`/boms/${id}`)
      setBOMs((prev) => prev.filter((bom) => bom.id !== id))
    } catch (err) {
      console.error('Failed to delete BOM:', err)
      throw err
    }
  }

  const duplicateBOM = async (id: string) => {
    try {
      const response = await apiClient.post(`/boms/${id}/duplicate`)
      const duplicatedBOM = response.data?.bom || response.data
      if (duplicatedBOM) {
        setBOMs((prev) => [...prev, duplicatedBOM])
      }
      return duplicatedBOM
    } catch (err) {
      console.error('Failed to duplicate BOM:', err)
      throw err
    }
  }

  const refetch = () => {
    fetchBOMs(true) // Force refresh
  }

  return {
    boms,
    loading,
    error,
    createBOM,
    updateBOM,
    deleteBOM,
    duplicateBOM,
    refetch,
  }
}
