"use client"

import { useState, useEffect, useCallback } from "react"
import type { WorkCenter, WorkingHours } from "@/types"
import { workCenterService, type WorkCenter as ApiWorkCenter, type CreateWorkCenterRequest, type UpdateWorkCenterRequest, type UtilizationUpdateRequest } from "@/lib/services/workCenterService"
import { ApiError } from "@/lib/api"

// Helper function to convert API working hours to frontend format
const convertWorkingHours = (apiWorkingHours: any): WorkingHours | undefined => {
  if (!apiWorkingHours) return undefined;
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const workingHours: Partial<WorkingHours> = {};
  
  for (const day of days) {
    if (apiWorkingHours[day]) {
      workingHours[day as keyof WorkingHours] = apiWorkingHours[day];
    } else {
      // Default working hours if not provided
      workingHours[day as keyof WorkingHours] = {
        start: "09:00",
        end: "17:00",
        isWorking: day !== 'saturday' && day !== 'sunday'
      };
    }
  }
  
  return workingHours as WorkingHours;
};

// Helper function to map API work center to frontend work center
const mapApiToFrontend = (apiWorkCenter: ApiWorkCenter): WorkCenter => {
  return {
    id: apiWorkCenter.id,
    name: apiWorkCenter.name,
    code: apiWorkCenter.code,
    description: apiWorkCenter.description || "",
    location: apiWorkCenter.location,
    costPerHour: apiWorkCenter.costPerHour,
    capacity: apiWorkCenter.capacity,
    efficiency: apiWorkCenter.efficiency,
    status: apiWorkCenter.status,
    utilization: apiWorkCenter.utilization,
    availability: apiWorkCenter.availability,
    maintenanceSchedule: apiWorkCenter.maintenanceSchedule,
    nextMaintenance: apiWorkCenter.nextMaintenance,
    operatorIds: apiWorkCenter.operatorIds,
    capabilities: apiWorkCenter.capabilities,
    workingHours: convertWorkingHours(apiWorkCenter.workingHours),
    oeeScore: apiWorkCenter.oeeScore,
    downtimeHours: apiWorkCenter.downtimeHours,
    productiveHours: apiWorkCenter.productiveHours,
    createdAt: apiWorkCenter.createdAt,
    updatedAt: apiWorkCenter.updatedAt,
  }
}

// Helper function to map frontend work center to API create request
const mapFrontendToApiCreate = (workCenter: Omit<WorkCenter, "id">): CreateWorkCenterRequest => {
  return {
    code: workCenter.code || `WC-${Date.now()}`,
    name: workCenter.name,
    description: workCenter.description,
    cost_per_hour: workCenter.costPerHour,
    capacity: workCenter.capacity,
    efficiency: workCenter.efficiency,
    status: workCenter.status,
    utilization: workCenter.utilization,
    location: workCenter.location,
    availability: workCenter.availability,
    maintenance_schedule: workCenter.maintenanceSchedule,
    next_maintenance: workCenter.nextMaintenance,
    operator_ids: workCenter.operatorIds,
    capabilities: workCenter.capabilities,
    working_hours: workCenter.workingHours,
    oee_score: workCenter.oeeScore,
    downtime_hours: workCenter.downtimeHours,
    productive_hours: workCenter.productiveHours,
  }
}

