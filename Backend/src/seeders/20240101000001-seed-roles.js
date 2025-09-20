'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const roles = [
      {
        id: uuidv4(),
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        permissions: JSON.stringify({
          users: ['create', 'read', 'update', 'delete'],
          products: ['create', 'read', 'update', 'delete'],
          manufacturing: ['create', 'read', 'update', 'delete'],
          boms: ['create', 'read', 'update', 'delete'],
          reports: ['create', 'read', 'update', 'delete'],
          system: ['configure', 'backup', 'restore']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Production Manager',
        description: 'Manages manufacturing operations and production planning',
        permissions: JSON.stringify({
          products: ['read', 'update'],
          manufacturing: ['create', 'read', 'update', 'delete'],
          boms: ['create', 'read', 'update'],
          reports: ['read']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Production Operator',
        description: 'Executes manufacturing orders and updates production status',
        permissions: JSON.stringify({
          products: ['read'],
          manufacturing: ['read', 'update'],
          boms: ['read'],
          reports: ['read']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Inventory Manager',
        description: 'Manages product catalog, inventory, and stock levels',
        permissions: JSON.stringify({
          products: ['create', 'read', 'update', 'delete'],
          manufacturing: ['read'],
          boms: ['read'],
          reports: ['read']
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Quality Control',
        description: 'Reviews and approves BOMs and manufacturing processes',
        permissions: JSON.stringify({
          products: ['read'],
          manufacturing: ['read', 'update'],
          boms: ['read', 'approve'],
          reports: ['read']
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('roles', roles, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('roles', null, {});
  }
};
