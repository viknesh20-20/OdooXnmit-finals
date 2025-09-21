import { Container } from 'inversify';
import 'reflect-metadata';
import dotenv from 'dotenv';

// Load environment variables first
dotenv.config({ override: true });

// Domain
import { ManufacturingOrderDomainService } from '@domain/services/ManufacturingOrderDomainService';

// Application
import { ILoginUseCase, LoginUseCase, RefreshTokenUseCase, LogoutUseCase } from '@application/use-cases/auth/LoginUseCase';
import { IRegisterUserUseCase, RegisterUserUseCase } from '@application/use-cases/auth/RegisterUserUseCase';
import { IForgotPasswordUseCase, ForgotPasswordUseCase } from '@application/use-cases/auth/ForgotPasswordUseCase';
import { IResetPasswordUseCase, ResetPasswordUseCase } from '@application/use-cases/auth/ResetPasswordUseCase';
import { IEmailService, EmailService } from '@infrastructure/services/EmailService';
import { ICreateManufacturingOrderUseCase, CreateManufacturingOrderUseCase, ConfirmManufacturingOrderUseCase } from '@application/use-cases/manufacturing/CreateManufacturingOrderUseCase';
import { UserMapper, ManufacturingOrderMapper } from '@application/mappers/UserMapper';

// Infrastructure
import { DatabaseConnection, TransactionManager } from '@infrastructure/database/config/DatabaseConfig';
import { UserRepository } from '@infrastructure/database/repositories/UserRepository';
import { ManufacturingOrderRepository } from '@infrastructure/database/repositories/ManufacturingOrderRepository';
import { ProductRepository } from '@infrastructure/database/repositories/ProductRepository';
import { BOMRepository } from '@infrastructure/database/repositories/BOMRepository';
import { RefreshTokenRepository } from '@infrastructure/database/repositories/RefreshTokenRepository';
// TODO: Add these when repository implementations are ready
// import { WorkCenterRepository } from '@infrastructure/database/repositories/WorkCenterRepository';
// import { WorkOrderRepository } from '@infrastructure/database/repositories/WorkOrderRepository';
// import { StockMovementRepository } from '@infrastructure/database/repositories/StockMovementRepository';
import { PasswordService } from '@infrastructure/security/PasswordService';
import { JWTService } from '@infrastructure/security/JWTService';
import { WinstonLogger, PerformanceLogger } from '@infrastructure/logging/WinstonLogger';

// Presentation
import { AuthController } from '@presentation/controllers/AuthController';
import { DashboardController } from '@presentation/controllers/DashboardController';
import { AuthMiddleware, RoleAuthorizationMiddleware, RateLimitMiddleware } from '@presentation/middleware/AuthMiddleware';

// Interfaces
import { IPasswordService, IJWTService, ILogger, ITransactionManager } from '@application/interfaces/IPasswordService';
import { IUserRepository, IManufacturingOrderRepository, IProductRepository, IBOMRepository, IRefreshTokenRepository, IWorkCenterRepository, IWorkOrderRepository, IStockMovementRepository } from '@domain/repositories/IUserRepository';
import { IEventPublisher } from '@application/interfaces/IEventPublisher';

// Configuration
import { DatabaseConfig, JWTConfig } from '@/types/common';

export class DIContainer {
  private static instance: Container;

  public static getInstance(): Container {
    if (!DIContainer.instance) {
      DIContainer.instance = DIContainer.createContainer();
    }
    return DIContainer.instance;
  }

  public static reset(): void {
    DIContainer.instance = DIContainer.createContainer();
  }

