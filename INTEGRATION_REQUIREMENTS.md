# Frontend-Backend-Database Integration Requirements

## Executive Summary
This document outlines the comprehensive requirements for integrating the frontend React application with the backend Node.js API and PostgreSQL database for the Manufacturing ERP system. The current system has extensive mock data in the frontend that needs to be replaced with real database-backed API endpoints.

## Current State Analysis

### Frontend Mock Data (TO BE REPLACED)
- **Products**: 6 mock products with stock levels, costs, categories
- **Manufacturing Orders**: 5 mock orders with status, dates, assignees  
- **BOMs**: 3 mock BOMs with components and operations
- **Work Orders**: 5 mock work orders with operations, work centers, status
- **Work Centers**: 6 mock work centers with utilization, capacity, costs
- **Stock Movements**: 6 mock stock movements with types, quantities, references
- **Reports**: Complex mock report data with production metrics, quality data

### Backend Current State
- **Existing**: Authentication system, basic domain entities, some use cases
- **Missing**: Most controllers, API routes, complete database models

### Database Current State  
- **Existing**: Users, Products, BOMs, Manufacturing Orders (partial)
- **Missing**: Work Centers, Work Orders, Stock Movements, Reports tables

## Phase 2: Database Design & Implementation

### Missing Database Models & Migrations

#### 1. Work Centers Model
```sql
CREATE TABLE work_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cost_per_hour DECIMAL(10,2) DEFAULT 0.00,
    capacity INTEGER DEFAULT 1,
    efficiency DECIMAL(5,2) DEFAULT 100.00,
    status VARCHAR(20) DEFAULT 'active',
    utilization DECIMAL(5,2) DEFAULT 0.00,
    location VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Work Orders Model
```sql
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wo_number VARCHAR(50) UNIQUE NOT NULL,
    manufacturing_order_id UUID NOT NULL REFERENCES manufacturing_orders(id),
    work_center_id UUID NOT NULL REFERENCES work_centers(id),
    operation VARCHAR(255) NOT NULL,
    operation_type VARCHAR(100),
    duration INTEGER NOT NULL, -- in minutes
    estimated_duration INTEGER,
    actual_duration INTEGER,
    status VARCHAR(20) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    assigned_to UUID REFERENCES users(id),
    sequence INTEGER DEFAULT 1,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    pause_time INTEGER DEFAULT 0,
    instructions TEXT,
    comments TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

#### 3. Stock Movements Model
```sql
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    type VARCHAR(20) NOT NULL, -- 'in', 'out'
    quantity DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_cost DECIMAL(15,4),
    total_value DECIMAL(15,4),
    reference VARCHAR(100) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    from_location VARCHAR(255),
    to_location VARCHAR(255),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    processed_by UUID REFERENCES users(id),
    notes TEXT,
    batch_number VARCHAR(100),
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. BOM Operations Model (Missing)
```sql
CREATE TABLE bom_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID NOT NULL REFERENCES boms(id) ON DELETE CASCADE,
    operation VARCHAR(255) NOT NULL,
    operation_type VARCHAR(100),
    work_center_id UUID REFERENCES work_centers(id),
    duration INTEGER NOT NULL, -- in minutes
    setup_time INTEGER DEFAULT 0,
    teardown_time INTEGER DEFAULT 0,
    cost_per_hour DECIMAL(10,2) DEFAULT 0.00,
    total_cost DECIMAL(15,4) DEFAULT 0.00,
    sequence INTEGER NOT NULL,
    description TEXT,
    instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
