"use client"

import React from "react"
import { AlertTriangle, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface FormErrorProps {
  error?: string | string[] | null
  className?: string
  variant?: 'default' | 'destructive' | 'inline'
  dismissible?: boolean
  onDismiss?: () => void
}

export const FormError: React.FC<FormErrorProps> = ({
  error,
  className = '',
  variant = 'destructive',
  dismissible = false,
  onDismiss
}) => {
  if (!error) return null

  const errors = Array.isArray(error) ? error : [error]
  
  if (variant === 'inline') {
    return (
      <div className={`text-sm text-destructive mt-1 ${className}`}>
        {errors.map((err, index) => (
          <div key={index} className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 flex-shrink-0" />
            <span>{err}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <Alert variant={variant} className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1">
          {errors.length === 1 ? (
            <span>{errors[0]}</span>
          ) : (
            <ul className="list-disc list-inside space-y-1">
              {errors.map((err, index) => (
                <li key={index}>{err}</li>
              ))}
            </ul>
          )}
        </div>
        {dismissible && onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="ml-2 h-auto p-1"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

interface FieldErrorProps {
  error?: string | null
  className?: string
}

export const FieldError: React.FC<FieldErrorProps> = ({
  error,
  className = ''
}) => {
  if (!error) return null

  return (
    <div className={`text-sm text-destructive mt-1 flex items-center gap-1 ${className}`}>
      <AlertTriangle className="h-3 w-3 flex-shrink-0" />
      <span>{error}</span>
    </div>
  )
}

interface FormValidationSummaryProps {
  errors: Record<string, string | string[]>
  className?: string
  title?: string
}

export const FormValidationSummary: React.FC<FormValidationSummaryProps> = ({
  errors,
  className = '',
  title = 'Please fix the following errors:'
}) => {
  const errorEntries = Object.entries(errors).filter(([_, error]) => error)
  
  if (errorEntries.length === 0) return null

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="font-medium mb-2">{title}</div>
        <ul className="list-disc list-inside space-y-1">
          {errorEntries.map(([field, error]) => {
            const fieldName = field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')
            const errorMessages = Array.isArray(error) ? error : [error]
            return errorMessages.map((msg, index) => (
              <li key={`${field}-${index}`}>
                <span className="font-medium">{fieldName}:</span> {msg}
              </li>
            ))
          })}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
