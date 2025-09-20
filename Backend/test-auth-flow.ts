import { Sequelize } from 'sequelize';
import { Email, Username } from './src/domain/value-objects/Email';

// Test the actual authentication flow
async function testAuthFlow() {
  console.log('Testing Email.create()...');
  try {
    const email = Email.create('admin@manufacturing.com');
    console.log('Email created successfully:', email.value);
  } catch (error) {
    console.error('Email creation failed:', (error as Error).message);
    return;
  }

  console.log('Testing Username.create()...');
  try {
    const username = Username.create('admin');
    console.log('Username created successfully:', username.value);
  } catch (error) {
    console.error('Username creation failed:', (error as Error).message);
    return;
  }

  console.log('All validations passed!');
}

testAuthFlow().catch(console.error);