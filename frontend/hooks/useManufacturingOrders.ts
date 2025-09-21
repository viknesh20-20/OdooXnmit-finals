"use client"

import { useState, useEffect } from "react"
import type { ManufacturingOrder } from "@/types"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

// Use real API data instead of mock data
export const useManufacturingOrders = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [orders, setOrders] = useState<ManufacturingOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get('/manufacturing-orders')
      const ordersData = response.data?.manufacturingOrders || []
      setOrders(ordersData)
    } catch (err) {
      console.error('Failed to fetch manufacturing orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch manufacturing orders')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch orders if user is authenticated and auth is not loading
    if (isAuthenticated && !authLoading) {
      fetchOrders()
    } else if (!authLoading && !isAuthenticated) {
      // User is not authenticated, clear data
      setOrders([])
      setLoading(false)
    }
  }, [isAuthenticated, authLoading])

  const createOrder = async (orderData: Omit<ManufacturingOrder, "id" | "createdAt" | "updatedAt" | "workOrders">) => {
    try {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      // Map frontend camelCase to backend snake_case
      const backendData = {
        mo_number: orderData.moNumber,
        product_id: orderData.productId,
        bom_id: orderData.bomId,
        quantity: orderData.quantity,
        quantity_unit: orderData.quantityUnit || 'pieces', // Default unit if not provided
        status: orderData.status || 'draft',
        priority: orderData.priority || 'medium',
        planned_start_date: orderData.plannedStartDate,
        planned_end_date: orderData.plannedEndDate,
        actual_start_date: orderData.actualStartDate,
        actual_end_date: orderData.actualEndDate,
        created_by: user.id, // Current authenticated user
        assigned_to: orderData.assigneeId,
        notes: orderData.notes,
        metadata: {
          reference: orderData.reference,
          workCenterId: orderData.workCenterId,
          totalDuration: orderData.totalDuration,
          completedQuantity: orderData.completedQuantity,
          scrapQuantity: orderData.scrapQuantity,
          progress: orderData.progress
        }
      }

      const response = await apiClient.post('/manufacturing-orders', backendData)
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
