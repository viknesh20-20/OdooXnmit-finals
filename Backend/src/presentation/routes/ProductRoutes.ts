import { Router } from 'express';
import { ProductController } from '@presentation/controllers/ProductController';
import { ProductValidator } from '@presentation/validators/ProductValidator';
import { authenticateToken } from '@presentation/middleware/AuthMiddleware';

const router = Router();
const productController = new ProductController();

// Apply authentication middleware to all product routes
router.use(authenticateToken);

/**
 * @route   GET /api/v1/products
 * @desc    Get all products with filtering, pagination, and search
 * @access  Private
 * @query   {number} page - Page number (default: 1)
 * @query   {number} limit - Items per page (default: 20, max: 100)
 * @query   {string} search - Search term for name, SKU, or description
 * @query   {string} category - Filter by category ID
 * @query   {string} type - Filter by product type (raw_material, work_in_progress, finished_good)
 * @query   {string} status - Filter by status (active, inactive, all) (default: active)
 * @query   {string} sortBy - Sort field (name, sku, type, cost_price, selling_price, created_at)
 * @query   {string} sortOrder - Sort order (asc, desc) (default: asc)
 */
router.get(
  '/',
  ProductValidator.getProductsValidation(),
  productController.getProducts.bind(productController)
);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get a single product by ID
 * @access  Private
 * @param   {string} id - Product UUID
 */
router.get(
  '/:id',
  ProductValidator.getProductValidation(),
  productController.getProduct.bind(productController)
);

/**
 * @route   POST /api/v1/products
 * @desc    Create a new product
 * @access  Private
 * @body    {object} product - Product data
 * @body    {string} product.sku - Product SKU (required, unique)
 * @body    {string} product.name - Product name (required)
 * @body    {string} [product.description] - Product description
 * @body    {string} [product.category_id] - Category UUID
 * @body    {string} [product.uom_id] - Unit of measure UUID
 * @body    {string} product.type - Product type (required)
 * @body    {number} product.cost_price - Cost price (required)
 * @body    {number} [product.selling_price] - Selling price
 * @body    {number} product.min_stock_level - Minimum stock level (required)
 * @body    {number} product.max_stock_level - Maximum stock level (required)
 * @body    {number} product.reorder_point - Reorder point (required)
 * @body    {number} product.lead_time_days - Lead time in days (required)
 * @body    {boolean} [product.is_active] - Active status (default: true)
 * @body    {object} [product.specifications] - Product specifications
 * @body    {array} [product.attachments] - Product attachments
 */
router.post(
  '/',
  ProductValidator.createProductValidation(),
  productController.createProduct.bind(productController)
);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update an existing product
 * @access  Private
 * @param   {string} id - Product UUID
 * @body    {object} product - Product data (all fields optional)
 * @body    {string} [product.sku] - Product SKU (must be unique)
 * @body    {string} [product.name] - Product name
 * @body    {string} [product.description] - Product description
 * @body    {string} [product.category_id] - Category UUID
 * @body    {string} [product.uom_id] - Unit of measure UUID
 * @body    {string} [product.type] - Product type
 * @body    {number} [product.cost_price] - Cost price
 * @body    {number} [product.selling_price] - Selling price
 * @body    {number} [product.min_stock_level] - Minimum stock level
 * @body    {number} [product.max_stock_level] - Maximum stock level
 * @body    {number} [product.reorder_point] - Reorder point
 * @body    {number} [product.lead_time_days] - Lead time in days
 * @body    {boolean} [product.is_active] - Active status
 * @body    {object} [product.specifications] - Product specifications
 * @body    {array} [product.attachments] - Product attachments
 */
router.put(
  '/:id',
  ProductValidator.updateProductValidation(),
  productController.updateProduct.bind(productController)
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete a product (soft delete - sets is_active to false)
 * @access  Private
 * @param   {string} id - Product UUID
 */
router.delete(
  '/:id',
  ProductValidator.deleteProductValidation(),
  productController.deleteProduct.bind(productController)
);

export default router;
