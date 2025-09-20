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

        if (storedToken && storedUser) {
          setToken(storedToken)
          setUser(JSON.parse(storedUser))

          // Validate token by making a test API call (optional)
          try {
            await validateToken(storedToken)
          } catch (error) {
            // Token is invalid, clear auth state
            console.warn('Stored token is invalid, clearing auth state')
            clearAuthState()
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        clearAuthState()
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
    localStorage.removeItem('manufacturing_user') // Keep backward compatibility
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

        setToken(loginResponse.accessToken)
        setUser(mapAuthUserToUser(loginResponse.user))
        return true
      } catch (apiError) {
        console.warn('API authentication failed:', apiError)

        // If it's a validation or authentication error, don't fall back to mock
        if (apiError instanceof ApiError && (apiError.status === 401 || apiError.status === 400)) {
          return false
        }

        // For other errors (network, server), fall back to mock auth
        console.warn('Falling back to mock authentication')
      }

      // Fallback to mock authentication for development
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if ((email === "admin@manufacturing.com" || email === "admin") && password === "password123") {
        const mockUser: User = {
          id: "1",
          email,
          name: "Manufacturing Admin",
          firstName: "Manufacturing",
          lastName: "Admin",
          role: "admin",
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }

        // Generate mock token
        const mockToken = `mock_token_${Date.now()}`

        setUser(mockUser)
        setToken(mockToken)
        localStorage.setItem("manufacturing_user", JSON.stringify(mockUser))
        localStorage.setItem('auth_token', mockToken)
        localStorage.setItem('auth_user', JSON.stringify(mockUser))
        return true
      }
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (email: string, password: string, name: string, role: User["role"]): Promise<boolean> => {
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

        // For other errors, fall back to mock registration
        console.warn('Falling back to mock registration')
      }

      // Fallback to mock registration for development
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const mockUser: User = {
        id: Date.now().toString(),
        email,
        name,
        firstName: name.split(' ')[0] || name,
        lastName: name.split(' ')[1] || '',
        role,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Generate mock token
      const mockToken = `mock_token_${Date.now()}`

      setUser(mockUser)
      setToken(mockToken)
      localStorage.setItem("manufacturing_user", JSON.stringify(mockUser))
      localStorage.setItem('auth_token', mockToken)
      localStorage.setItem('auth_user', JSON.stringify(mockUser))
      return true
    } finally {
      setIsLoading(false)
    }
  }

  const refreshToken = async (): Promise<string> => {
    try {
      // Refresh token is handled via httpOnly cookie, so we don't need to pass it
      const refreshResponse = await authService.refreshToken('')

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
      localStorage.setItem('manufacturing_user', JSON.stringify(updatedUser)) // Keep backward compatibility
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

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    signup,
    refreshToken,
    updateUser,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
