const bcrypt = require('bcrypt');
const { Sequelize } = require('sequelize');

async function updateAdminPassword() {
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

    // Hash the new password
    const newPassword = 'password123';
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    console.log('New password hashed:', hashedPassword);

    // Update the admin user's password
    const [results] = await sequelize.query(
      "UPDATE users SET password_hash = :hashedPassword WHERE username = 'admin' RETURNING id, username, email",
      {
        replacements: { hashedPassword },
        type: sequelize.QueryTypes.UPDATE
      }
    );

    console.log('Password updated successfully for user:', results);

    // Verify the update
    const [verifyResults] = await sequelize.query(
      "SELECT username, email, password_hash FROM users WHERE username = 'admin'"
    );
    
    console.log('Updated user data:', verifyResults[0]);

    // Test the new password
    const isValid = await bcrypt.compare(newPassword, verifyResults[0].password_hash);
    console.log('New password verification:', isValid);

    await sequelize.close();
    console.log('Database connection closed');

  } catch (error) {
    console.error('Error updating password:', error);
  }
}

updateAdminPassword();