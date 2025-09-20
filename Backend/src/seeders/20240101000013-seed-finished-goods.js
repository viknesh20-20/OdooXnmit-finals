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

    const finishedGoods = [
      {
        id: uuidv4(),
        sku: 'FG-001',
        name: 'Premium Widget A',
        description: 'High-quality precision widget for industrial applications',
        category_id: categoryId,
        uom_id: uomId,
        type: 'finished_good',
        cost_price: 45.75,
        selling_price: 89.50,
        min_stock_level: 10,
        max_stock_level: 100,
        reorder_point: 25,
        lead_time_days: 7,
        is_active: true,
        specifications: JSON.stringify({
          material: 'Steel',
          finish: 'Anodized',
          weight: '2.5kg',
          dimensions: '15x10x5cm'
        }),
        attachments: [],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'FG-002',
        name: 'Deluxe Assembly B',
        description: 'Complete assembly unit with integrated components',
        category_id: categoryId,
        uom_id: uomId,
        type: 'finished_good',
        cost_price: 78.25,
        selling_price: 145.00,
        min_stock_level: 5,
        max_stock_level: 50,
        reorder_point: 15,
        lead_time_days: 10,
        is_active: true,
        specifications: JSON.stringify({
          material: 'Aluminum',
          finish: 'Powder Coated',
          weight: '4.2kg',
          dimensions: '25x18x12cm'
        }),
        attachments: [],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'FG-003',
        name: 'Professional Tool C',
        description: 'Professional-grade tool for specialized manufacturing',
        category_id: categoryId,
        uom_id: uomId,
        type: 'finished_good',
        cost_price: 120.50,
        selling_price: 225.00,
        min_stock_level: 8,
        max_stock_level: 30,
        reorder_point: 12,
        lead_time_days: 14,
        is_active: true,
        specifications: JSON.stringify({
          material: 'Titanium Alloy',
          finish: 'Brushed',
          weight: '1.8kg',
          dimensions: '30x8x6cm'
        }),
        attachments: [],
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('products', finishedGoods);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('products', 
      { type: 'finished_good' }, 
      {}
    );
  }
};