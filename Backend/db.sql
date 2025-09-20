-- Manufacturing ERP Database Schema for PostgreSQL
-- Database: ERPDB
-- Version: 1.0
-- Created: 2025-09-20

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create database (run this separately if needed)
-- CREATE DATABASE "ERPDB" WITH OWNER postgres ENCODING 'UTF8';

-- Use the database
\c ERPDB;

-- Create ENUM types
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE mo_status AS ENUM ('draft', 'confirmed', 'in_progress', 'completed', 'cancelled');
CREATE TYPE wo_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE stock_transaction_type AS ENUM ('in', 'out', 'transfer', 'adjustment');
CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'urgent');

-- Roles table
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    status user_status DEFAULT 'active',
    role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMPTZ,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ,
    replaced_by UUID REFERENCES refresh_tokens(id)
);

-- Product categories table
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Units of measure table
CREATE TABLE units_of_measure (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    symbol VARCHAR(10) NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'weight', 'volume', 'length', 'count', etc.
    base_unit_id UUID REFERENCES units_of_measure(id),
    conversion_factor DECIMAL(15,6) DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES product_categories(id),
    uom_id UUID NOT NULL REFERENCES units_of_measure(id),
    type VARCHAR(20) DEFAULT 'manufactured', -- 'raw_material', 'manufactured', 'finished_good'
    cost_price DECIMAL(15,2) DEFAULT 0.00,
    selling_price DECIMAL(15,2) DEFAULT 0.00,
    min_stock_level DECIMAL(15,3) DEFAULT 0.000,
    max_stock_level DECIMAL(15,3) DEFAULT 0.000,
    reorder_point DECIMAL(15,3) DEFAULT 0.000,
    lead_time_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    specifications JSONB DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Work centers table
CREATE TABLE work_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    capacity_per_hour DECIMAL(10,2) DEFAULT 1.00,
    cost_per_hour DECIMAL(10,2) DEFAULT 0.00,
    efficiency_factor DECIMAL(5,4) DEFAULT 1.0000,
    is_active BOOLEAN DEFAULT TRUE,
    location VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Bill of Materials (BOM) table
CREATE TABLE bom (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT TRUE,
    total_cost DECIMAL(15,2) DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, version)
);

-- BOM components table
CREATE TABLE bom_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID NOT NULL REFERENCES bom(id) ON DELETE CASCADE,
    component_id UUID NOT NULL REFERENCES products(id),
    quantity DECIMAL(15,6) NOT NULL,
    unit_cost DECIMAL(15,2) DEFAULT 0.00,
    scrap_factor DECIMAL(5,4) DEFAULT 0.0000,
    sequence_number INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- BOM operations table
CREATE TABLE bom_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bom_id UUID NOT NULL REFERENCES bom(id) ON DELETE CASCADE,
    work_center_id UUID NOT NULL REFERENCES work_centers(id),
    operation_name VARCHAR(255) NOT NULL,
    sequence_number INTEGER NOT NULL,
    setup_time_minutes DECIMAL(8,2) DEFAULT 0.00,
    run_time_minutes DECIMAL(8,2) DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Manufacturing Orders table
CREATE TABLE manufacturing_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mo_number VARCHAR(50) UNIQUE NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id),
    bom_id UUID NOT NULL REFERENCES bom(id),
    quantity DECIMAL(15,6) NOT NULL,
    status mo_status DEFAULT 'draft',
    priority priority_level DEFAULT 'medium',
    planned_start_date TIMESTAMPTZ,
    planned_end_date TIMESTAMPTZ,
    actual_start_date TIMESTAMPTZ,
    actual_end_date TIMESTAMPTZ,
    created_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Work Orders table
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wo_number VARCHAR(50) UNIQUE NOT NULL,
    manufacturing_order_id UUID NOT NULL REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
    bom_operation_id UUID NOT NULL REFERENCES bom_operations(id),
    work_center_id UUID NOT NULL REFERENCES work_centers(id),
    status wo_status DEFAULT 'pending',
    sequence_number INTEGER NOT NULL,
    planned_start_date TIMESTAMPTZ,
    planned_end_date TIMESTAMPTZ,
    actual_start_date TIMESTAMPTZ,
    actual_end_date TIMESTAMPTZ,
    planned_duration_minutes DECIMAL(8,2),
    actual_duration_minutes DECIMAL(8,2),
    assigned_to UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Work Order Time Tracking table
CREATE TABLE work_order_time_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ,
    duration_minutes DECIMAL(8,2),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Warehouses table
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    location VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Stock Locations table
CREATE TABLE stock_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    aisle VARCHAR(20),
    rack VARCHAR(20),
    shelf VARCHAR(20),
    bin VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(warehouse_id, code)
);

