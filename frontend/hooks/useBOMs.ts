"use client"

import { useState, useEffect } from "react"
import type { BOM } from "@/types"

// Mock data for BOMs
const mockBOMs: BOM[] = [
  {
    id: "BOM-001",
    productId: "P-005",
    productName: "Wooden Table",
    version: "v1.0",
    isActive: true,
    components: [
      {
        id: "BC-001",
        productId: "P-001",
        productName: "Wooden Legs",
        quantity: 4,
        unit: "pieces",
      },
      {
        id: "BC-002",
        productId: "P-002",
        productName: "Wooden Top",
        quantity: 1,
        unit: "pieces",
      },
      {
        id: "BC-003",
        productId: "P-003",
        productName: "Screws",
        quantity: 12,
        unit: "pieces",
      },
      {
        id: "BC-004",
        productId: "P-004",
        productName: "Varnish Bottle",
        quantity: 1,
        unit: "bottles",
      },
    ],
    operations: [
      {
        id: "BO-001",
        operation: "Assembly",
        workCenter: "Assembly Line A",
        duration: 60,
        sequence: 1,
      },
      {
        id: "BO-002",
        operation: "Painting",
        workCenter: "Paint Booth 1",
        duration: 30,
        sequence: 2,
      },
      {
        id: "BO-003",
        operation: "Packaging",
        workCenter: "Packaging Line",
        duration: 20,
        sequence: 3,
      },
    ],
  },
  {
    id: "BOM-002",
    productId: "P-006",
    productName: "Office Chair",
    version: "v1.2",
    isActive: true,
    components: [
      {
        id: "BC-005",
        productId: "P-001",
        productName: "Wooden Legs",
        quantity: 5,
        unit: "pieces",
      },
      {
        id: "BC-006",
        productId: "P-003",
        productName: "Screws",
        quantity: 20,
        unit: "pieces",
      },
    ],
    operations: [
      {
        id: "BO-004",
        operation: "Cutting",
        workCenter: "CNC Machine 1",
        duration: 45,
        sequence: 1,
      },
      {
        id: "BO-005",
        operation: "Assembly",
        workCenter: "Assembly Line B",
        duration: 90,
        sequence: 2,
      },
      {
        id: "BO-006",
        operation: "Quality Check",
        workCenter: "Quality Control Station",
        duration: 15,
        sequence: 3,
      },
    ],
  },
]

export const useBOMs = () => {
  const [boms, setBOMs] = useState<BOM[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchBOMs = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setBOMs(mockBOMs)
      setLoading(false)
    }

    fetchBOMs()
  }, [])

  const createBOM = async (bomData: Omit<BOM, "id">) => {
    const newBOM: BOM = {
      ...bomData,
      id: `BOM-${String(boms.length + 1).padStart(3, "0")}`,
    }
    setBOMs((prev) => [...prev, newBOM])
    return newBOM
  }

  const updateBOM = async (id: string, updates: Partial<BOM>) => {
    setBOMs((prev) => prev.map((bom) => (bom.id === id ? { ...bom, ...updates } : bom)))
  }

  const deleteBOM = async (id: string) => {
    setBOMs((prev) => prev.filter((bom) => bom.id !== id))
  }

  const duplicateBOM = async (id: string) => {
    const originalBOM = boms.find((bom) => bom.id === id)
    if (originalBOM) {
      const newBOM: BOM = {
        ...originalBOM,
        id: `BOM-${String(boms.length + 1).padStart(3, "0")}`,
        version: `v${Number.parseFloat(originalBOM.version.substring(1)) + 0.1}`,
        isActive: false,
      }
      setBOMs((prev) => [...prev, newBOM])
      return newBOM
    }
  }

  return {
    boms,
    loading,
    createBOM,
    updateBOM,
    deleteBOM,
    duplicateBOM,
  }
}
