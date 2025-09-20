"use client"

import { useState, useEffect } from "react"
import type { ManufacturingOrder } from "@/types"

// Mock data for manufacturing orders
const mockOrders: ManufacturingOrder[] = [
  {
    id: "MO-001",
    productName: "Wooden Table",
    quantity: 10,
    status: "in-progress",
    startDate: "2024-01-15",
    dueDate: "2024-01-25",
    assignee: "John Smith",
    bomId: "BOM-001",
    workOrders: [],
    createdAt: "2024-01-10T08:00:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "MO-002",
    productName: "Office Chair",
    quantity: 25,
    status: "planned",
    startDate: "2024-01-20",
    dueDate: "2024-02-05",
    assignee: "Sarah Johnson",
    bomId: "BOM-002",
    workOrders: [],
    createdAt: "2024-01-12T09:15:00Z",
    updatedAt: "2024-01-12T09:15:00Z",
  },
  {
    id: "MO-003",
    productName: "Wooden Desk",
    quantity: 5,
    status: "completed",
    startDate: "2024-01-05",
    dueDate: "2024-01-15",
    assignee: "Mike Wilson",
    bomId: "BOM-003",
    workOrders: [],
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-15T16:45:00Z",
  },
  {
    id: "MO-004",
    productName: "Storage Cabinet",
    quantity: 8,
    status: "cancelled",
    startDate: "2024-01-10",
    dueDate: "2024-01-20",
    assignee: "Lisa Brown",
    bomId: "BOM-004",
    workOrders: [],
    createdAt: "2024-01-08T11:30:00Z",
    updatedAt: "2024-01-12T14:20:00Z",
  },
  {
    id: "MO-005",
    productName: "Conference Table",
    quantity: 3,
    status: "in-progress",
    startDate: "2024-01-18",
    dueDate: "2024-02-01",
    assignee: "David Lee",
    bomId: "BOM-005",
    workOrders: [],
    createdAt: "2024-01-15T13:45:00Z",
    updatedAt: "2024-01-18T09:00:00Z",
  },
]

export const useManufacturingOrders = () => {
  const [orders, setOrders] = useState<ManufacturingOrder[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchOrders = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setOrders(mockOrders)
      setLoading(false)
    }

    fetchOrders()
  }, [])

  const createOrder = async (orderData: Omit<ManufacturingOrder, "id" | "createdAt" | "updatedAt" | "workOrders">) => {
    const newOrder: ManufacturingOrder = {
      ...orderData,
      id: `MO-${String(orders.length + 1).padStart(3, "0")}`,
      workOrders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setOrders((prev) => [...prev, newOrder])
    return newOrder
  }

  const updateOrder = async (id: string, updates: Partial<ManufacturingOrder>) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === id ? { ...order, ...updates, updatedAt: new Date().toISOString() } : order)),
    )
  }

  const deleteOrder = async (id: string) => {
    setOrders((prev) => prev.filter((order) => order.id !== id))
  }

  return {
    orders,
    loading,
    createOrder,
    updateOrder,
    deleteOrder,
  }
}
