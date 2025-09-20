'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get product IDs from database to use in BOMs
    const products = await queryInterface.sequelize.query(
      'SELECT id, sku FROM products LIMIT 5',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (products.length === 0) {
      console.log('No products found. Skipping BOM seeder.');
      return;
    }

    // Get users for created_by
    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users LIMIT 1',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const userId = users[0].id;

    const boms = [
      {
        id: uuidv4(),
        product_id: products[0].id,
        version: '1.0',
        name: `BOM for ${products[0].sku}`,
        description: `Manufacturing BOM for ${products[0].sku}`,
        is_active: true,
        is_default: true,
        created_by: userId,
        approved_by: null,
        approved_at: null,
        metadata: JSON.stringify({}),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        product_id: products[1].id,
        version: '1.0',
        name: `BOM for ${products[1].sku}`,
        description: `Manufacturing BOM for ${products[1].sku}`,
        is_active: true,
        is_default: true,
        created_by: userId,
        approved_by: null,
        approved_at: null,
        metadata: JSON.stringify({}),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        product_id: products[2].id,
        version: '1.0',
        name: `BOM for ${products[2].sku}`,
        description: `Manufacturing BOM for ${products[2].sku}`,
        is_active: true,
        is_default: true,
        created_by: userId,
        approved_by: null,
        approved_at: null,
        metadata: JSON.stringify({}),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('boms', boms);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('boms', null, {});
  }
};