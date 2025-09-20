'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get BOM and product IDs
    const boms = await queryInterface.sequelize.query(
      'SELECT id, product_id FROM boms LIMIT 3',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const products = await queryInterface.sequelize.query(
      'SELECT id, sku FROM products WHERE type = $type LIMIT 10',
      { 
        bind: { type: 'raw_material' },
        type: Sequelize.QueryTypes.SELECT 
      }
    );

    if (boms.length === 0 || products.length === 0) {
      console.log('No BOMs or raw materials found. Skipping BOM components seeder.');
      return;
    }

    const bomComponents = [];

    // Create components for each BOM
    boms.forEach((bom, bomIndex) => {
      // Each BOM will have 2-4 components
      const componentCount = 2 + bomIndex;
      
      for (let i = 0; i < componentCount && i < products.length; i++) {
        bomComponents.push({
          id: uuidv4(),
          bom_id: bom.id,
          component_id: products[i].id,
          quantity: Math.round((Math.random() * 5 + 1) * 10) / 10, // 1.0 to 6.0
          unit: 'kg',
          scrap_factor: Math.round(Math.random() * 5 * 100) / 10000, // 0.0000 to 0.0050
          sequence_number: i + 1,
          notes: `Component ${products[i].sku} for manufacturing`,
          created_at: new Date(),
          updated_at: new Date()
        });
      }
    });

    await queryInterface.bulkInsert('bom_components', bomComponents);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('bom_components', null, {});
  }
};