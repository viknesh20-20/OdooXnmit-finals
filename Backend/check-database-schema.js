const { Sequelize } = require('sequelize');

async function checkDatabaseSchema() {
  try {
    // Database configuration
    const sequelize = new Sequelize('ERPDB', 'postgres', 'Thalha*7258', {
      host: 'localhost',
      port: 5432,
      dialect: 'postgresql',
      logging: console.log,
    });

    // Test database connection
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Check all tables
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('\n=== Database Tables ===');
    tables.forEach(table => console.log('-', table.table_name));

    // Check users table structure
    console.log('\n=== Users Table Structure ===');
    const [userColumns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position;
    `);
    userColumns.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}) default: ${col.column_default}`);
    });

    // Check roles table
    console.log('\n=== Roles Table ===');
    const [roles] = await sequelize.query("SELECT * FROM roles ORDER BY name");
    console.log('Available roles:', roles);

    // Check users data
    console.log('\n=== Users Data ===');
    const [users] = await sequelize.query(`
      SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.status, 
             u.email_verified, u.failed_login_attempts, u.locked_until,
             r.name as role_name
      FROM users u 
      LEFT JOIN roles r ON u.role_id = r.id 
      ORDER BY u.username
    `);
    console.log('Current users:');
    users.forEach(user => {
      console.log(`- ${user.username} (${user.email}) - Status: ${user.status}, Role: ${user.role_name || 'No role'}, Email Verified: ${user.email_verified}`);
    });

    await sequelize.close();
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabaseSchema();