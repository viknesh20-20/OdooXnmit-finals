'use strict';

const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get role IDs
    const roles = await queryInterface.sequelize.query(
      'SELECT id, name FROM roles',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const roleMap = {};
    roles.forEach(role => {
      roleMap[role.name] = role.id;
    });

    const saltRounds = 12;
    const users = [
      {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@manufacturing.com',
        password_hash: await bcrypt.hash('admin123', saltRounds),
        first_name: 'System',
        last_name: 'Administrator',
        phone: '+1-555-0100',
        status: 'active',
        role_id: roleMap['Super Admin'],
        email_verified: true,
        metadata: JSON.stringify({ department: 'IT' }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        username: 'prod.manager',
        email: 'manager@manufacturing.com',
        password_hash: await bcrypt.hash('manager123', saltRounds),
        first_name: 'John',
        last_name: 'Smith',
        phone: '+1-555-0101',
        status: 'active',
        role_id: roleMap['Production Manager'],
        email_verified: true,
        metadata: JSON.stringify({ department: 'Production' }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        username: 'operator1',
        email: 'operator1@manufacturing.com',
        password_hash: await bcrypt.hash('operator123', saltRounds),
        first_name: 'Mike',
        last_name: 'Johnson',
        phone: '+1-555-0102',
        status: 'active',
        role_id: roleMap['Production Operator'],
        email_verified: true,
        metadata: JSON.stringify({ department: 'Production', shift: 'Morning' }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        username: 'operator2',
        email: 'operator2@manufacturing.com',
        password_hash: await bcrypt.hash('operator123', saltRounds),
        first_name: 'Sarah',
        last_name: 'Williams',
        phone: '+1-555-0103',
        status: 'active',
        role_id: roleMap['Production Operator'],
        email_verified: true,
        metadata: JSON.stringify({ department: 'Production', shift: 'Evening' }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        username: 'inventory.manager',
        email: 'inventory@manufacturing.com',
        password_hash: await bcrypt.hash('inventory123', saltRounds),
        first_name: 'Emily',
        last_name: 'Davis',
        phone: '+1-555-0104',
        status: 'active',
        role_id: roleMap['Inventory Manager'],
        email_verified: true,
        metadata: JSON.stringify({ department: 'Warehouse' }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        username: 'quality.control',
        email: 'quality@manufacturing.com',
        password_hash: await bcrypt.hash('quality123', saltRounds),
        first_name: 'Robert',
        last_name: 'Brown',
        phone: '+1-555-0105',
        status: 'active',
        role_id: roleMap['Quality Control'],
        email_verified: true,
        metadata: JSON.stringify({ department: 'Quality Assurance' }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('users', users);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', null, {});
  }
};