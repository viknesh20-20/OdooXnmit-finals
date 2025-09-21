"use client"

import type React from "react"
import { useState } from "react"
import { useProducts } from "@/hooks/useProducts"
import { useStockMovements } from "@/hooks/useStockMovements"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProductCard } from "@/components/stock/ProductCard"
import { CreateProductModal } from "@/components/stock/CreateProductModal"
import { StockMovementsList } from "@/components/stock/StockMovementsList"
import { StockMovementModal } from "@/components/stock/StockMovementModal"
import { ErrorBoundary } from "@/components/ui/error-boundary"
import { Plus, Search, Filter, Loader2, Package, AlertTriangle, DollarSign, TrendingUp } from "lucide-react"
import type { Product } from "@/types"

export const StockLedger: React.FC = () => {
  const { products, loading: productsLoading, createProduct, updateProduct, adjustStock } = useProducts()
  const { movements, loading: movementsLoading, createMovement, updateMovement, deleteMovement, refetch: refetchMovements } = useStockMovements()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<Product["category"] | "all">("all")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [editingMovement, setEditingMovement] = useState<any>(null)

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      (product.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description || "").toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === "all" || product.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  // Calculate KPIs
  const kpis = {
    totalProducts: products.length,
    lowStockItems: products.filter((p) => (p.currentStock || 0) <= (p.minStock || 0)).length,
    totalValue: products.reduce((sum, p) => sum + (p.currentStock || 0) * (p.unitCost || 0), 0),
    rawMaterials: products.filter((p) => p.category === "raw-material").length,
    finishedGoods: products.filter((p) => p.category === "finished-good").length,
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setIsCreateModalOpen(true)
  }

  const handleSubmit = async (productData: Omit<Product, "id">) => {
    if (editingProduct) {
      await updateProduct(editingProduct.id, productData)
      setEditingProduct(null)
    } else {
      await createProduct(productData)
    }
  }

  const handleCloseModal = () => {
    setIsCreateModalOpen(false)
    setEditingProduct(null)
  }

  const handleStockAdjust = async (id: string, quantity: number, type: "in" | "out") => {
    try {
      await adjustStock(id, quantity, type)
      refetchMovements() // Refresh movements after stock adjustment
    } catch (error) {
      // Error is already handled in useProducts hook and will be displayed in the UI
      console.error('Stock adjustment failed:', error)
    }
  }

  const handleMovementSubmit = async (movementData: any) => {
    if (editingMovement) {
      await updateMovement(editingMovement.id, movementData)
      setEditingMovement(null)
    } else {
      await createMovement(movementData)
    }
    refetchMovements()
  }

  const handleCloseMovementModal = () => {
    setIsMovementModalOpen(false)
    setEditingMovement(null)
  }

  const handleEditMovement = (movement: any) => {
    setEditingMovement(movement)
    setIsMovementModalOpen(true)
  }

  const handleDeleteMovement = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this stock movement?")) {
      await deleteMovement(id)
      refetchMovements()
    }
  }

  if (productsLoading || movementsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Ledger</h1>
          <p className="text-muted-foreground">Track inventory levels, movements, and manage product master data</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsMovementModalOpen(true)} variant="outline">
            <TrendingUp className="mr-2 h-4 w-4" />
            Record Movement
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Product
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{kpis.lowStockItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${kpis.totalValue.toFixed(0)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Raw Materials</CardTitle>
            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{kpis.rawMaterials}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finished Goods</CardTitle>
            <div className="h-2 w-2 rounded-full bg-green-500"></div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{kpis.finishedGoods}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products, names, or descriptions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as Product["category"] | "all")}
                    className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="all">All Categories</option>
                    <option value="raw-material">Raw Materials</option>
                    <option value="finished-good">Finished Goods</option>
                    <option value="component">Components</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Grid */}
          <div className="grid gap-4">
            {filteredProducts.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No products found</p>
                </CardContent>
              </Card>
            ) : (
              filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onEdit={handleEdit} onStockAdjust={handleStockAdjust} />
              ))
            )}
          </div>
        </div>

        {/* Stock Movements Section */}
        <div className="space-y-6">
          <StockMovementsList
            movements={movements.slice(0, 10)}
            onEdit={handleEditMovement}
            onDelete={handleDeleteMovement}
          />
        </div>
      </div>

      {/* Create/Edit Product Modal */}
      <CreateProductModal
        isOpen={isCreateModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        editingProduct={editingProduct}
      />

      {/* Stock Movement Modal */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={handleCloseMovementModal}
        onSubmit={handleMovementSubmit}
        editingMovement={editingMovement}
      />
      </div>
    </ErrorBoundary>
  )
}
