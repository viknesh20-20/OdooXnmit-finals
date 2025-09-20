'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get products, users, and BOMs for manufacturing orders
    const products = await queryInterface.sequelize.query(
      'SELECT id, sku FROM products WHERE type = $type LIMIT 5',
      { 
        bind: { type: 'finished_good' },
        type: Sequelize.QueryTypes.SELECT 
      }
    );

    const users = await queryInterface.sequelize.query(
      'SELECT id FROM users LIMIT 3',
      { type: Sequelize.QueryTypes.SELECT }
    );

    const boms = await queryInterface.sequelize.query(
      'SELECT id, product_id FROM boms LIMIT 3',
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (products.length === 0 || users.length === 0 || boms.length === 0) {
      console.log('No finished good products, users, or BOMs found. Skipping manufacturing orders seeder.');
      return;
    }

    const statuses = ['draft', 'confirmed', 'in_progress', 'completed', 'cancelled'];
    const priorities = ['normal', 'high', 'urgent'];

    const manufacturingOrders = [];

    for (let i = 0; i < 6; i++) {
      const product = products[i % products.length];
      const user = users[i % users.length];
      const bom = boms[i % boms.length];
      const status = statuses[i % statuses.length];
      const priority = priorities[i % priorities.length];
      
      // Generate dates
      const now = new Date();
      const plannedStart = new Date(now.getTime() + (i - 3) * 24 * 60 * 60 * 1000); // Some past, some future
      const plannedEnd = new Date(plannedStart.getTime() + (2 + Math.random() * 5) * 24 * 60 * 60 * 1000);
      
      manufacturingOrders.push({
        id: uuidv4(),
        mo_number: `MO-${String(2024).slice(-2)}${String(i + 1).padStart(4, '0')}`,
        product_id: product.id,
        bom_id: bom.id,
        quantity: Math.round((Math.random() * 100 + 10) * 10) / 10, // 10-110 with decimals
        quantity_unit: 'piece',
        status: status,
        priority: priority,
        planned_start_date: plannedStart,
        planned_end_date: plannedEnd,
        actual_start_date: status === 'in_progress' || status === 'completed' ? plannedStart : null,
        actual_end_date: status === 'completed' ? plannedEnd : null,
        created_by: user.id,
        assigned_to: Math.random() > 0.5 ? user.id : null,
        notes: `Manufacturing order for ${product.sku} - ${status} status`,
        metadata: JSON.stringify({}),
        created_at: new Date(),
        updated_at: new Date()
      });
    }

    await queryInterface.bulkInsert('manufacturing_orders', manufacturingOrders);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('manufacturing_orders', null, {});
  }
};