const { Sequelize } = require('sequelize');

// Database configuration
const sequelize = new Sequelize('ERPDB', 'postgres', 'Thalha*7258', {
  host: 'localhost',
  port: 5432,
  dialect: 'postgresql',
  logging: console.log,
});

async function testAuth() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connected successfully');

    // Query users directly
    const [results] = await sequelize.query("SELECT id, username, email, password_hash, phone, email_verified, status, failed_login_attempts, locked_until FROM users WHERE username = 'admin' OR email LIKE '%admin%'");
    console.log('Users found:', results);

    // Test with the actual values
    if (results.length > 0) {
      const user = results[0];
      console.log('Testing with user:', user);
      
      // Simulate Email.create() validation
      const emailValue = user.email;
      console.log('Email value:', emailValue);
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      console.log('Email regex test:', emailRegex.test(emailValue));
      
      // Simulate Username.create() validation
      const usernameValue = user.username;
      console.log('Username value:', usernameValue);
      const usernameRegex = /^[a-zA-Z0-9_]+$/;
      console.log('Username regex test:', usernameRegex.test(usernameValue));
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testAuth();