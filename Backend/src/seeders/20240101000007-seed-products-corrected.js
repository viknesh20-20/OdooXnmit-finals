'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Get UOM IDs
    const uoms = await queryInterface.sequelize.query(
      'SELECT id, symbol FROM units_of_measure',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const uomMap = {};
    uoms.forEach(uom => {
      uomMap[uom.symbol] = uom.id;
    });

    // Get category IDs
    const categories = await queryInterface.sequelize.query(
      'SELECT id, name FROM product_categories',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const categoryMap = {};
    categories.forEach(category => {
      categoryMap[category.name] = category.id;
    });

    const products = [
      // Raw Materials
      {
        id: uuidv4(),
        sku: 'STEEL-001',
        name: 'Steel Sheet - Grade A',
        description: 'High-quality steel sheet for manufacturing',
        category_id: categoryMap['Raw Materials'],
        uom_id: uomMap['kg'],
        type: 'raw_material',
        cost_price: 5.50,
        selling_price: 7.50,
        min_stock_level: 100,
        max_stock_level: 2000,
        reorder_point: 200,
        lead_time_days: 7,
        is_active: true,
        specifications: JSON.stringify({
          thickness: '2mm',
          width: '1200mm',
          length: '2400mm',
          supplier: 'SteelCorp Ltd',
          grade: 'A-Grade'
        }),
        attachments: [],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'ALU-001',
        name: 'Aluminum Rod - 6061',
        description: 'Aluminum rod for precision components',
        category_id: categoryMap['Raw Materials'],
        uom_id: uomMap['m'],
        type: 'raw_material',
        cost_price: 12.00,
        selling_price: 16.00,
        min_stock_level: 50,
        max_stock_level: 1000,
        reorder_point: 100,
        lead_time_days: 5,
        is_active: true,
        specifications: JSON.stringify({
          diameter: '25mm',
          grade: '6061-T6',
          supplier: 'AlumTech Inc',
          certification: 'ISO 9001'
        }),
        attachments: [],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'BOLT-M8',
        name: 'Hex Bolt M8x20',
        description: 'Stainless steel hex bolt',
        category_id: categoryMap['Raw Materials'],
        uom_id: uomMap['pcs'],
        type: 'raw_material',
        cost_price: 0.25,
        selling_price: 0.40,
        min_stock_level: 500,
        max_stock_level: 10000,
        reorder_point: 1000,
        lead_time_days: 3,
        is_active: true,
        specifications: JSON.stringify({
          size: 'M8x20',
          material: 'Stainless Steel 316',
          supplier: 'FastenerPro',
          standard: 'DIN 933'
        }),
        attachments: [],
        created_at: new Date(),
        updated_at: new Date()
      },
      // Components
      {
        id: uuidv4(),
        sku: 'MOTOR-001',
        name: 'Electric Motor 1HP',
        description: '1 Horsepower electric motor',
        category_id: categoryMap['Components'],
        uom_id: uomMap['pcs'],
        type: 'component',
        cost_price: 150.00,
        selling_price: 200.00,
        min_stock_level: 10,
        max_stock_level: 100,
        reorder_point: 20,
        lead_time_days: 14,
        is_active: true,
        specifications: JSON.stringify({
          power: '1HP',
          voltage: '220V',
          rpm: '1450',
          supplier: 'MotorTech Ltd',
          warranty: '2 years'
        }),
        attachments: [],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'BEARING-001',
        name: 'Ball Bearing 6204',
        description: 'Deep groove ball bearing',
        category_id: categoryMap['Components'],
        uom_id: uomMap['pcs'],
        type: 'component',
        cost_price: 8.50,
        selling_price: 12.00,
        min_stock_level: 20,
        max_stock_level: 500,
        reorder_point: 50,
        lead_time_days: 10,
        is_active: true,
        specifications: JSON.stringify({
          bore: '20mm',
          outer_diameter: '47mm',
          width: '14mm',
          supplier: 'BearingMax',
          standard: 'ISO 15'
        }),
        attachments: [],
        created_at: new Date(),
        updated_at: new Date()
      },
      // Finished Goods
      {
        id: uuidv4(),
        sku: 'PUMP-001',
        name: 'Centrifugal Water Pump',
        description: 'Industrial centrifugal water pump',
        category_id: categoryMap['Finished Goods'],
        uom_id: uomMap['pcs'],
        type: 'finished_good',
        cost_price: 450.00,
        selling_price: 650.00,
        min_stock_level: 5,
        max_stock_level: 50,
        reorder_point: 10,
        lead_time_days: 21,
        is_active: true,
        specifications: JSON.stringify({
          flow_rate: '100 L/min',
          head: '30m',
          power: '1HP',
          certifications: ['CE', 'ISO 9001'],
          warranty: '3 years'
        }),
        attachments: [],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'VALVE-001',
        name: 'Gate Valve 2 inch',
        description: 'Industrial gate valve',
        category_id: categoryMap['Finished Goods'],
        uom_id: uomMap['pcs'],
        type: 'finished_good',
        cost_price: 85.00,
        selling_price: 120.00,
        min_stock_level: 15,
        max_stock_level: 150,
        reorder_point: 30,
        lead_time_days: 14,
        is_active: true,
        specifications: JSON.stringify({
          size: '2 inch',
          pressure: '10 bar',
          material: 'Cast Iron',
          standard: 'ANSI B16.34',
          warranty: '2 years'
        }),
        attachments: [],
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: uuidv4(),
        sku: 'GEAR-001',
        name: 'Precision Gear Assembly',
        description: 'High precision gear assembly',
        category_id: categoryMap['Components'],
        uom_id: uomMap['pcs'],
        type: 'component',
        cost_price: 75.00,
        selling_price: 110.00,
        min_stock_level: 8,
        max_stock_level: 80,
        reorder_point: 15,
        lead_time_days: 18,
        is_active: true,
        specifications: JSON.stringify({
          teeth: '24T',
          module: '2.5',
          material: 'Hardened Steel',
          tolerance: '±0.02mm',
          heat_treatment: 'Carburized'
        }),
        attachments: [],
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('products', products);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('products', null, {});
  }
};