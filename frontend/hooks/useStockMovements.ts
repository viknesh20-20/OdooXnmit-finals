"use client"

import { useState, useEffect } from "react"
import type { StockMovement } from "@/types"
import { apiClient } from "@/lib/api"

// Use real API data instead of mock data

export const useStockMovements = () => {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMovements = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get('/stock-movements')
      setMovements(response.data?.data || [])
    } catch (err) {
      console.error('Failed to fetch stock movements:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch stock movements')
      setMovements([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMovements()
  }, [])

  const createMovement = async (movementData: Omit<StockMovement, "id">) => {
    try {
      const response = await apiClient.post('/stock-movements', movementData)
      const newMovement = response.data?.data
      if (newMovement) {
        setMovements((prev) => [newMovement, ...prev])
      }
      return newMovement
    } catch (err) {
      console.error('Failed to create stock movement:', err)
      throw err
    }
  }

  const refetch = () => {
    fetchMovements()
  }

  return {
    movements,
    loading,
    error,
    createMovement,
    refetch,
  }
}
