"use client"

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components/ui/error-state'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'manager' | 'operator' | 'inventory'
  requiredPermissions?: string[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermissions = []
}) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingState message="Checking authentication..." />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role requirements
  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Required role: {requiredRole}, Your role: {user.role}
          </p>
        </div>
      </div>
    )
  }

  // Check permission requirements (if implemented)
  if (requiredPermissions.length > 0) {
    const userPermissions = user.permissions || []
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      userPermissions.includes(permission) || user.role === 'admin'
    )

    if (!hasRequiredPermissions) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-destructive mb-2">Access Denied</h2>
            <p className="text-muted-foreground">
              You don't have the required permissions to access this page.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Required permissions: {requiredPermissions.join(', ')}
            </p>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

// Higher-order component for role-based access
export const withRoleProtection = (
  Component: React.ComponentType<any>,
  requiredRole?: 'admin' | 'manager' | 'operator' | 'inventory',
  requiredPermissions?: string[]
) => {
  return (props: any) => (
    <ProtectedRoute requiredRole={requiredRole} requiredPermissions={requiredPermissions}>
      <Component {...props} />
    </ProtectedRoute>
  )
}

// Role-specific protected route components
export const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
)

export const ManagerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="manager">{children}</ProtectedRoute>
)

export const OperatorRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="operator">{children}</ProtectedRoute>
)

export const InventoryRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ProtectedRoute requiredRole="inventory">{children}</ProtectedRoute>
)
