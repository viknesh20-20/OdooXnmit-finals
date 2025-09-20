"use client"

import React from 'react'
import { Card, CardContent } from './card'
import { Button } from './button'
import { Alert, AlertDescription } from './alert'
import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'

interface ErrorStateProps {
  error: string | null
  onRetry?: () => void
  title?: string
  description?: string
  showRetry?: boolean
  variant?: 'card' | 'alert' | 'inline'
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  onRetry,
  title = "Error",
  description,
  showRetry = true,
  variant = 'card',
  className = ''
}) => {
  if (!error) return null

  const isNetworkError = error.toLowerCase().includes('network') || error.toLowerCase().includes('connection')
  const Icon = isNetworkError ? WifiOff : AlertTriangle

  const content = (
    <>
      <div className="flex items-center gap-2 text-destructive mb-2">
        <Icon className="h-5 w-5" />
        <span className="font-medium">{title}</span>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        {description || error}
      </p>
      {showRetry && onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </>
  )

  if (variant === 'alert') {
    return (
      <Alert variant="destructive" className={className}>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>{error}</span>
          {showRetry && onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="ml-2">
              <RefreshCw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`text-center py-8 ${className}`}>
        {content}
      </div>
    )
  }

  return (
    <Card className={`border-destructive ${className}`}>
      <CardContent className="pt-6">
        {content}
      </CardContent>
    </Card>
  )
}

// Loading state component
interface LoadingStateProps {
  message?: string
  variant?: 'card' | 'inline' | 'spinner'
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading...",
  variant = 'card',
  className = ''
}) => {
  const spinner = (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  )

  const content = (
    <div className="flex flex-col items-center justify-center gap-4">
      {spinner}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )

  if (variant === 'spinner') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        {spinner}
      </div>
    )
  }

  if (variant === 'inline') {
    return (
      <div className={`text-center py-8 ${className}`}>
        {content}
      </div>
    )
  }

  return (
    <Card className={className}>
      <CardContent className="pt-6">
        {content}
      </CardContent>
    </Card>
  )
}

// Empty state component
interface EmptyStateProps {
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  icon?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = "No data found",
  description = "There's nothing to display at the moment.",
  action,
  icon,
  className = ''
}) => {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="text-center py-8">
          {icon && (
            <div className="flex justify-center mb-4 text-muted-foreground">
              {icon}
            </div>
          )}
          <h3 className="font-medium mb-2">{title}</h3>
          <p className="text-sm text-muted-foreground mb-4">{description}</p>
          {action && (
            <Button onClick={action.onClick} variant="outline">
              {action.label}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