// Helper function to map frontend work center to API update request
const mapFrontendToApiUpdate = (updates: Partial<WorkCenter>): UpdateWorkCenterRequest => {
  const apiUpdates: UpdateWorkCenterRequest = {}

  if (updates.code !== undefined) apiUpdates.code = updates.code
  if (updates.name !== undefined) apiUpdates.name = updates.name
  if (updates.description !== undefined) apiUpdates.description = updates.description
  if (updates.costPerHour !== undefined) apiUpdates.cost_per_hour = updates.costPerHour
  if (updates.capacity !== undefined) apiUpdates.capacity = updates.capacity
  if (updates.efficiency !== undefined) apiUpdates.efficiency = updates.efficiency
  if (updates.status !== undefined) apiUpdates.status = updates.status
  if (updates.utilization !== undefined) apiUpdates.utilization = updates.utilization
  if (updates.location !== undefined) apiUpdates.location = updates.location
  if (updates.availability !== undefined) apiUpdates.availability = updates.availability
  if (updates.maintenanceSchedule !== undefined) apiUpdates.maintenance_schedule = updates.maintenanceSchedule
  if (updates.nextMaintenance !== undefined) apiUpdates.next_maintenance = updates.nextMaintenance
  if (updates.operatorIds !== undefined) apiUpdates.operator_ids = updates.operatorIds
  if (updates.capabilities !== undefined) apiUpdates.capabilities = updates.capabilities
  if (updates.workingHours !== undefined) apiUpdates.working_hours = updates.workingHours
  if (updates.oeeScore !== undefined) apiUpdates.oee_score = updates.oeeScore
  if (updates.downtimeHours !== undefined) apiUpdates.downtime_hours = updates.downtimeHours
  if (updates.productiveHours !== undefined) apiUpdates.productive_hours = updates.productiveHours

  return apiUpdates
}

export const useWorkCenters = () => {
  const [workCenters, setWorkCenters] = useState<WorkCenter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch work centers from API
  const fetchWorkCenters = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await workCenterService.getWorkCenters()
      const mappedWorkCenters = response.workCenters.map(mapApiToFrontend)
      setWorkCenters(mappedWorkCenters)
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch work centers'
      setError(errorMessage)
      console.error('Error fetching work centers:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchWorkCenters()
  }, [fetchWorkCenters])

  const createWorkCenter = async (workCenterData: Omit<WorkCenter, "id">) => {
    try {
      setError(null)
      const apiRequest = mapFrontendToApiCreate(workCenterData)
      const apiWorkCenter = await workCenterService.createWorkCenter(apiRequest)
      const newWorkCenter = mapApiToFrontend(apiWorkCenter)
      setWorkCenters((prev) => [...prev, newWorkCenter])
      return newWorkCenter
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create work center'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateWorkCenter = async (id: string, updates: Partial<WorkCenter>) => {
    try {
      setError(null)
      const apiUpdates = mapFrontendToApiUpdate(updates)
      const apiWorkCenter = await workCenterService.updateWorkCenter(id, apiUpdates)
      const updatedWorkCenter = mapApiToFrontend(apiWorkCenter)
      setWorkCenters((prev) => prev.map((wc) => (wc.id === id ? updatedWorkCenter : wc)))
      return updatedWorkCenter
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update work center'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteWorkCenter = async (id: string) => {
    try {
      setError(null)
      await workCenterService.deleteWorkCenter(id)
      setWorkCenters((prev) => prev.filter((wc) => wc.id !== id))
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete work center'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateUtilization = async (id: string, utilization: number, additionalData?: { oeeScore?: number; downtimeHours?: number; productiveHours?: number }) => {
    try {
      setError(null)
      const utilizationRequest: UtilizationUpdateRequest = {
        utilization,
        oee_score: additionalData?.oeeScore,
        downtime_hours: additionalData?.downtimeHours,
        productive_hours: additionalData?.productiveHours,
      }
      const apiWorkCenter = await workCenterService.updateUtilization(id, utilizationRequest)
      const updatedWorkCenter = mapApiToFrontend(apiWorkCenter)
      setWorkCenters((prev) => prev.map((wc) => (wc.id === id ? updatedWorkCenter : wc)))
      return updatedWorkCenter
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update utilization'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const refreshWorkCenters = useCallback(() => {
    fetchWorkCenters()
  }, [fetchWorkCenters])

  return {
    workCenters,
    loading,
    error,
    createWorkCenter,
    updateWorkCenter,
    deleteWorkCenter,
    updateUtilization,
    refreshWorkCenters,
  }
}
