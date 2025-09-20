const { Sequelize } = require('sequelize');

async function checkAdminFields() {
  try {
    // Database configuration
    const sequelize = new Sequelize('ERPDB', 'pearl', '1968', {
      host: 'localhost',
      port: 5432,
      dialect: 'postgresql',
      logging: console.log,
    });

    // Test database connection
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Check admin user fields
    const [results] = await sequelize.query(
      "SELECT * FROM users WHERE username = 'admin'"
    );
    
    if (results.length > 0) {
      console.log('Admin user fields:', Object.keys(results[0]));
      console.log('Admin user data:');
      console.log('- id:', results[0].id);
      console.log('- username:', results[0].username);
      console.log('- email:', results[0].email);
      console.log('- password_hash:', results[0].password_hash);
      console.log('- first_name:', results[0].first_name);
      console.log('- last_name:', results[0].last_name);
      console.log('- email_verified:', results[0].email_verified);
      console.log('- status:', results[0].status);
      console.log('- failed_login_attempts:', results[0].failed_login_attempts);
    } else {
      console.log('No admin user found');
    }

    await sequelize.close();
    console.log('Database connection closed');

  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdminFields();