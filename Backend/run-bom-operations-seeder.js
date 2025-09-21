require('dotenv').config();
const { Sequelize } = require('sequelize');
const seeder = require('./src/seeders/20240101000016-seed-bom-operations.js');

// Database configuration
const sequelize = new Sequelize(
  process.env.DB_NAME || 'ERPDB',
  process.env.DB_USERNAME || 'postgres',
  process.env.DB_PASSWORD || 'Thalha*7258',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: console.log
  }
);

async function runSeeder() {
  try {
    console.log('Running BOM Operations seeder...');
    
    // Create a mock queryInterface
    const queryInterface = sequelize.getQueryInterface();
    
    await seeder.up(queryInterface, Sequelize);
    
    console.log('BOM Operations seeder completed successfully!');
  } catch (error) {
    console.error('Error running seeder:', error);
  } finally {
    await sequelize.close();
  }
}

runSeeder();