```

### Data Population Requirements
- **Products**: 20+ realistic manufacturing products (raw materials, components, finished goods)
- **Work Centers**: 8-10 work centers with different capabilities and costs
- **BOMs**: Complete BOMs for finished products with components and operations
- **Manufacturing Orders**: Historical and active orders with realistic timelines
- **Work Orders**: Generated from manufacturing orders with proper sequencing
- **Stock Movements**: Transaction history showing material flow
- **Users**: Different roles (admin, manager, operator, inventory)

## Phase 3: Backend API Development

### Required API Endpoints

#### Products API
- `GET /api/v1/products` - List all products with filtering/pagination
- `GET /api/v1/products/:id` - Get single product
- `POST /api/v1/products` - Create new product
- `PUT /api/v1/products/:id` - Update product
- `DELETE /api/v1/products/:id` - Delete product
- `GET /api/v1/products/low-stock` - Get low stock products

#### Manufacturing Orders API  
- `GET /api/v1/manufacturing-orders` - List orders with filtering
- `GET /api/v1/manufacturing-orders/:id` - Get single order
- `POST /api/v1/manufacturing-orders` - Create new order
- `PUT /api/v1/manufacturing-orders/:id` - Update order
- `DELETE /api/v1/manufacturing-orders/:id` - Cancel order
- `POST /api/v1/manufacturing-orders/:id/start` - Start order
- `POST /api/v1/manufacturing-orders/:id/complete` - Complete order

#### Work Centers API
- `GET /api/v1/work-centers` - List all work centers
- `GET /api/v1/work-centers/:id` - Get single work center
- `POST /api/v1/work-centers` - Create work center
- `PUT /api/v1/work-centers/:id` - Update work center
- `DELETE /api/v1/work-centers/:id` - Delete work center
- `PUT /api/v1/work-centers/:id/utilization` - Update utilization

#### Work Orders API
- `GET /api/v1/work-orders` - List work orders with filtering
- `GET /api/v1/work-orders/:id` - Get single work order
- `POST /api/v1/work-orders` - Create work order
- `PUT /api/v1/work-orders/:id` - Update work order
- `POST /api/v1/work-orders/:id/start` - Start work order
- `POST /api/v1/work-orders/:id/pause` - Pause work order
- `POST /api/v1/work-orders/:id/complete` - Complete work order

#### BOMs API
- `GET /api/v1/boms` - List BOMs
- `GET /api/v1/boms/:id` - Get single BOM
- `POST /api/v1/boms` - Create BOM
- `PUT /api/v1/boms/:id` - Update BOM
- `DELETE /api/v1/boms/:id` - Delete BOM

#### Stock Movements API
- `GET /api/v1/stock-movements` - List stock movements with filtering
- `POST /api/v1/stock-movements` - Create stock movement
- `GET /api/v1/stock-movements/product/:productId` - Get movements for product

#### Reports API
- `GET /api/v1/reports/production-summary` - Production metrics
- `GET /api/v1/reports/quality-metrics` - Quality data
- `GET /api/v1/reports/work-center-utilization` - Utilization data
- `GET /api/v1/reports/inventory` - Inventory report
- `POST /api/v1/reports/export` - Export reports (PDF/Excel)

### API Standards
- RESTful design principles
- Consistent response format with success/error structure
- Comprehensive input validation using Joi or similar
- Proper HTTP status codes
- Request/response logging
- Rate limiting and security headers
- Pagination for list endpoints
- Filtering and sorting capabilities

## Phase 4: Frontend Integration

### Hook Replacements
Replace all mock data hooks with real API calls:
- `useProducts` → API calls to `/api/v1/products`
- `useManufacturingOrders` → API calls to `/api/v1/manufacturing-orders`
- `useBOMs` → API calls to `/api/v1/boms`
- `useWorkOrders` → API calls to `/api/v1/work-orders`
- `useWorkCenters` → API calls to `/api/v1/work-centers`
- `useStockMovements` → API calls to `/api/v1/stock-movements`
- `useReports` → API calls to `/api/v1/reports`

### Error Handling Requirements
- Network error handling with retry logic
- User-friendly error messages
- Loading states for all async operations
- Optimistic updates where appropriate
- Form validation with real-time feedback

### Authentication Integration
- JWT token management
- Automatic token refresh
- Protected route handling
- Role-based access control
- Session timeout handling

## Success Criteria
1. ✅ Zero mock data in frontend
2. ✅ All CRUD operations functional
3. ✅ Real-time data updates
4. ✅ Comprehensive error handling
5. ✅ Production-ready performance
6. ✅ 100% test coverage for critical paths
7. ✅ Security best practices implemented
8. ✅ Responsive design maintained

## Timeline Estimate
- **Phase 2**: Database (2-3 days)
- **Phase 3**: Backend APIs (4-5 days)  
- **Phase 4**: Frontend Integration (3-4 days)
- **Phase 5**: Testing & QA (2-3 days)
- **Total**: 11-15 days