  private static createContainer(): Container {
    const container = new Container();

    // Configuration
    container.bind<DatabaseConfig>('DatabaseConfig').toConstantValue({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      database: process.env.DB_NAME || 'ERPDB',
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'Thalha*7258',
      dialect: 'postgres',
      logging: process.env.NODE_ENV !== 'production',
      pool: {
        max: parseInt(process.env.DB_POOL_MAX || '10', 10),
        min: parseInt(process.env.DB_POOL_MIN || '2', 10),
        acquire: parseInt(process.env.DB_POOL_ACQUIRE || '30000', 10),
        idle: parseInt(process.env.DB_POOL_IDLE || '10000', 10),
      },
    });

    container.bind<JWTConfig>('JWTConfig').toConstantValue({
      secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
      refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    });

    // Infrastructure - Database
    container.bind<DatabaseConnection>('DatabaseConnection').to(DatabaseConnection).inSingletonScope();
    container.bind<ITransactionManager>('ITransactionManager').to(TransactionManager).inSingletonScope();

    // Infrastructure - Logging
    container.bind<ILogger>('ILogger').toConstantValue({
      info: (message: string, meta?: any) => console.log(`[INFO] ${message}`, meta || ''),
      error: (message: string, error?: Error, meta?: any) => console.error(`[ERROR] ${message}`, error || '', meta || ''),
      warn: (message: string, meta?: any) => console.warn(`[WARN] ${message}`, meta || ''),
      debug: (message: string, meta?: any) => console.debug(`[DEBUG] ${message}`, meta || ''),
      setContext: () => {},
      clearContext: () => {},
      child: () => ({ info: console.log, error: console.error, warn: console.warn, debug: console.debug, setContext: () => {}, clearContext: () => {}, child: () => ({}) as any } as any),
    } as ILogger);
    container.bind<PerformanceLogger>('PerformanceLogger').to(PerformanceLogger).inSingletonScope();

    // Infrastructure - Security
    container.bind<IPasswordService>('IPasswordService').to(PasswordService).inSingletonScope();
    container.bind<IJWTService>('IJWTService').to(JWTService).inSingletonScope();
    
    // Infrastructure - Services
    container.bind<IEmailService>('IEmailService').to(EmailService).inSingletonScope();

    // Infrastructure - Events
    container.bind<IEventPublisher>('IEventPublisher').toConstantValue({
      publish: async (event: any) => {
        console.log('[EVENT]', event.type || 'Unknown', event);
      }
    } as IEventPublisher);

    // Infrastructure - Repositories
    container.bind<IUserRepository>('IUserRepository').to(UserRepository).inSingletonScope();
    container.bind<IManufacturingOrderRepository>('IManufacturingOrderRepository').to(ManufacturingOrderRepository).inSingletonScope();
    container.bind<IProductRepository>('IProductRepository').to(ProductRepository).inSingletonScope();
    container.bind<IBOMRepository>('IBOMRepository').to(BOMRepository).inSingletonScope();
    container.bind<IRefreshTokenRepository>('IRefreshTokenRepository').to(RefreshTokenRepository).inSingletonScope();
    // TODO: Add proper repository implementations
    // container.bind<IWorkCenterRepository>('IWorkCenterRepository').to(WorkCenterRepository).inSingletonScope();
    // container.bind<IWorkOrderRepository>('IWorkOrderRepository').to(WorkOrderRepository).inSingletonScope();
    // container.bind<IStockMovementRepository>('IStockMovementRepository').to(StockMovementRepository).inSingletonScope();

    // Domain Services
    container.bind<ManufacturingOrderDomainService>('ManufacturingOrderDomainService').to(ManufacturingOrderDomainService).inSingletonScope();

    // Application - Mappers
    container.bind<UserMapper>('UserMapper').to(UserMapper).inSingletonScope();
    container.bind<ManufacturingOrderMapper>('ManufacturingOrderMapper').to(ManufacturingOrderMapper).inSingletonScope();

    // Application - Use Cases
    container.bind<ILoginUseCase>('ILoginUseCase').to(LoginUseCase).inSingletonScope();
    container.bind<IRegisterUserUseCase>('IRegisterUserUseCase').to(RegisterUserUseCase).inSingletonScope();
    container.bind<IForgotPasswordUseCase>('IForgotPasswordUseCase').to(ForgotPasswordUseCase).inSingletonScope();
    container.bind<IResetPasswordUseCase>('IResetPasswordUseCase').to(ResetPasswordUseCase).inSingletonScope();
    container.bind<RefreshTokenUseCase>('RefreshTokenUseCase').to(RefreshTokenUseCase).inSingletonScope();
    container.bind<LogoutUseCase>('LogoutUseCase').to(LogoutUseCase).inSingletonScope();
    container.bind<ICreateManufacturingOrderUseCase>('ICreateManufacturingOrderUseCase').to(CreateManufacturingOrderUseCase).inSingletonScope();
    container.bind<ConfirmManufacturingOrderUseCase>('ConfirmManufacturingOrderUseCase').to(ConfirmManufacturingOrderUseCase).inSingletonScope();

    // Presentation - Controllers
    container.bind<AuthController>('AuthController').to(AuthController).inSingletonScope();
    container.bind<DashboardController>('DashboardController').to(DashboardController).inSingletonScope();

    // Presentation - Middleware
    container.bind<AuthMiddleware>('AuthMiddleware').to(AuthMiddleware).inSingletonScope();
    container.bind<RoleAuthorizationMiddleware>('RoleAuthorizationMiddleware').to(RoleAuthorizationMiddleware).inSingletonScope();
    container.bind<RateLimitMiddleware>('RateLimitMiddleware').to(RateLimitMiddleware).inSingletonScope();

    return container;
  }

