/**
 * Utility functions for generating unique IDs and references
 */

/**
 * Generate a unique ID with timestamp and random component
 */
export const generateId = (): string => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `${timestamp}-${random}`
}

/**
 * Generate a formatted reference number for different entity types
 */
export const generateReference = (type: string, prefix?: string): string => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  
  const prefixes = {
    manufacturing: 'MO',
    workorder: 'WO',
    workcenter: 'WC',
    product: 'PRD',
    bom: 'BOM',
    stock: 'STK',
  }
  
  const refPrefix = prefix || prefixes[type as keyof typeof prefixes] || 'REF'
  return `${refPrefix}-${timestamp.toString().slice(-6)}-${random}`
}

/**
 * Generate a sequential reference number (for display purposes)
 */
export const generateSequentialRef = (type: string, count: number): string => {
  const prefixes = {
    manufacturing: 'MO',
    workorder: 'WO',
    workcenter: 'WC',
    product: 'PRD',
    bom: 'BOM',
    stock: 'STK',
  }
  
  const prefix = prefixes[type as keyof typeof prefixes] || 'REF'
  const paddedCount = (count + 1).toString().padStart(4, '0')
  return `${prefix}-${paddedCount}`
}

/**
 * Generate a batch/lot number
 */
export const generateBatchNumber = (): string => {
  const date = new Date()
  const year = date.getFullYear().toString().slice(-2)
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const random = Math.floor(Math.random() * 999).toString().padStart(3, '0')
  
  return `B${year}${month}${day}-${random}`
}

/**
 * Generate a work order number based on manufacturing order
 */
export const generateWorkOrderRef = (moReference: string, sequence: number): string => {
  return `${moReference}-WO${sequence.toString().padStart(2, '0')}`
}