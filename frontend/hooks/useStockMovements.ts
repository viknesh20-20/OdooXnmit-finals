"use client"

import { useState, useEffect } from "react"
import type { StockMovement } from "@/types"

// Mock data for stock movements
const mockMovements: StockMovement[] = [
  {
    id: "SM-001",
    productId: "P-001",
    productName: "Wooden Legs",
    type: "out",
    quantity: 40,
    reference: "MO-001",
    referenceType: "manufacturing-order",
    timestamp: "2024-01-15T10:30:00Z",
    notes: "Consumed for Wooden Table production",
  },
  {
    id: "SM-002",
    productId: "P-002",
    productName: "Wooden Top",
    type: "out",
    quantity: 10,
    reference: "MO-001",
    referenceType: "manufacturing-order",
    timestamp: "2024-01-15T10:30:00Z",
    notes: "Consumed for Wooden Table production",
  },
  {
    id: "SM-003",
    productId: "P-005",
    productName: "Wooden Table",
    type: "in",
    quantity: 10,
    reference: "MO-001",
    referenceType: "manufacturing-order",
    timestamp: "2024-01-15T16:45:00Z",
    notes: "Produced from manufacturing order",
  },
  {
    id: "SM-004",
    productId: "P-003",
    productName: "Screws",
    type: "in",
    quantity: 200,
    reference: "PO-001",
    referenceType: "purchase",
    timestamp: "2024-01-14T09:15:00Z",
    notes: "Purchase order delivery",
  },
  {
    id: "SM-005",
    productId: "P-004",
    productName: "Varnish Bottle",
    type: "out",
    quantity: 5,
    reference: "ADJ-001",
    referenceType: "adjustment",
    timestamp: "2024-01-13T14:20:00Z",
    notes: "Damaged bottles removed from inventory",
  },
]

export const useStockMovements = () => {
  const [movements, setMovements] = useState<StockMovement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchMovements = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setMovements(mockMovements)
      setLoading(false)
    }

    fetchMovements()
  }, [])

  const createMovement = async (movementData: Omit<StockMovement, "id">) => {
    const newMovement: StockMovement = {
      ...movementData,
      id: `SM-${String(movements.length + 1).padStart(3, "0")}`,
    }
    setMovements((prev) => [newMovement, ...prev])
    return newMovement
  }

  return {
    movements,
    loading,
    createMovement,
  }
}
