import type { CreateManufacturingOrderForm } from "@/types"

export interface ValidationErrors {
  [key: string]: string
}

export const validateManufacturingOrderForm = (formData: CreateManufacturingOrderForm): ValidationErrors => {
  const errors: ValidationErrors = {}

  // Product validation
  if (!formData.productId?.trim()) {
    errors.productId = 'Product is required'
  }

  // BOM validation
  if (!formData.bomId?.trim()) {
    errors.bomId = 'Bill of Materials is required'
  }

  // Quantity validation
  if (!formData.quantity || formData.quantity <= 0) {
    errors.quantity = 'Quantity must be greater than 0'
  }

  // Due date validation
  if (!formData.dueDate?.trim()) {
    errors.dueDate = 'Due date is required'
  } else {
    const dueDate = new Date(formData.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day for comparison
    
    if (dueDate < today) {
      errors.dueDate = 'Due date cannot be in the past'
    }
  }

  // Assignee validation
  if (!formData.assigneeId?.trim()) {
    errors.assigneeId = 'Assignee is required'
  }

  // Priority validation
  if (!formData.priority?.trim()) {
    errors.priority = 'Priority is required'
  }

  return errors
}

export const hasValidationErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0
}

export const getErrorMessage = (errors: ValidationErrors, field: string): string | undefined => {
  return errors[field]
}

export const clearFieldError = (errors: ValidationErrors, field: string): ValidationErrors => {
  const newErrors = { ...errors }
  delete newErrors[field]
  return newErrors
}

export const setFieldError = (errors: ValidationErrors, field: string, message: string): ValidationErrors => {
  return {
    ...errors,
    [field]: message
  }
}

// Common validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  POSITIVE_NUMBER: 'Must be a positive number',
  FUTURE_DATE: 'Date must be in the future',
  INVALID_EMAIL: 'Please enter a valid email address',
  MIN_LENGTH: (min: number) => `Must be at least ${min} characters`,
  MAX_LENGTH: (max: number) => `Must be no more than ${max} characters`,
} as const
