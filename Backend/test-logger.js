const { WinstonLogger } = require('./dist/infrastructure/logging/WinstonLogger');

try {
  console.log('Testing WinstonLogger instantiation...');
  const logger = new WinstonLogger();
  console.log('WinstonLogger created successfully');
  logger.info('Test log message');
  console.log('Test completed successfully');
} catch (error) {
  console.error('Error creating WinstonLogger:', error);
}
