"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { User } from "@/types"

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
    const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
    const response = await fetch(`${apiBaseUrl}/auth/validate`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
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
        const apiBaseUrl = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:3000/api/v1'
        const response = await fetch(`${apiBaseUrl}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            usernameOrEmail: email,
            password: password
          }),
        })

        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data) {
            const { accessToken, user: userData } = result.data

            // Store tokens and user data
            localStorage.setItem('auth_token', accessToken)
            localStorage.setItem('auth_user', JSON.stringify(userData))

            setToken(accessToken)
            setUser({
              id: userData.id,
              email: userData.email,
              name: `${userData.firstName} ${userData.lastName}`,
              firstName: userData.firstName,
              lastName: userData.lastName,
              role: userData.role?.name || 'user',
              isActive: userData.isActive,
              createdAt: userData.createdAt,
              updatedAt: userData.updatedAt,
            })
            return true
          }
        }
      } catch (apiError) {
        console.warn('API authentication failed, falling back to mock auth:', apiError)
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

  const signup = async (email: string, _password: string, name: string, role: User["role"]): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Simulate API call
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
      setUser(mockUser)
      localStorage.setItem("manufacturing_user", JSON.stringify(mockUser))
      return true
    } finally {
      setIsLoading(false)
    }
  }

  const refreshToken = async (): Promise<string> => {
    try {
      const storedRefreshToken = localStorage.getItem('refresh_token')

      if (!storedRefreshToken) {
        throw new Error('No refresh token available')
      }

      const response = await fetch('/api/v1/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: storedRefreshToken }),
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      const { token: newToken, refreshToken: newRefreshToken } = data

      // Update stored tokens
      localStorage.setItem('auth_token', newToken)
      localStorage.setItem('refresh_token', newRefreshToken)

      setToken(newToken)
      return newToken
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
      fetch('/api/v1/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }).catch(error => {
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
