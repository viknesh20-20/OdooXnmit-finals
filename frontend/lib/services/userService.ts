import { apiClient } from '@/lib/api'

export interface User {
  id: string
  username: string
  email: string
  firstName: string
  lastName: string
  fullName: string
  phone?: string
  status: 'active' | 'inactive' | 'locked'
  roleId: string
  roleName?: string
  emailVerified: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface GetUsersResponse {
  success: boolean
  data: {
    users: User[]
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface GetUsersParams {
  page?: number
  limit?: number
  status?: 'active' | 'inactive' | 'locked'
  roleId?: string
  emailVerified?: boolean
  search?: string
  sortBy?: 'username' | 'email' | 'firstName' | 'lastName' | 'createdAt' | 'lastLogin'
  sortOrder?: 'asc' | 'desc'
}

export const userService = {
  async getUsers(params: GetUsersParams = {}): Promise<GetUsersResponse> {
    const response = await apiClient.get('/users', { params })
    return response.data
  },

  async getUserById(id: string): Promise<{ success: boolean; data: User }> {
    const response = await apiClient.get(`/users/${id}`)
    return response.data
  },

  async getActiveUsers(): Promise<GetUsersResponse> {
    return this.getUsers({ 
      status: 'active', 
      limit: 100,
      sortBy: 'firstName',
      sortOrder: 'asc'
    })
  }
}
