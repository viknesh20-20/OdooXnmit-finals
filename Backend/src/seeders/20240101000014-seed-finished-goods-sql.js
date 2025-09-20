'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get category and UOM IDs
    const categories = await queryInterface.sequelize.query(
      'SELECT id FROM product_categories LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const uoms = await queryInterface.sequelize.query(
      'SELECT id FROM units_of_measure LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (categories.length === 0 || uoms.length === 0) {
      console.log('No categories or UOMs found. Skipping finished goods seeder.');
      return;
    }

    const categoryId = categories[0].id;
    const uomId = uoms[0].id;

    await queryInterface.sequelize.query(`
      INSERT INTO products (
        id, sku, name, description, category_id, uom_id, type, 
        cost_price, selling_price, min_stock_level, max_stock_level, 
        reorder_point, lead_time_days, is_active, specifications, 
        attachments, created_at, updated_at
      ) VALUES 
      (
        '${uuidv4()}', 'FG-001', 'Premium Widget A',
        'High-quality precision widget for industrial applications',
        '${categoryId}', '${uomId}', 'finished_good',
        45.75, 89.50, 10, 100, 25, 7, true,
        '{"material":"Steel","finish":"Anodized","weight":"2.5kg","dimensions":"15x10x5cm"}',
        ARRAY[]::varchar[], NOW(), NOW()
      ),
      (
        '${uuidv4()}', 'FG-002', 'Deluxe Assembly B',
        'Complete assembly unit with integrated components',
        '${categoryId}', '${uomId}', 'finished_good',
        78.25, 145.00, 5, 50, 15, 10, true,
        '{"material":"Aluminum","finish":"Powder Coated","weight":"4.2kg","dimensions":"25x18x12cm"}',
        ARRAY[]::varchar[], NOW(), NOW()
      ),
      (
        '${uuidv4()}', 'FG-003', 'Professional Tool C',
        'Professional-grade tool for specialized manufacturing',
        '${categoryId}', '${uomId}', 'finished_good',
        120.50, 225.00, 8, 30, 12, 14, true,
        '{"material":"Titanium Alloy","finish":"Brushed","weight":"1.8kg","dimensions":"30x8x6cm"}',
        ARRAY[]::varchar[], NOW(), NOW()
      );
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      DELETE FROM products WHERE type = 'finished_good';
    `);
  }
};