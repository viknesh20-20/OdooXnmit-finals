"use client"

import { useState, useEffect } from "react"
import type { WorkOrder } from "@/types"

// Mock data for work orders
const mockWorkOrders: WorkOrder[] = [
  {
    id: "WO-001",
    manufacturingOrderId: "MO-001",
    operation: "Assembly",
    workCenter: "Assembly Line A",
    duration: 60,
    status: "in-progress",
    assignee: "John Smith",
    startTime: "2024-01-15T09:00:00Z",
    comments: "Started assembly process, all materials available",
  },
  {
    id: "WO-002",
    manufacturingOrderId: "MO-001",
    operation: "Painting",
    workCenter: "Paint Booth 1",
    duration: 30,
    status: "pending",
    assignee: "Sarah Johnson",
  },
  {
    id: "WO-003",
    manufacturingOrderId: "MO-001",
    operation: "Packaging",
    workCenter: "Packaging Line",
    duration: 20,
    status: "pending",
    assignee: "Mike Wilson",
  },
  {
    id: "WO-004",
    manufacturingOrderId: "MO-002",
    operation: "Cutting",
    workCenter: "CNC Machine 1",
    duration: 45,
    status: "completed",
    assignee: "Lisa Brown",
    startTime: "2024-01-14T08:00:00Z",
    endTime: "2024-01-14T08:45:00Z",
    comments: "Cutting completed successfully, no issues",
  },
  {
    id: "WO-005",
    manufacturingOrderId: "MO-002",
    operation: "Assembly",
    workCenter: "Assembly Line B",
    duration: 90,
    status: "paused",
    assignee: "David Lee",
    startTime: "2024-01-15T10:30:00Z",
    comments: "Paused due to material shortage, waiting for delivery",
  },
]

export const useWorkOrders = () => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchWorkOrders = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setWorkOrders(mockWorkOrders)
      setLoading(false)
    }

    fetchWorkOrders()
  }, [])

  const startWorkOrder = async (id: string) => {
    setWorkOrders((prev) =>
      prev.map((wo) =>
        wo.id === id
          ? {
              ...wo,
              status: "in-progress",
              startTime: new Date().toISOString(),
            }
          : wo,
      ),
    )
  }

  const pauseWorkOrder = async (id: string, comments?: string) => {
    setWorkOrders((prev) =>
      prev.map((wo) =>
        wo.id === id
          ? {
              ...wo,
              status: "paused",
              comments: comments || wo.comments,
            }
          : wo,
      ),
    )
  }

  const completeWorkOrder = async (id: string, comments?: string) => {
    setWorkOrders((prev) =>
      prev.map((wo) =>
        wo.id === id
          ? {
              ...wo,
              status: "completed",
              endTime: new Date().toISOString(),
              comments: comments || wo.comments,
            }
          : wo,
      ),
    )
  }

  const updateWorkOrder = async (id: string, updates: Partial<WorkOrder>) => {
    setWorkOrders((prev) => prev.map((wo) => (wo.id === id ? { ...wo, ...updates } : wo)))
  }

  const createWorkOrder = async (workOrderData: Omit<WorkOrder, "id">) => {
    const newWorkOrder: WorkOrder = {
      ...workOrderData,
      id: `WO-${String(workOrders.length + 1).padStart(3, "0")}`,
    }
    setWorkOrders((prev) => [...prev, newWorkOrder])
    return newWorkOrder
  }

  return {
    workOrders,
    loading,
    startWorkOrder,
    pauseWorkOrder,
    completeWorkOrder,
    updateWorkOrder,
    createWorkOrder,
  }
}
