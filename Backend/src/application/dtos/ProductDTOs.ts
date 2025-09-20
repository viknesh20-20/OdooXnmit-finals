import { UUID, ProductType } from '@/types/common';

export interface CreateProductDTO {
  readonly name: string;
  readonly sku: string;
  readonly description?: string;
  readonly productType: ProductType;
  readonly categoryId?: UUID;
  readonly costPrice: number;
  readonly sellingPrice: number;
  readonly currency?: string;
  readonly minStockLevel: number;
  readonly maxStockLevel: number;
  readonly reorderPoint: number;
  readonly unitOfMeasure: string;
  readonly isActive?: boolean;
  readonly metadata?: Record<string, unknown>;
}

export interface UpdateProductDTO {
  readonly id: UUID;
  readonly name?: string;
  readonly sku?: string;
  readonly description?: string;
  readonly productType?: ProductType;
  readonly categoryId?: UUID;
  readonly costPrice?: number;
  readonly sellingPrice?: number;
  readonly currency?: string;
  readonly minStockLevel?: number;
  readonly maxStockLevel?: number;
  readonly reorderPoint?: number;
  readonly unitOfMeasure?: string;
  readonly isActive?: boolean;
  readonly metadata?: Record<string, unknown>;
}

export interface ProductResponseDTO {
  readonly id: UUID;
  readonly name: string;
  readonly sku: string;
  readonly description?: string;
  readonly productType: ProductType;
  readonly categoryId?: UUID;
  readonly categoryName?: string;
  readonly costPrice: number;
  readonly sellingPrice: number;
  readonly currency: string;
  readonly minStockLevel: number;
  readonly maxStockLevel: number;
  readonly reorderPoint: number;
  readonly unitOfMeasure: string;
  readonly isActive: boolean;
  readonly metadata?: Record<string, unknown>;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ProductListDTO {
  readonly id: UUID;
  readonly name: string;
  readonly sku: string;
  readonly productType: ProductType;
  readonly categoryName?: string;
  readonly sellingPrice: number;
  readonly currency: string;
  readonly isActive: boolean;
  readonly createdAt: Date;
}

export interface ProductSearchDTO {
  readonly name?: string;
  readonly sku?: string;
  readonly productType?: ProductType;
  readonly categoryId?: UUID;
  readonly isActive?: boolean;
  readonly minPrice?: number;
  readonly maxPrice?: number;
  readonly page?: number;
  readonly limit?: number;
}
