"use client"

import { useState, useEffect } from "react"
import type { StockMovement } from "@/types"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

// Use real API data instead of mock data

export const useStockMovements = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchMovements = async (force = false) => {
    // Prevent duplicate calls within 30 seconds unless forced
    const now = Date.now()
    if (!force && now - lastFetch < 30000 && movements.length > 0) {
      return
    }

    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get('/stock-movements')
      const movementsData = response.data?.stockMovements || []
      setMovements(movementsData)
      setLastFetch(now)
    } catch (err) {
      console.error('Failed to fetch stock movements:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch stock movements')
      setMovements([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch stock movements if user is authenticated and auth is not loading
    if (isAuthenticated && !authLoading) {
      fetchMovements()
    } else if (!authLoading && !isAuthenticated) {
      // User is not authenticated, clear data
      setMovements([])
      setLoading(false)
    }
  }, [isAuthenticated, authLoading])

  const createMovement = async (movementData: Omit<StockMovement, "id">) => {
    try {
      // Map frontend camelCase to backend snake_case
      const backendData = {
        product_id: movementData.productId,
        type: movementData.type,
        quantity: movementData.quantity,
        unit: movementData.unit,
        unit_cost: movementData.unitCost || undefined,
        total_value: movementData.totalValue || undefined,
        reference: movementData.reference || `MOV-${Date.now()}`,
        reference_type: movementData.referenceType || 'adjustment',
        from_location: movementData.fromLocation || undefined,
        to_location: movementData.toLocation || undefined,
        timestamp: movementData.timestamp || new Date().toISOString(),
        processed_by: undefined, // Will be set by backend from auth context
        notes: movementData.notes || undefined,
        batch_number: undefined,
        expiry_date: undefined,
        metadata: {}
      }

      const response = await apiClient.post('/stock-movements', backendData)
      const newMovement = response.data?.stockMovement || response.data
      if (newMovement) {
        setMovements((prev) => [newMovement, ...prev])
      }
      return newMovement
    } catch (err) {
      console.error('Failed to create stock movement:', err)
      throw err
    }
  }

  const updateMovement = async (id: string, updates: Partial<StockMovement>) => {
    try {
      // Map frontend camelCase to backend snake_case for updates
      const backendUpdates: any = {}

      if (updates.productId !== undefined) backendUpdates.product_id = updates.productId
      if (updates.type !== undefined) backendUpdates.type = updates.type
      if (updates.quantity !== undefined) backendUpdates.quantity = updates.quantity
      if (updates.unit !== undefined) backendUpdates.unit = updates.unit
      if (updates.unitCost !== undefined) backendUpdates.unit_cost = updates.unitCost
      if (updates.totalValue !== undefined) backendUpdates.total_value = updates.totalValue
      if (updates.reference !== undefined) backendUpdates.reference = updates.reference
      if (updates.referenceType !== undefined) backendUpdates.reference_type = updates.referenceType
      if (updates.fromLocation !== undefined) backendUpdates.from_location = updates.fromLocation
      if (updates.toLocation !== undefined) backendUpdates.to_location = updates.toLocation
      if (updates.timestamp !== undefined) backendUpdates.timestamp = updates.timestamp
      if (updates.notes !== undefined) backendUpdates.notes = updates.notes

      const response = await apiClient.put(`/stock-movements/${id}`, backendUpdates)
      const updatedMovement = response.data?.stockMovement || response.data
      if (updatedMovement) {
        setMovements((prev) => prev.map((movement) => (movement.id === id ? updatedMovement : movement)))
      }
      return updatedMovement
    } catch (err) {
      console.error('Failed to update stock movement:', err)
      throw err
    }
  }

  const deleteMovement = async (id: string) => {
    try {
      await apiClient.delete(`/stock-movements/${id}`)
      setMovements((prev) => prev.filter((movement) => movement.id !== id))
    } catch (err) {
      console.error('Failed to delete stock movement:', err)
      throw err
    }
  }

  const refetch = () => {
    fetchMovements(true) // Force refresh
  }

  const refreshMovements = async () => {
    if (isRefreshing) return
    setIsRefreshing(true)
    try {
      await fetchMovements(true)
    } finally {
      setIsRefreshing(false)
    }
  }

  return {
    movements,
    loading,
    error,
    isRefreshing,
    createMovement,
    updateMovement,
    deleteMovement,
    refetch,
    refreshMovements,
  }
}
