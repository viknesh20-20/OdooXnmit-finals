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

  // BYPASS ALL ROLE AND PERMISSION RESTRICTIONS - Allow access to all authenticated users
  console.log('Role and permission checks bypassed - allowing access to all authenticated users', {
    userId: user.id,
    userRole: user.role,
    requiredRole,
    requiredPermissions
  })

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
