import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import 'reflect-metadata';

import { DIContainer, resolve, healthCheck } from '@infrastructure/di/Container';
import { DatabaseConnection } from '@infrastructure/database/config/DatabaseConfig';
import { ILogger } from '@application/interfaces/IPasswordService';
import { AuthController } from '@presentation/controllers/AuthController';
import { AuthMiddleware } from '@presentation/middleware/AuthMiddleware';
import { loginValidation } from '@presentation/controllers/AuthController';

export class App {
  private app: Application;
  private logger: ILogger;
  private databaseConnection: DatabaseConnection;

  constructor() {
    this.app = express();
    this.initializeContainer();
    this.logger = resolve<ILogger>('ILogger');
    this.databaseConnection = resolve<DatabaseConnection>('DatabaseConnection');
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeContainer(): void {
    try {
      DIContainer.getInstance();
      console.log('Dependency injection container initialized successfully');
    } catch (error) {
      console.error('Failed to initialize DI container:', error);
      process.exit(1);
    }
  }

  private initializeMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
      },
    }));

    // CORS configuration
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    }));

    // Rate limiting
    this.app.use(rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.',
        },
      },
      standardHeaders: true,
      legacyHeaders: false,
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    this.app.use(cookieParser());

    // Compression
    this.app.use(compression());

    // Request logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const duration = Date.now() - start;
        this.logger.info('HTTP Request', {
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          duration,
          userAgent: req.get('User-Agent'),
          ip: req.ip,
        });
      });

      next();
    });

    // Health check endpoint (before authentication)
    this.app.get('/health', this.healthCheckHandler.bind(this));
  }

  private initializeRoutes(): void {
    const authController = resolve<AuthController>('AuthController');
    const authMiddleware = resolve<AuthMiddleware>('AuthMiddleware');

    // API version prefix
    const apiV1 = express.Router();
    this.app.use('/api/v1', apiV1);

    // Auth routes
    const authRouter = express.Router();
    authRouter.post('/login', loginValidation, authController.login.bind(authController));
    authRouter.post('/refresh', authController.refreshToken.bind(authController));
    authRouter.post('/logout', authMiddleware.authenticate, authController.logout.bind(authController));
    authRouter.post('/logout-all', authMiddleware.authenticate, authController.logoutAll.bind(authController));

    apiV1.use('/auth', authRouter);

    // Protected routes example
    const protectedRouter = express.Router();
    protectedRouter.use(authMiddleware.authenticate);
    
    // Manufacturing routes would go here
    // protectedRouter.use('/manufacturing-orders', manufacturingOrderRoutes);
    // protectedRouter.use('/products', productRoutes);
    // protectedRouter.use('/boms', bomRoutes);

    apiV1.use('/protected', protectedRouter);

    // 404 handler for API routes
    this.app.use('/api', (_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'API endpoint not found',
        },
      });
    });

    // Root endpoint
    this.app.get('/', (_req: Request, res: Response) => {
      res.json({
        success: true,
        message: 'Manufacturing ERP API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
      });
    });
  }

  private initializeErrorHandling(): void {
    // Global error handler
    this.app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
      this.logger.error('Unhandled error', error, {
        method: req.method,
        url: req.url,
        body: req.body,
        params: req.params,
        query: req.query,
        headers: req.headers,
      });

      // Don't expose internal errors in production
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: isDevelopment ? error.message : 'An unexpected error occurred',
          ...(isDevelopment && { stack: error.stack }),
        },
      });
    });

    // 404 handler for non-API routes
    this.app.use((_req: Request, res: Response) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
        },
      });
    });
  }

  private async healthCheckHandler(_req: Request, res: Response): Promise<void> {
    try {
      const health = await healthCheck();
      
      const statusCode = health.healthy ? 200 : 503;
      
      res.status(statusCode).json({
        success: health.healthy,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        health: health.details,
      });
    } catch (error) {
      this.logger.error('Health check failed', error as Error);
      
      res.status(503).json({
        success: false,
        timestamp: new Date().toISOString(),
        error: {
          code: 'HEALTH_CHECK_FAILED',
          message: 'Health check failed',
        },
      });
    }
  }

  public async start(port: number = 3000): Promise<void> {
    try {
      // Initialize database connection
      await this.databaseConnection.connect();
      this.logger.info('Database connected successfully');

      // Start HTTP server
      this.app.listen(port, () => {
        this.logger.info(`Server started successfully`, {
          port,
          environment: process.env.NODE_ENV || 'development',
          pid: process.pid,
        });
      });

      // Graceful shutdown handlers
      this.setupGracefulShutdown();

    } catch (error) {
      this.logger.error('Failed to start application', error as Error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      this.logger.info(`Received ${signal}, starting graceful shutdown`);

      try {
        // Close database connection
        await this.databaseConnection.disconnect();
        this.logger.info('Database connection closed');

        // Clean up DI container
        DIContainer.destroy();
        this.logger.info('DI container cleaned up');

        this.logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        this.logger.error('Error during graceful shutdown', error as Error);
        process.exit(1);
      }
    };

    // Handle different termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      this.logger.error('Uncaught exception', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      this.logger.error('Unhandled promise rejection', new Error(String(reason)), {
        promise: promise.toString(),
      });
      gracefulShutdown('unhandledRejection');
    });
  }

  public getApp(): Application {
    return this.app;
  }
}

// Create and export app instance
export const createApp = (): App => {
  return new App();
};

// Start the application if this file is run directly
if (require.main === module) {
  const app = createApp();
  const port = parseInt(process.env.PORT || '3000', 10);
  
  app.start(port).catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
  });
}
