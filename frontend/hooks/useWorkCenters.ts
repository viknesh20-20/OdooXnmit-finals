"use client"

import { useState, useEffect } from "react"
import type { WorkCenter } from "@/types"

// Mock data for work centers
const mockWorkCenters: WorkCenter[] = [
  {
    id: "WC-001",
    name: "Assembly Line A",
    description: "Primary assembly line for wooden furniture",
    costPerHour: 45.0,
    capacity: 8,
    status: "active",
    utilization: 85,
  },
  {
    id: "WC-002",
    name: "Paint Booth 1",
    description: "Automated paint booth with drying chamber",
    costPerHour: 60.0,
    capacity: 4,
    status: "active",
    utilization: 72,
  },
  {
    id: "WC-003",
    name: "CNC Machine 1",
    description: "5-axis CNC machine for precision cutting",
    costPerHour: 120.0,
    capacity: 2,
    status: "maintenance",
    utilization: 0,
  },
  {
    id: "WC-004",
    name: "Assembly Line B",
    description: "Secondary assembly line for office furniture",
    costPerHour: 45.0,
    capacity: 6,
    status: "active",
    utilization: 65,
  },
  {
    id: "WC-005",
    name: "Packaging Line",
    description: "Automated packaging and labeling station",
    costPerHour: 35.0,
    capacity: 10,
    status: "inactive",
    utilization: 0,
  },
  {
    id: "WC-006",
    name: "Quality Control Station",
    description: "Final inspection and quality assurance",
    costPerHour: 40.0,
    capacity: 3,
    status: "active",
    utilization: 90,
  },
]

export const useWorkCenters = () => {
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchWorkCenters = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setWorkCenters(mockWorkCenters)
      setLoading(false)
    }

    fetchWorkCenters()
  }, [])

  const createWorkCenter = async (workCenterData: Omit<WorkCenter, "id">) => {
    const newWorkCenter: WorkCenter = {
      ...workCenterData,
      id: `WC-${String(workCenters.length + 1).padStart(3, "0")}`,
    }
    setWorkCenters((prev) => [...prev, newWorkCenter])
    return newWorkCenter
  }

  const updateWorkCenter = async (id: string, updates: Partial<WorkCenter>) => {
    setWorkCenters((prev) => prev.map((wc) => (wc.id === id ? { ...wc, ...updates } : wc)))
  }

  const deleteWorkCenter = async (id: string) => {
    setWorkCenters((prev) => prev.filter((wc) => wc.id !== id))
  }

  const updateUtilization = async (id: string, utilization: number) => {
    setWorkCenters((prev) => prev.map((wc) => (wc.id === id ? { ...wc, utilization } : wc)))
  }

  return {
    workCenters,
    loading,
    createWorkCenter,
    updateWorkCenter,
    deleteWorkCenter,
    updateUtilization,
  }
}
