import 'module-alias/register';
import dotenv from 'dotenv';
import { createApp } from './app';

// Load environment variables
dotenv.config({ override: true });

// Ensure correct database configuration
if (!process.env.DB_NAME) {
  process.env.DB_NAME = 'ERPDB';
}
if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD === 'password') {
  console.log('Overriding DB_PASSWORD');
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
