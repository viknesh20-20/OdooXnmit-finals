"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User } from "@/types"
import { authService, type AuthUser } from "@/lib/services/authService"
import { ApiError } from "@/lib/api"

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  signup: (email: string, password: string, name: string, role: User["role"]) => Promise<boolean>
  refreshToken: () => Promise<string>
  updateUser: (user: Partial<User>) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Helper function to map AuthUser to User
const mapAuthUserToUser = (authUser: AuthUser): User => ({
  id: authUser.id,
  email: authUser.email,
  name: `${authUser.firstName} ${authUser.lastName}`,
  firstName: authUser.firstName,
  lastName: authUser.lastName,
  phone: authUser.phone,
  role: (authUser.role?.name || 'operator') as User['role'],
  isActive: authUser.isActive,
  createdAt: authUser.createdAt,
  updatedAt: authUser.updatedAt,
})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Initialize auth state from localStorage
    const initializeAuth = async () => {
      try {
        const storedToken = localStorage.getItem('auth_token')
        const storedUser = localStorage.getItem('auth_user')
        const lastValidation = localStorage.getItem('auth_last_validation')

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))

          // Only validate token if it hasn't been validated recently (within last 5 minutes)
          const now = Date.now()
          const lastValidationTime = lastValidation ? parseInt(lastValidation) : 0
          const validationInterval = 5 * 60 * 1000 // 5 minutes

          if (now - lastValidationTime > validationInterval) {
            try {
              await validateToken(storedToken)
              localStorage.setItem('auth_last_validation', now.toString())
            } catch (error) {
              // Token validation failed, but don't immediately clear auth state
              // Let the API interceptor handle token refresh first
              console.warn('Token validation failed, will attempt refresh on next API call')
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        // Don't clear auth state on initialization errors
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const validateToken = async (token: string): Promise<void> => {
    try {
      // Temporarily set the token for validation
      const originalToken = localStorage.getItem('auth_token')
      localStorage.setItem('auth_token', token)

      const result = await authService.validateToken()

      // Restore original token
      if (originalToken) {
        localStorage.setItem('auth_token', originalToken)
      } else {
        localStorage.removeItem('auth_token')
      }

      if (!result.valid) {
        throw new Error('Token validation failed')
      }
    } catch (error) {
      throw new Error('Token validation failed')
    }
  }

  const clearAuthState = (): void => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_last_validation')
    localStorage.removeItem('manufacturing_user') // Remove legacy storage
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Try real API authentication first
      try {
        const loginResponse = await authService.login({
          usernameOrEmail: email,
          password: password
        })

        // Store access token and user data (refresh token is handled via httpOnly cookie)
        localStorage.setItem('auth_token', loginResponse.accessToken)
        localStorage.setItem('auth_user', JSON.stringify(loginResponse.user))
        localStorage.setItem('auth_last_validation', Date.now().toString())

        setToken(loginResponse.accessToken)
        setUser(mapAuthUserToUser(loginResponse.user))
        return true
      } catch (apiError) {
        console.error('Authentication failed:', apiError)
        return false
      }
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string, name: string): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Try real API registration first
      try {
        const nameParts = name.split(' ')
        const firstName = nameParts[0] || name
        const lastName = nameParts.slice(1).join(' ') || ''

        const registerResponse = await authService.register({
          username: authService.generateUsername(email),
          email,
          password,
          firstName,
          lastName,
          // Note: roleId would need to be mapped from role name to UUID
          // For now, we'll let the backend assign a default role
        })

        // Store access token and user data (refresh token is handled via httpOnly cookie)
        localStorage.setItem('auth_token', registerResponse.accessToken)
        localStorage.setItem('auth_user', JSON.stringify(registerResponse.user))

        setToken(registerResponse.accessToken)
        setUser(mapAuthUserToUser(registerResponse.user))
        return true
      } catch (apiError) {
        console.warn('API registration failed:', apiError)

        // If it's a validation error, don't fall back to mock
        if (apiError instanceof ApiError && (apiError.status === 400 || apiError.status === 409)) {
          return false
        }

        console.error('Registration failed:', apiError)
        return false
      }
    } finally {
      setIsLoading(false)
    }
  }

  const refreshToken = async (): Promise<string> => {
    try {
      // Refresh token is handled via httpOnly cookie, so we don't need to pass it
      const refreshResponse = await authService.refreshToken()

      // Update stored access token
      localStorage.setItem('auth_token', refreshResponse.accessToken)

      setToken(refreshResponse.accessToken)
      return refreshResponse.accessToken
    } catch (error) {
      console.error('Token refresh error:', error)
      clearAuthState()
      throw error
    }
  }

  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem('auth_user', JSON.stringify(updatedUser))
      localStorage.removeItem('manufacturing_user') // Remove legacy storage
    }
  }

  const logout = () => {
    // Optional: Call logout endpoint to invalidate token on server
    if (token) {
      authService.logout().catch(error => {
        console.warn('Logout API call failed:', error)
      })
    }

    clearAuthState()
  }

  const isAuthenticated = !!token && !!user



  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    login,
    logout,
    signup,
    refreshToken,
    updateUser,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
