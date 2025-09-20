'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface, Sequelize) {
    const units = [
      // Quantity units
      {
        id: uuidv4(),
        name: 'Pieces',
        symbol: 'pcs',
        type: 'quantity',
        conversion_factor: 1,
        base_unit_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Dozen',
        symbol: 'doz',
        type: 'quantity',
        conversion_factor: 12,
        base_unit_id: null, // Will be updated to reference pieces
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Weight units
      {
        id: uuidv4(),
        name: 'Kilogram',
        symbol: 'kg',
        type: 'weight',
        conversion_factor: 1,
        base_unit_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Gram',
        symbol: 'g',
        type: 'weight',
        conversion_factor: 0.001,
        base_unit_id: null, // Will be updated to reference kg
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Pound',
        symbol: 'lb',
        type: 'weight',
        conversion_factor: 0.453592,
        base_unit_id: null, // Will be updated to reference kg
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Length units
      {
        id: uuidv4(),
        name: 'Meter',
        symbol: 'm',
        type: 'length',
        conversion_factor: 1,
        base_unit_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Centimeter',
        symbol: 'cm',
        type: 'length',
        conversion_factor: 0.01,
        base_unit_id: null, // Will be updated to reference meter
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Millimeter',
        symbol: 'mm',
        type: 'length',
        conversion_factor: 0.001,
        base_unit_id: null, // Will be updated to reference meter
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Volume units
      {
        id: uuidv4(),
        name: 'Liter',
        symbol: 'L',
        type: 'volume',
        conversion_factor: 1,
        base_unit_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Milliliter',
        symbol: 'mL',
        type: 'volume',
        conversion_factor: 0.001,
        base_unit_id: null, // Will be updated to reference liter
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Area units
      {
        id: uuidv4(),
        name: 'Square Meter',
        symbol: 'm²',
        type: 'area',
        conversion_factor: 1,
        base_unit_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      
      // Time units
      {
        id: uuidv4(),
        name: 'Hour',
        symbol: 'hr',
        type: 'time',
        conversion_factor: 1,
        base_unit_id: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        name: 'Minute',
        symbol: 'min',
        type: 'time',
        conversion_factor: 0.0166667,
        base_unit_id: null, // Will be updated to reference hour
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('units_of_measure', units, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('units_of_measure', null, {});
  }
};
