"use client"

import { useState, useEffect, useCallback } from "react"
import type { Product } from "@/types"
import { productService, type Product as ApiProduct, type CreateProductRequest, type UpdateProductRequest } from "@/lib/services/productService"
import { ApiError, apiClient } from "@/lib/api"
import { useAuth } from "@/contexts/AuthContext"

// Helper function to map API product to frontend product
const mapApiProductToFrontend = (apiProduct: ApiProduct): Product => {
  return {
    id: apiProduct.id,
    name: apiProduct.name,
    code: apiProduct.sku,
    description: apiProduct.description || "",
    unit: "pieces", // Default unit, could be enhanced with UOM lookup
    currentStock: 0, // TODO: Get from inventory/stock movements API
    availableStock: 0, // TODO: Calculate from stock movements
    reservedStock: 0, // TODO: Calculate from manufacturing orders
    minStock: apiProduct.minStockLevel,
    maxStock: apiProduct.maxStockLevel,
    reorderPoint: apiProduct.reorderPoint,
    unitCost: apiProduct.costPrice,
    sellingPrice: apiProduct.sellingPrice,
    category: mapApiTypeToCategory(apiProduct.type),
    leadTime: apiProduct.leadTimeDays,
    isActive: apiProduct.isActive,
    createdAt: apiProduct.createdAt,
    updatedAt: apiProduct.updatedAt,
  }
}

// Helper function to map frontend product to API create request
const mapFrontendToApiCreate = (product: Omit<Product, "id">): CreateProductRequest => {
  return {
    sku: product.code || `PROD-${Date.now()}`,
    name: product.name,
    description: product.description,
    type: mapCategoryToApiType(product.category),
    cost_price: product.unitCost,
    selling_price: product.sellingPrice || 0,
    min_stock_level: product.minStock,
    max_stock_level: product.maxStock,
    reorder_point: product.reorderPoint || product.minStock,
    lead_time_days: product.leadTime || 0,
    is_active: product.isActive !== false,
  }
}

// Helper function to map frontend product to API update request
const mapFrontendToApiUpdate = (updates: Partial<Product>): UpdateProductRequest => {
  const apiUpdates: UpdateProductRequest = {}

  if (updates.code !== undefined) apiUpdates.sku = updates.code
  if (updates.name !== undefined) apiUpdates.name = updates.name
  if (updates.description !== undefined) apiUpdates.description = updates.description
  if (updates.category !== undefined) apiUpdates.type = mapCategoryToApiType(updates.category)
  if (updates.unitCost !== undefined) apiUpdates.cost_price = updates.unitCost
  if (updates.sellingPrice !== undefined) apiUpdates.selling_price = updates.sellingPrice
  if (updates.minStock !== undefined) apiUpdates.min_stock_level = updates.minStock
  if (updates.maxStock !== undefined) apiUpdates.max_stock_level = updates.maxStock
  if (updates.reorderPoint !== undefined) apiUpdates.reorder_point = updates.reorderPoint
  if (updates.leadTime !== undefined) apiUpdates.lead_time_days = updates.leadTime
  if (updates.isActive !== undefined) apiUpdates.is_active = updates.isActive

  return apiUpdates
}

// Helper functions for category mapping
const mapApiTypeToCategory = (type: string): Product['category'] => {
  switch (type) {
    case 'raw_material': return 'raw-material'
    case 'finished_good': return 'finished-good'
    case 'work_in_progress': return 'component'
    default: return 'raw-material'
  }
}

const mapCategoryToApiType = (category: Product['category']): 'raw_material' | 'work_in_progress' | 'finished_good' => {
  switch (category) {
    case 'raw-material': return 'raw_material'
    case 'finished-good': return 'finished_good'
    case 'component': return 'work_in_progress'
    default: return 'raw_material'
  }
}

export const useProducts = () => {
  const { isAuthenticated, isLoading: authLoading, user } = useAuth()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch products from API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await productService.getProducts({ status: 'active' })
      const mappedProducts = response.products.map(mapApiProductToFrontend)
      setProducts(mappedProducts)
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to fetch products'
      setError(errorMessage)
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    // Only fetch products if user is authenticated and auth is not loading
    if (isAuthenticated && !authLoading) {
      fetchProducts()
    } else if (!authLoading && !isAuthenticated) {
      // User is not authenticated, clear data
      setProducts([])
      setLoading(false)
    }
  }, [isAuthenticated, authLoading, fetchProducts])

  const createProduct = async (productData: Omit<Product, "id">) => {
    try {
      setError(null)
      const apiRequest = mapFrontendToApiCreate(productData)
      const apiProduct = await productService.createProduct(apiRequest)
      const newProduct = mapApiProductToFrontend(apiProduct)
      setProducts((prev) => [...prev, newProduct])
      return newProduct
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to create product'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    try {
      setError(null)
      const apiUpdates = mapFrontendToApiUpdate(updates)
      const apiProduct = await productService.updateProduct(id, apiUpdates)
      const updatedProduct = mapApiProductToFrontend(apiProduct)
      setProducts((prev) => prev.map((product) => (product.id === id ? updatedProduct : product)))
      return updatedProduct
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to update product'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const deleteProduct = async (id: string) => {
    try {
      setError(null)
      await productService.deleteProduct(id)
      setProducts((prev) => prev.filter((product) => product.id !== id))
    } catch (err) {
      const errorMessage = err instanceof ApiError ? err.message : 'Failed to delete product'
      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const adjustStock = async (id: string, quantity: number, type: "in" | "out") => {
    try {
      // Create a stock movement record via API
      const movementData = {
        product_id: id,
        quantity: quantity,
        type: type, // Use 'in' or 'out' as backend calculates balance based on this
        unit: "pieces", // Default unit - could be made configurable
        reference: `ADJ-${Date.now()}`,
        reference_type: "adjustment",
        timestamp: new Date().toISOString(),
        notes: `Manual stock adjustment: ${Math.abs(quantity)} units ${type === "in" ? "added" : "removed"}`,
        processed_by: user?.id || "", // Use authenticated user ID
      }

      // Call the stock movements API to create the movement
      const response = await apiClient.post('/stock-movements', movementData)

      if (response.data?.success) {
        // Refresh products to get updated stock levels from the database
        await fetchProducts()
      } else {
        throw new Error(response.data?.error?.message || 'Failed to create stock movement')
      }
    } catch (err) {
      console.error('Failed to adjust stock:', err)
      let errorMessage = 'Failed to adjust stock'

      if (err instanceof ApiError) {
        errorMessage = err.message
      } else if (err instanceof Error) {
        errorMessage = err.message
      }

      setError(errorMessage)
      throw new Error(errorMessage)
    }
  }

  const refreshProducts = useCallback(() => {
    fetchProducts()
  }, [fetchProducts])

  return {
    products,
    loading,
    error,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
    refreshProducts,
  }
}
