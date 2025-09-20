const { Sequelize } = require('sequelize');

async function fixEmailVerification() {
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

    // Check current email verification status
    const [currentData] = await sequelize.query(
      "SELECT username, email, email_verified FROM users WHERE username = 'admin'"
    );
    console.log('Current admin user data:', currentData[0]);

    // Update email verification to true
    const [results] = await sequelize.query(
      "UPDATE users SET email_verified = true WHERE username = 'admin' RETURNING username, email, email_verified",
      {
        type: sequelize.QueryTypes.UPDATE
      }
    );

    console.log('Email verification updated for user:', results);

    // Verify the update
    const [verifyResults] = await sequelize.query(
      "SELECT username, email, email_verified FROM users WHERE username = 'admin'"
    );
    
    console.log('Updated user data:', verifyResults[0]);

    await sequelize.close();
    console.log('Database connection closed');

  } catch (error) {
    console.error('Error updating email verification:', error);
  }
}

fixEmailVerification();