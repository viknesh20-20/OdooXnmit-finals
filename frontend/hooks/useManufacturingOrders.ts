"use client"

import { useState, useEffect } from "react"
import type { ManufacturingOrder } from "@/types"
import { apiClient } from "@/lib/api"

// Use real API data instead of mock data
export const useManufacturingOrders = () => {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get('/manufacturing-orders')
      setOrders(response.data?.data || [])
    } catch (err) {
      console.error('Failed to fetch manufacturing orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch manufacturing orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const createOrder = async (orderData: Omit<ManufacturingOrder, "id" | "createdAt" | "updatedAt" | "workOrders">) => {
    try {
      const response = await apiClient.post('/manufacturing-orders', orderData)
      const newOrder = response.data?.data
      if (newOrder) {
        setOrders((prev) => [...prev, newOrder])
      }
      return newOrder
    } catch (err) {
      console.error('Failed to create manufacturing order:', err)
      throw err
    }
  }

  const updateOrder = async (id: string, updates: Partial<ManufacturingOrder>) => {
    try {
      const response = await apiClient.put(`/manufacturing-orders/${id}`, updates)
      const updatedOrder = response.data?.data
      if (updatedOrder) {
        setOrders((prev) =>
          prev.map((order) => (order.id === id ? updatedOrder : order))
        )
      }
      return updatedOrder
    } catch (err) {
      console.error('Failed to update manufacturing order:', err)
      throw err
    }
  }

  const deleteOrder = async (id: string) => {
    try {
      await apiClient.delete(`/manufacturing-orders/${id}`)
      setOrders((prev) => prev.filter((order) => order.id !== id))
    } catch (err) {
      console.error('Failed to delete manufacturing order:', err)
      throw err
    }
  }

  const refetch = () => {
    fetchOrders()
  }

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrder,
    deleteOrder,
    refetch,
  }
}