  public static destroy(): void {
    if (DIContainer.instance) {
      DIContainer.instance.unbindAll();
    }
  }
}

// Helper function to get container instance
export const getContainer = (): Container => {
  return DIContainer.getInstance();
};

// Helper function to resolve dependencies
export const resolve = <T>(identifier: string | symbol): T => {
  return getContainer().get<T>(identifier);
};

// Helper function to check if binding exists
export const isBound = (identifier: string | symbol): boolean => {
  return getContainer().isBound(identifier);
};

// Decorator for automatic dependency injection in Express controllers
export function controller(target: any): void {
  // This decorator can be used to automatically bind controllers
  // and resolve their dependencies
  const container = getContainer();
  
  if (!container.isBound(target.name)) {
    container.bind(target.name).to(target).inSingletonScope();
  }
}

// Middleware factory for dependency injection
export const createMiddleware = <T>(identifier: string | symbol) => {
  return (req: any, res: any, next: any) => {
    try {
      const middleware = resolve<T>(identifier);
      return (middleware as any)(req, res, next);
    } catch (error) {
      console.error(`Failed to resolve middleware ${String(identifier)}:`, error);
      next(error);
    }
  };
};

// Controller factory for dependency injection
export const createController = <T>(identifier: string | symbol): T => {
  try {
    return resolve<T>(identifier);
  } catch (error) {
    console.error(`Failed to resolve controller ${String(identifier)}:`, error);
    throw error;
  }
};

// Service factory for dependency injection
export const createService = <T>(identifier: string | symbol): T => {
  try {
    return resolve<T>(identifier);
  } catch (error) {
    console.error(`Failed to resolve service ${String(identifier)}:`, error);
    throw error;
  }
};

// Validation helper for container setup
export const validateContainer = (): { isValid: boolean; errors: string[] } => {
  const container = getContainer();
  const errors: string[] = [];

  // Check critical bindings
  const criticalBindings = [
    'DatabaseConnection',
    'ILogger',
    'IPasswordService',
    'IJWTService',
    'IUserRepository',
    'ILoginUseCase',
    'AuthController',
  ];

  for (const binding of criticalBindings) {
    if (!container.isBound(binding)) {
      errors.push(`Missing binding: ${binding}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Container health check
export const healthCheck = async (): Promise<{ healthy: boolean; details: Record<string, any> }> => {
  const details: Record<string, any> = {};
  let healthy = true;

  try {
    // Check database connection
    const dbConnection = resolve<DatabaseConnection>('DatabaseConnection');
    details.database = await dbConnection.testConnection();
    if (!details.database) {
      healthy = false;
    }
  } catch (error) {
    details.database = false;
    details.databaseError = (error as Error).message;
    healthy = false;
  }

  try {
    // Check logger
    const logger = resolve<ILogger>('ILogger');
    logger.info('Health check - logger test');
    details.logger = true;
  } catch (error) {
    details.logger = false;
    details.loggerError = (error as Error).message;
    healthy = false;
  }

  // Check container validation
  const validation = validateContainer();
  details.containerValidation = validation.isValid;
  if (!validation.isValid) {
    details.containerErrors = validation.errors;
    healthy = false;
  }

  return { healthy, details };
};
