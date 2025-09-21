"use client"

import { useState, useEffect, useCallback } from "react"
import { userService, type User, type GetUsersParams } from "@/lib/services/userService"
import { ApiError } from "@/lib/api"

export const useUsers = (params: GetUsersParams = {}) => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await userService.getUsers({ ...params, page })
      setUsers(response.data.users)
      setTotal(response.data.total)
      setTotalPages(response.data.totalPages)
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch users'
      setError(errorMessage)
      console.error('Error fetching users:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [params, page])

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  const refreshUsers = useCallback(() => {
    fetchUsers()
  }, [fetchUsers])

  return {
    users,
    loading,
    error,
    total,
    page,
    totalPages,
    setPage,
    refreshUsers,
  }
}

// Hook specifically for getting active users for dropdowns
export const useActiveUsers = () => {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchActiveUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Replace with actual API call when users endpoint is implemented
      // For now, use mock data based on the seeded users from the database
      const mockUsers: User[] = [
        {
          id: "d3c806dc-2555-4a8b-a7c1-54f7962a04e8",
          username: "admin",
          email: "admin@manufacturing.com",
          firstName: "System",
          lastName: "Administrator",
          fullName: "System Administrator",
          phone: "+1-555-0100",
          status: "active",
          roleId: "9fc6f3fd-aa61-4707-926d-8582cf27adbb",
          roleName: "Administrator",
          emailVerified: true,
          createdAt: "2025-09-20T12:16:00.000Z",
          updatedAt: "2025-09-20T12:16:00.000Z"
        },
        {
          id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          username: "production_manager",
          email: "production@manufacturing.com",
          firstName: "John",
          lastName: "Smith",
          fullName: "John Smith",
          phone: "+1-555-0101",
          status: "active",
          roleId: "8eb5f2ec-99a0-4606-825d-7471c16b9daa",
          roleName: "Production Manager",
          emailVerified: true,
          createdAt: "2025-09-20T12:16:00.000Z",
          updatedAt: "2025-09-20T12:16:00.000Z"
        },
        {
          id: "b2c3d4e5-f6g7-8901-bcde-f23456789012",
          username: "quality_inspector",
          email: "quality@manufacturing.com",
          firstName: "Sarah",
          lastName: "Johnson",
          fullName: "Sarah Johnson",
          phone: "+1-555-0102",
          status: "active",
          roleId: "7da4e1db-88f9-4505-714c-6360c05b8c99",
          roleName: "Quality Inspector",
          emailVerified: true,
          createdAt: "2025-09-20T12:16:00.000Z",
          updatedAt: "2025-09-20T12:16:00.000Z"
        }
      ]

      setUsers(mockUsers)
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch active users'
      setError(errorMessage)
      console.error('Error fetching active users:', err)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchActiveUsers()
  }, [fetchActiveUsers])

  return {
    users,
    loading,
    error,
    refreshUsers: fetchActiveUsers,
  }
}
