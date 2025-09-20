import 'tsconfig-paths/register';
import dotenv from 'dotenv';
import { DIContainer } from '@infrastructure/di/Container';
import { createApp } from './app';

// Load environment variables
dotenv.config({ override: true });

// Debug environment variables
console.log('Environment variables loaded:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_USERNAME:', process.env.DB_USERNAME);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : 'undefined');

// Reset DI container to pick up new environment variables
console.log('Resetting DI container with updated environment variables...');
DIContainer.reset();

// Ensure correct database configuration
if (!process.env.DB_NAME) {
  process.env.DB_NAME = 'ERPDB';
}
if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === 'password') {
  process.env.DB_PASSWORD = 'Thalha*7258';
}

// Validate required environment variables
const requiredEnvVars = [
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars);
  console.error('Please check your .env file and ensure all required variables are set.');
  process.exit(1);
}

// Start the application
async function startServer(): Promise<void> {
  try {
    const app = createApp();
    const port = parseInt(process.env.PORT || '3000', 10);
    
    await app.start(port);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();
