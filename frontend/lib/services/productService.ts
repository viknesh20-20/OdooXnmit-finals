import apiClient, { ApiResponse, PaginatedResponse } from '../api';

// Product Types
export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  uomId?: string;
  type: 'raw_material' | 'work_in_progress' | 'finished_good';
  costPrice: number;
  sellingPrice: number;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  leadTimeDays: number;
  isActive: boolean;
  specifications?: Record<string, any>;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  uom_id?: string;
  type: 'raw_material' | 'work_in_progress' | 'finished_good';
  cost_price: number;
  selling_price?: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  lead_time_days: number;
  is_active?: boolean;
  specifications?: Record<string, any>;
  attachments?: string[];
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  type?: 'raw_material' | 'work_in_progress' | 'finished_good';
  status?: 'active' | 'inactive' | 'all';
  sortBy?: 'name' | 'sku' | 'type' | 'cost_price' | 'selling_price' | 'created_at';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

class ProductService {
  private readonly basePath = '/products';

  /**
   * Get all products with optional filtering and pagination
   */
  async getProducts(params?: GetProductsParams): Promise<ProductsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const url = queryString ? `${this.basePath}?${queryString}` : this.basePath;
    
    const response: PaginatedResponse<Product> = await apiClient.get(url);
    return {
      products: (response.data as any).products || [],
      pagination: response.data.pagination
    };
  }

  /**
   * Get a single product by ID
   */
  async getProduct(id: string): Promise<Product> {
    const response: ApiResponse<{ product: Product }> = await apiClient.get(`${this.basePath}/${id}`);
    return response.data!.product;
  }

  /**
   * Create a new product
   */
  async createProduct(productData: CreateProductRequest): Promise<Product> {
    const response: ApiResponse<{ product: Product }> = await apiClient.post(this.basePath, productData);
    return response.data!.product;
  }

  /**
   * Update an existing product
   */
  async updateProduct(id: string, productData: UpdateProductRequest): Promise<Product> {
    const response: ApiResponse<{ product: Product }> = await apiClient.put(`${this.basePath}/${id}`, productData);
    return response.data!.product;
  }

  /**
   * Delete a product (soft delete)
   */
  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`${this.basePath}/${id}`);
  }

  /**
   * Get products by type
   */
  async getProductsByType(type: 'raw_material' | 'work_in_progress' | 'finished_good'): Promise<Product[]> {
    const response = await this.getProducts({ type, status: 'active' });
    return response.products;
  }

  /**
   * Search products by name or SKU
   */
  async searchProducts(searchTerm: string, limit: number = 20): Promise<Product[]> {
    const response = await this.getProducts({ search: searchTerm, limit, status: 'active' });
    return response.products;
  }

  /**
   * Get low stock products (below reorder point)
   */
  async getLowStockProducts(): Promise<Product[]> {
    // This would require additional backend endpoint or filtering logic
    // For now, get all products and filter client-side (not ideal for production)
    const response = await this.getProducts({ status: 'active', limit: 1000 });
    return response.products.filter(product => {
      // This would need actual stock levels from inventory
      // For now, return products with low min stock levels as placeholder
      return product.minStockLevel < 50;
    });
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    const response = await this.getProducts({ category: categoryId, status: 'active' });
    return response.products;
  }

  /**
   * Bulk update products
   */
  async bulkUpdateProducts(updates: Array<{ id: string; data: UpdateProductRequest }>): Promise<Product[]> {
    // This would require a bulk update endpoint on the backend
    // For now, update products individually
    const updatedProducts: Product[] = [];
    
    for (const update of updates) {
      try {
        const updatedProduct = await this.updateProduct(update.id, update.data);
        updatedProducts.push(updatedProduct);
      } catch (error) {
        console.error(`Failed to update product ${update.id}:`, error);
        // Continue with other updates
      }
    }
    
    return updatedProducts;
  }

  /**
   * Get product statistics
   */
  async getProductStats(): Promise<{
    total: number;
    byType: Record<string, number>;
    lowStock: number;
    inactive: number;
  }> {
    // This would ideally be a dedicated endpoint
    // For now, calculate from all products
    const [activeProducts, inactiveProducts] = await Promise.all([
      this.getProducts({ status: 'active', limit: 1000 }),
      this.getProducts({ status: 'inactive', limit: 1000 })
    ]);

    const byType = activeProducts.products.reduce((acc, product) => {
      acc[product.type] = (acc[product.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const lowStock = activeProducts.products.filter(product => 
      product.minStockLevel < 50 // Placeholder logic
    ).length;

    return {
      total: activeProducts.products.length,
      byType,
      lowStock,
      inactive: inactiveProducts.products.length,
    };
  }
}

// Export singleton instance
export const productService = new ProductService();
export default productService;
