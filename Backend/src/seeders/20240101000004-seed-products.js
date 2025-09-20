'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Get UOM and category IDs
    const [uoms] = await queryInterface.sequelize.query(
      "SELECT id, symbol FROM units_of_measure WHERE symbol IN ('pcs', 'kg', 'L', 'bottles', 'm')"
    );
    
    const [categories] = await queryInterface.sequelize.query(
      "SELECT id, name FROM product_categories WHERE name IN ('Raw Materials', 'Components', 'Finished Goods')"
    );

    const pcsUom = uoms.find(u => u.symbol === 'pcs');
    const kgUom = uoms.find(u => u.symbol === 'kg');
    const literUom = uoms.find(u => u.symbol === 'L');
    const bottleUom = uoms.find(u => u.symbol === 'bottles');
    const meterUom = uoms.find(u => u.symbol === 'm');

    const rawMaterialCategory = categories.find(c => c.name === 'Raw Materials');
    const componentCategory = categories.find(c => c.name === 'Components');
    const finishedGoodCategory = categories.find(c => c.name === 'Finished Goods');

    const products = [
      // Raw Materials
      {
        id: uuidv4(),
        sku: 'RM-001',
        name: 'Oak Wood Planks',
        description: 'Premium oak wood planks for furniture manufacturing',
        category_id: rawMaterialCategory?.id,
        uom_id: pcsUom?.id,
        type: 'raw_material',
        cost_price: 25.00,
        selling_price: 0.00,
        min_stock_level: 100.0000,
        max_stock_level: 500.0000,
        reorder_point: 150.0000,
        lead_time_days: 14,
        is_active: true,
        specifications: JSON.stringify({ grade: 'A', thickness: '25mm', width: '200mm', length: '2000mm' }),
        attachments: queryInterface.sequelize.literal('ARRAY[]::varchar[]'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'RM-002',
        name: 'Steel Screws',
        description: 'Stainless steel screws for assembly',
        category_id: rawMaterialCategory?.id,
        uom_id: pcsUom?.id,
        type: 'raw_material',
        cost_price: 0.15,
        selling_price: 0.00,
        min_stock_level: 5000.0000,
        max_stock_level: 20000.0000,
        reorder_point: 7500.0000,
        lead_time_days: 7,
        is_active: true,
        specifications: JSON.stringify({ size: 'M6x40', material: 'stainless_steel', head_type: 'phillips' }),
        attachments: queryInterface.sequelize.literal('ARRAY[]::varchar[]'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'RM-003',
        name: 'Wood Varnish',
        description: 'High-quality wood varnish for finishing',
        category_id: rawMaterialCategory?.id,
        uom_id: literUom?.id,
        type: 'raw_material',
        cost_price: 35.00,
        selling_price: 0.00,
        min_stock_level: 50.0000,
        max_stock_level: 200.0000,
        reorder_point: 75.0000,
        lead_time_days: 10,
        is_active: true,
        specifications: JSON.stringify({ type: 'polyurethane', finish: 'satin', coverage: '12_sqm_per_liter' }),
        attachments: queryInterface.sequelize.literal('ARRAY[]::varchar[]'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'RM-004',
        name: 'Metal Hinges',
        description: 'Heavy-duty metal hinges for cabinet doors',
        category_id: rawMaterialCategory?.id,
        uom_id: pcsUom?.id,
        type: 'raw_material',
        cost_price: 8.50,
        selling_price: 0.00,
        min_stock_level: 200.0000,
        max_stock_level: 1000.0000,
        reorder_point: 300.0000,
        lead_time_days: 12,
        is_active: true,
        specifications: JSON.stringify({ material: 'steel', finish: 'chrome_plated', load_capacity: '50kg' }),
        attachments: queryInterface.sequelize.literal('ARRAY[]::varchar[]'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'RM-005',
        name: 'Foam Padding',
        description: 'High-density foam for chair cushions',
        category_id: rawMaterialCategory?.id,
        uom_id: meterUom?.id,
        type: 'raw_material',
        cost_price: 45.00,
        selling_price: 0.00,
        min_stock_level: 20.0000,
        max_stock_level: 100.0000,
        reorder_point: 30.0000,
        lead_time_days: 15,
        is_active: true,
        specifications: JSON.stringify({ density: '35kg_per_cubic_meter', thickness: '50mm', width: '1200mm' }),
        attachments: queryInterface.sequelize.literal('ARRAY[]::varchar[]'),
        created_at: new Date(),
        updated_at: new Date()
      },

      // Components
      {
        id: uuidv4(),
        sku: 'COMP-001',
        name: 'Table Legs (Set of 4)',
        description: 'Pre-manufactured oak table legs',
        category_id: componentCategory?.id,
        uom_id: pcsUom?.id,
        type: 'work_in_progress',
        cost_price: 60.00,
        selling_price: 0.00,
        min_stock_level: 50.0000,
        max_stock_level: 200.0000,
        reorder_point: 75.0000,
        lead_time_days: 5,
        is_active: true,
        specifications: JSON.stringify({ height: '720mm', material: 'oak', finish: 'sanded' }),
        attachments: queryInterface.sequelize.literal('ARRAY[]::varchar[]'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'COMP-002',
        name: 'Chair Backrest',
        description: 'Ergonomic chair backrest with lumbar support',
        category_id: componentCategory?.id,
        uom_id: pcsUom?.id,
        type: 'work_in_progress',
        cost_price: 35.00,
        selling_price: 0.00,
        min_stock_level: 30.0000,
        max_stock_level: 150.0000,
        reorder_point: 50.0000,
        lead_time_days: 7,
        is_active: true,
        specifications: JSON.stringify({ material: 'oak', ergonomic: true, lumbar_support: true }),
        attachments: queryInterface.sequelize.literal('ARRAY[]::varchar[]'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'COMP-003',
        name: 'Drawer Assembly',
        description: 'Complete drawer assembly with slides',
        category_id: componentCategory?.id,
        uom_id: pcsUom?.id,
        type: 'work_in_progress',
        cost_price: 85.00,
        selling_price: 0.00,
        min_stock_level: 20.0000,
        max_stock_level: 100.0000,
        reorder_point: 35.0000,
        lead_time_days: 8,
        is_active: true,
        specifications: JSON.stringify({ width: '400mm', depth: '450mm', height: '120mm', slides: 'soft_close' }),
        attachments: queryInterface.sequelize.literal('ARRAY[]::varchar[]'),
        created_at: new Date(),
        updated_at: new Date()
      },

      // Finished Goods
      {
        id: uuidv4(),
        sku: 'FG-001',
        name: 'Executive Oak Desk',
        description: 'Premium executive desk made from solid oak',
        category_id: finishedGoodCategory?.id,
        uom_id: pcsUom?.id,
        type: 'finished_good',
        cost_price: 450.00,
        selling_price: 899.00,
        min_stock_level: 5.0000,
        max_stock_level: 25.0000,
        reorder_point: 10.0000,
        lead_time_days: 21,
        is_active: true,
        specifications: JSON.stringify({ 
          dimensions: '1600x800x720mm', 
          material: 'solid_oak', 
          finish: 'satin_varnish',
          drawers: 3,
          weight: '65kg'
        }),
        attachments: queryInterface.sequelize.literal('ARRAY[]::varchar[]'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'FG-002',
        name: 'Ergonomic Office Chair',
        description: 'Comfortable office chair with lumbar support',
        category_id: finishedGoodCategory?.id,
        uom_id: pcsUom?.id,
        type: 'finished_good',
        cost_price: 180.00,
        selling_price: 349.00,
        min_stock_level: 10.0000,
        max_stock_level: 50.0000,
        reorder_point: 20.0000,
        lead_time_days: 14,
        is_active: true,
        specifications: JSON.stringify({ 
          material: 'oak_frame', 
          upholstery: 'fabric',
          adjustable_height: true,
          lumbar_support: true,
          weight_capacity: '120kg'
        }),
        attachments: queryInterface.sequelize.literal('ARRAY[]::varchar[]'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'FG-003',
        name: 'Conference Table',
        description: 'Large conference table for meeting rooms',
        category_id: finishedGoodCategory?.id,
        uom_id: pcsUom?.id,
        type: 'finished_good',
        cost_price: 650.00,
        selling_price: 1299.00,
        min_stock_level: 2.0000,
        max_stock_level: 10.0000,
        reorder_point: 5.0000,
        lead_time_days: 28,
        is_active: true,
        specifications: JSON.stringify({ 
          dimensions: '2400x1200x720mm', 
          material: 'solid_oak', 
          finish: 'satin_varnish',
          seating_capacity: 8,
          weight: '95kg'
        }),
        attachments: queryInterface.sequelize.literal('ARRAY[]::varchar[]'),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'FG-004',
        name: 'Storage Cabinet',
        description: 'Multi-purpose storage cabinet with adjustable shelves',
        category_id: finishedGoodCategory?.id,
        uom_id: pcsUom?.id,
        type: 'finished_good',
        cost_price: 280.00,
        selling_price: 549.00,
        min_stock_level: 8.0000,
        max_stock_level: 30.0000,
        reorder_point: 15.0000,
        lead_time_days: 18,
        is_active: true,
        specifications: JSON.stringify({ 
          dimensions: '800x400x1800mm', 
          material: 'oak_veneer', 
          finish: 'satin_varnish',
          shelves: 4,
          adjustable: true,
          doors: 2
        }),
        attachments: queryInterface.sequelize.literal('ARRAY[]::varchar[]'),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('products', products, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('products', null, {});
  }
};