-- Stock Ledger table (immutable transaction log)
CREATE TABLE stock_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    location_id UUID REFERENCES stock_locations(id),
    transaction_type stock_transaction_type NOT NULL,
    quantity DECIMAL(15,6) NOT NULL,
    unit_cost DECIMAL(15,2) DEFAULT 0.00,
    total_value DECIMAL(15,2) DEFAULT 0.00,
    balance_quantity DECIMAL(15,6) NOT NULL,
    balance_value DECIMAL(15,2) DEFAULT 0.00,
    reference_type VARCHAR(50), -- 'manufacturing_order', 'work_order', 'adjustment', etc.
    reference_id UUID,
    batch_number VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Material Reservations table
CREATE TABLE material_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    manufacturing_order_id UUID NOT NULL REFERENCES manufacturing_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    warehouse_id UUID NOT NULL REFERENCES warehouses(id),
    location_id UUID REFERENCES stock_locations(id),
    reserved_quantity DECIMAL(15,6) NOT NULL,
    consumed_quantity DECIMAL(15,6) DEFAULT 0.000,
    unit_cost DECIMAL(15,2) DEFAULT 0.00,
    batch_number VARCHAR(100),
    expiry_date DATE,
    reserved_by UUID NOT NULL REFERENCES users(id),
    reserved_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    released_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Quality Control table
CREATE TABLE quality_control (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID REFERENCES work_orders(id),
    manufacturing_order_id UUID REFERENCES manufacturing_orders(id),
    product_id UUID NOT NULL REFERENCES products(id),
    batch_number VARCHAR(100),
    inspection_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    inspector_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'passed', 'failed', 'rework'
    quantity_inspected DECIMAL(15,6) NOT NULL,
    quantity_passed DECIMAL(15,6) DEFAULT 0.000,
    quantity_failed DECIMAL(15,6) DEFAULT 0.000,
    defect_notes TEXT,
    corrective_action TEXT,
    attachments JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Audit Log table
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- System Settings table
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    data_type VARCHAR(20) DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
    is_read BOOLEAN DEFAULT FALSE,
    reference_type VARCHAR(50),
    reference_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMPTZ
);

-- File Attachments table
CREATE TABLE file_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_status ON users(status);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_type ON products(type);
CREATE INDEX idx_products_is_active ON products(is_active);

CREATE INDEX idx_bom_product_id ON bom(product_id);
CREATE INDEX idx_bom_is_active ON bom(is_active);

CREATE INDEX idx_bom_components_bom_id ON bom_components(bom_id);
CREATE INDEX idx_bom_components_component_id ON bom_components(component_id);

CREATE INDEX idx_manufacturing_orders_mo_number ON manufacturing_orders(mo_number);
CREATE INDEX idx_manufacturing_orders_product_id ON manufacturing_orders(product_id);
CREATE INDEX idx_manufacturing_orders_status ON manufacturing_orders(status);
CREATE INDEX idx_manufacturing_orders_created_by ON manufacturing_orders(created_by);

CREATE INDEX idx_work_orders_wo_number ON work_orders(wo_number);
CREATE INDEX idx_work_orders_mo_id ON work_orders(manufacturing_order_id);
CREATE INDEX idx_work_orders_status ON work_orders(status);
CREATE INDEX idx_work_orders_work_center_id ON work_orders(work_center_id);

CREATE INDEX idx_stock_ledger_product_id ON stock_ledger(product_id);
CREATE INDEX idx_stock_ledger_warehouse_id ON stock_ledger(warehouse_id);
CREATE INDEX idx_stock_ledger_created_at ON stock_ledger(created_at);
CREATE INDEX idx_stock_ledger_reference ON stock_ledger(reference_type, reference_id);

CREATE INDEX idx_material_reservations_mo_id ON material_reservations(manufacturing_order_id);
CREATE INDEX idx_material_reservations_product_id ON material_reservations(product_id);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

CREATE INDEX idx_file_attachments_reference ON file_attachments(reference_type, reference_id);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables with updated_at column
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_of_measure_updated_at BEFORE UPDATE ON units_of_measure FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_centers_updated_at BEFORE UPDATE ON work_centers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bom_updated_at BEFORE UPDATE ON bom FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bom_components_updated_at BEFORE UPDATE ON bom_components FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bom_operations_updated_at BEFORE UPDATE ON bom_operations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manufacturing_orders_updated_at BEFORE UPDATE ON manufacturing_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_orders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_work_order_time_logs_updated_at BEFORE UPDATE ON work_order_time_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stock_locations_updated_at BEFORE UPDATE ON stock_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_material_reservations_updated_at BEFORE UPDATE ON material_reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_quality_control_updated_at BEFORE UPDATE ON quality_control FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate sequential numbers
CREATE OR REPLACE FUNCTION generate_mo_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(mo_number FROM 3) AS INTEGER)), 0) + 1
    INTO next_number
    FROM manufacturing_orders
    WHERE mo_number ~ '^MO[0-9]+$';

    formatted_number := 'MO' || LPAD(next_number::TEXT, 6, '0');
    RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_wo_number()
