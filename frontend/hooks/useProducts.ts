"use client"

import { useState, useEffect } from "react"
import type { Product } from "@/types"

// Mock data for products
const mockProducts: Product[] = [
  {
    id: "P-001",
    name: "Wooden Legs",
    description: "Oak wooden legs for tables and chairs",
    unit: "pieces",
    currentStock: 120,
    minStock: 50,
    maxStock: 200,
    unitCost: 15.0,
    category: "raw-material",
  },
  {
    id: "P-002",
    name: "Wooden Top",
    description: "Oak wooden table top",
    unit: "pieces",
    currentStock: 25,
    minStock: 10,
    maxStock: 50,
    unitCost: 45.0,
    category: "raw-material",
  },
  {
    id: "P-003",
    name: "Screws",
    description: "Wood screws for assembly",
    unit: "pieces",
    currentStock: 500,
    minStock: 200,
    maxStock: 1000,
    unitCost: 0.25,
    category: "raw-material",
  },
  {
    id: "P-004",
    name: "Varnish Bottle",
    description: "Wood varnish for finishing",
    unit: "bottles",
    currentStock: 15,
    minStock: 5,
    maxStock: 30,
    unitCost: 12.0,
    category: "raw-material",
  },
  {
    id: "P-005",
    name: "Wooden Table",
    description: "Complete wooden dining table",
    unit: "pieces",
    currentStock: 8,
    minStock: 2,
    maxStock: 20,
    unitCost: 150.0,
    category: "finished-good",
  },
  {
    id: "P-006",
    name: "Office Chair",
    description: "Ergonomic office chair with wooden frame",
    unit: "pieces",
    currentStock: 12,
    minStock: 5,
    maxStock: 25,
    unitCost: 120.0,
    category: "finished-good",
  },
]

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate API call
    const fetchProducts = async () => {
      setLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 500))
      setProducts(mockProducts)
      setLoading(false)
    }

    fetchProducts()
  }, [])

  const createProduct = async (productData: Omit<Product, "id">) => {
    const newProduct: Product = {
      ...productData,
      id: `P-${String(products.length + 1).padStart(3, "0")}`,
    }
    setProducts((prev) => [...prev, newProduct])
    return newProduct
  }

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((product) => (product.id === id ? { ...product, ...updates } : product)))
  }

  const deleteProduct = async (id: string) => {
    setProducts((prev) => prev.filter((product) => product.id !== id))
  }

  const adjustStock = async (id: string, quantity: number, type: "in" | "out") => {
    setProducts((prev) =>
      prev.map((product) =>
        product.id === id
          ? {
              ...product,
              currentStock: type === "in" ? product.currentStock + quantity : product.currentStock - quantity,
            }
          : product,
      ),
    )
  }

  return {
    products,
    loading,
    createProduct,
    updateProduct,
    deleteProduct,
    adjustStock,
  }
}
