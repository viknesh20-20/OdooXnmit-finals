"use client"

import { useState, useEffect } from "react"
import type { WorkOrder, WorkOrderCreateRequest } from "@/types"
import { apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

// Use real API data instead of mock data

export const useWorkOrders = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth()
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchWorkOrders = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await apiClient.get('/work-orders')
      const workOrdersData = response.data?.workOrders || []
      setWorkOrders(workOrdersData)
    } catch (err) {
      console.error('Failed to fetch work orders:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch work orders')
      setWorkOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch work orders if user is authenticated and auth is not loading
    if (isAuthenticated && !authLoading) {
      fetchWorkOrders()
    } else if (!authLoading && !isAuthenticated) {
      // User is not authenticated, clear data
      setWorkOrders([])
      setLoading(false)
    }
  }, [isAuthenticated, authLoading])

  const startWorkOrder = async (id: string) => {
    try {
      const response = await apiClient.patch(`/work-orders/${id}/start`)
      // API returns {success: true, data: workOrder}
      const updatedWorkOrder = response.data
      if (updatedWorkOrder) {
        setWorkOrders((prev) =>
          prev.map((wo) => (wo.id === id ? updatedWorkOrder : wo))
        )
      }
    } catch (err) {
      console.error('Failed to start work order:', err)
      throw err
    }
  }

  const pauseWorkOrder = async (id: string, comments?: string) => {
    try {
      const response = await apiClient.patch(`/work-orders/${id}/pause`, { comments })
      // API returns {success: true, data: workOrder}
      const updatedWorkOrder = response.data
      if (updatedWorkOrder) {
        setWorkOrders((prev) =>
          prev.map((wo) => (wo.id === id ? updatedWorkOrder : wo))
        )
      }
    } catch (err) {
      console.error('Failed to pause work order:', err)
      throw err
    }
  }

  const completeWorkOrder = async (id: string, comments?: string) => {
    try {
      const response = await apiClient.patch(`/work-orders/${id}/complete`, { comments })
      // API returns {success: true, data: workOrder}
      const updatedWorkOrder = response.data
      if (updatedWorkOrder) {
        setWorkOrders((prev) =>
          prev.map((wo) => (wo.id === id ? updatedWorkOrder : wo))
        )
      }
    } catch (err) {
      console.error('Failed to complete work order:', err)
      throw err
    }
  }

  const updateWorkOrder = async (id: string, updates: Partial<WorkOrder>) => {
    try {
      const response = await apiClient.put(`/work-orders/${id}`, updates)
      // API returns {success: true, data: {workOrder: ...}}
      const updatedWorkOrder = response.data?.workOrder
      if (updatedWorkOrder) {
        setWorkOrders((prev) => prev.map((wo) => (wo.id === id ? updatedWorkOrder : wo)))
      }
    } catch (err) {
      console.error('Failed to update work order:', err)
      throw err
    }
  }

  const createWorkOrder = async (workOrderData: WorkOrderCreateRequest) => {
    try {
      const response = await apiClient.post('/work-orders', workOrderData)
      // API returns {success: true, data: {workOrder: ...}}
      const newWorkOrder = response.data?.workOrder
      if (newWorkOrder) {
        setWorkOrders((prev) => [...prev, newWorkOrder])
      }
      return newWorkOrder
    } catch (err) {
      console.error('Failed to create work order:', err)
      throw err
    }
  }

  const refetch = () => {
    fetchWorkOrders()
  }

  return {
    workOrders,
    loading,
    error,
    startWorkOrder,
    pauseWorkOrder,
    completeWorkOrder,
    updateWorkOrder,
    createWorkOrder,
    refetch,
  }
}