RETURNS TEXT AS $$
DECLARE
    next_number INTEGER;
    formatted_number TEXT;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(wo_number FROM 3) AS INTEGER)), 0) + 1
    INTO next_number
    FROM work_orders
    WHERE wo_number ~ '^WO[0-9]+$';

    formatted_number := 'WO' || LPAD(next_number::TEXT, 6, '0');
    RETURN formatted_number;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    old_data JSONB;
    new_data JSONB;
    changed_fields TEXT[] := ARRAY[]::TEXT[];
    field_name TEXT;
BEGIN
    -- Convert OLD and NEW to JSONB
    IF TG_OP = 'DELETE' THEN
        old_data := to_jsonb(OLD);
        new_data := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        old_data := NULL;
        new_data := to_jsonb(NEW);
    ELSE -- UPDATE
        old_data := to_jsonb(OLD);
        new_data := to_jsonb(NEW);

        -- Find changed fields
        FOR field_name IN SELECT jsonb_object_keys(new_data)
        LOOP
            IF old_data->>field_name IS DISTINCT FROM new_data->>field_name THEN
                changed_fields := array_append(changed_fields, field_name);
            END IF;
        END LOOP;
    END IF;

    -- Insert audit record
    INSERT INTO audit_logs (
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_fields,
        user_id,
        created_at
    ) VALUES (
        TG_TABLE_NAME,
        COALESCE((new_data->>'id')::UUID, (old_data->>'id')::UUID),
        TG_OP,
        old_data,
        new_data,
        changed_fields,
        COALESCE(
            (new_data->>'updated_by')::UUID,
            (new_data->>'created_by')::UUID,
            (old_data->>'updated_by')::UUID,
            (old_data->>'created_by')::UUID
        ),
        CURRENT_TIMESTAMP
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_manufacturing_orders AFTER INSERT OR UPDATE OR DELETE ON manufacturing_orders FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_work_orders AFTER INSERT OR UPDATE OR DELETE ON work_orders FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_stock_ledger AFTER INSERT OR UPDATE OR DELETE ON stock_ledger FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Insert default data
INSERT INTO roles (name, description, permissions) VALUES
('admin', 'System Administrator', '{"all": true}'),
('manufacturing_manager', 'Manufacturing Manager', '{"manufacturing": {"read": true, "write": true}, "inventory": {"read": true, "write": true}, "reports": {"read": true}}'),
('operator', 'Production Operator', '{"work_orders": {"read": true, "write": true}, "time_tracking": {"read": true, "write": true}}'),
('quality_inspector', 'Quality Control Inspector', '{"quality_control": {"read": true, "write": true}, "work_orders": {"read": true}}'),
('inventory_clerk', 'Inventory Clerk', '{"inventory": {"read": true, "write": true}, "stock_ledger": {"read": true}}');

INSERT INTO units_of_measure (name, symbol, type) VALUES
('Pieces', 'pcs', 'count'),
('Kilograms', 'kg', 'weight'),
('Grams', 'g', 'weight'),
('Liters', 'L', 'volume'),
('Milliliters', 'mL', 'volume'),
('Meters', 'm', 'length'),
('Centimeters', 'cm', 'length'),
('Hours', 'hr', 'time'),
('Minutes', 'min', 'time');

INSERT INTO warehouses (code, name, description, location) VALUES
('WH001', 'Main Warehouse', 'Primary storage facility', 'Building A'),
('WH002', 'Raw Materials', 'Raw materials storage', 'Building B'),
('WH003', 'Finished Goods', 'Finished products storage', 'Building C');

INSERT INTO work_centers (code, name, description, capacity_per_hour, cost_per_hour) VALUES
('WC001', 'Assembly Line 1', 'Main assembly line', 10.00, 50.00),
('WC002', 'Machining Center', 'CNC machining operations', 5.00, 75.00),
('WC003', 'Quality Control', 'Quality inspection station', 20.00, 40.00),
('WC004', 'Packaging', 'Final packaging operations', 15.00, 30.00);

-- Create default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name, role_id, email_verified, status)
SELECT 'admin', 'admin@manufacturing-erp.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VcSAg/9qm', 'System', 'Administrator', r.id, true, 'active'
FROM roles r WHERE r.name = 'admin';

COMMIT;
