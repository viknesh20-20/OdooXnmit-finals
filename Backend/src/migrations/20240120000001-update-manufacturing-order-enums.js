'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Update status enum
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_manufacturing_orders_status 
      ADD VALUE IF NOT EXISTS 'planned';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_manufacturing_orders_status 
      ADD VALUE IF NOT EXISTS 'released';
    `);
    
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_manufacturing_orders_status 
      ADD VALUE IF NOT EXISTS 'paused';
    `);

    // Update priority enum
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_manufacturing_orders_priority 
      ADD VALUE IF NOT EXISTS 'medium';
    `);

    // Update default values
    await queryInterface.changeColumn('manufacturing_orders', 'priority', {
      type: Sequelize.ENUM('low', 'medium', 'high', 'urgent'),
      allowNull: false,
      defaultValue: 'medium',
    });
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values easily
    // This would require recreating the enum type
    console.log('Rollback not implemented - enum values cannot be easily removed in PostgreSQL');
  }
};
