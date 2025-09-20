import { Sequelize, Options, QueryTypes } from 'sequelize';
import { injectable, inject } from 'inversify';

import { DatabaseConfig } from '@/types/common';
import { ILogger } from '@application/interfaces/IPasswordService';
import { initializeModels } from '@infrastructure/database/models';

@injectable()
export class DatabaseConnection {
  private sequelize: Sequelize | null = null;

  constructor(
    @inject('DatabaseConfig') private readonly config: DatabaseConfig,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async connect(): Promise<Sequelize> {
    if (this.sequelize) {
      return this.sequelize;
    }

    const options: Options = {
      host: this.config.host,
      port: this.config.port,
      dialect: this.config.dialect,
      database: this.config.database,
      username: this.config.username,
      password: this.config.password,
      logging: this.config.logging ? (msg: string) => this.logger.debug(msg) : false,
      pool: this.config.pool,
      define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true,
      },
      dialectOptions: {
        ssl: process.env.NODE_ENV === 'production' ? {
          require: true,
          rejectUnauthorized: false,
        } : false,
      },
      benchmark: true,
      retry: {
        max: 3,
        match: [
          /ETIMEDOUT/,
          /EHOSTUNREACH/,
          /ECONNRESET/,
          /ECONNREFUSED/,
          /ETIMEDOUT/,
          /ESOCKETTIMEDOUT/,
          /EHOSTUNREACH/,
          /EPIPE/,
          /EAI_AGAIN/,
          /SequelizeConnectionError/,
          /SequelizeConnectionRefusedError/,
          /SequelizeHostNotFoundError/,
          /SequelizeHostNotReachableError/,
          /SequelizeInvalidConnectionError/,
          /SequelizeConnectionTimedOutError/,
        ],
      },
    };

    this.sequelize = new Sequelize(options);

    try {
      await this.sequelize.authenticate();
      this.logger.info('Database connection established successfully', {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
      });

      // Initialize all models
      initializeModels(this.sequelize);
      this.logger.info('Database models initialized successfully');
    } catch (error) {
      this.logger.error('Unable to connect to database', error as Error, {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
      });
      throw error;
    }

    return this.sequelize;
  }

  public async disconnect(): Promise<void> {
    if (this.sequelize) {
      await this.sequelize.close();
      this.sequelize = null;
      this.logger.info('Database connection closed');
    }
  }

  public getSequelize(): Sequelize {
    if (!this.sequelize) {
      throw new Error('Database connection not established. Call connect() first.');
    }
    return this.sequelize;
  }

  public async testConnection(): Promise<boolean> {
    try {
      if (!this.sequelize) {
        await this.connect();
      }
      await this.sequelize!.authenticate();
      return true;
    } catch (error) {
      this.logger.error('Database connection test failed', error as Error);
      return false;
    }
  }

  public async executeRawQuery<T>(
    query: string,
    replacements?: Record<string, unknown>
  ): Promise<T[]> {
    if (!this.sequelize) {
      throw new Error('Database connection not established');
    }

    const [results] = await this.sequelize.query(query, {
      replacements,
      type: QueryTypes.SELECT,
    });

    return (results || []) as T[];
  }

  public async executeTransaction<T>(
    fn: (transaction: import('sequelize').Transaction) => Promise<T>
  ): Promise<T> {
    if (!this.sequelize) {
      throw new Error('Database connection not established');
    }

    return this.sequelize.transaction(fn);
  }
}

@injectable()
export class TransactionManager {
  constructor(
    @inject('DatabaseConnection') private readonly databaseConnection: DatabaseConnection,
    @inject('ILogger') private readonly logger: ILogger
  ) {}

  public async executeInTransaction<T>(fn: () => Promise<T>): Promise<T> {
    const sequelize = this.databaseConnection.getSequelize();
    
    return sequelize.transaction(async (transaction) => {
      try {
        // Store transaction in context (implementation would use AsyncLocalStorage or similar)
        const result = await fn();
        this.logger.debug('Transaction completed successfully');
        return result;
      } catch (error) {
        this.logger.error('Transaction failed, rolling back', error as Error);
        throw error;
      }
    });
  }

  public async executeInTransactionWithIsolation<T>(
    fn: () => Promise<T>,
    isolationLevel: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE'
  ): Promise<T> {
    const sequelize = this.databaseConnection.getSequelize();
    
    const sequelizeIsolationLevel = this.mapIsolationLevel(isolationLevel);
    
    return sequelize.transaction(
      { isolationLevel: sequelizeIsolationLevel },
      async (transaction) => {
        try {
          const result = await fn();
          this.logger.debug('Transaction with isolation level completed successfully', {
            isolationLevel,
          });
          return result;
        } catch (error) {
          this.logger.error('Transaction with isolation level failed, rolling back', error as Error, {
            isolationLevel,
          });
          throw error;
        }
      }
    );
  }

  private mapIsolationLevel(
    level: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE'
  ): import('sequelize').Transaction.ISOLATION_LEVELS {
    const { Transaction } = require('sequelize');
    
    switch (level) {
      case 'READ_UNCOMMITTED':
        return Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED;
      case 'READ_COMMITTED':
        return Transaction.ISOLATION_LEVELS.READ_COMMITTED;
      case 'REPEATABLE_READ':
        return Transaction.ISOLATION_LEVELS.REPEATABLE_READ;
      case 'SERIALIZABLE':
        return Transaction.ISOLATION_LEVELS.SERIALIZABLE;
      default:
        return Transaction.ISOLATION_LEVELS.READ_COMMITTED;
    }
  }
}

// Database model interfaces for Sequelize
export interface UserModel {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone?: string;
  status: string;
  role_id?: string;
  email_verified: boolean;
  email_verification_token?: string;
  email_verification_expires?: Date;
  password_reset_token?: string;
  password_reset_expires?: Date;
  last_login?: Date;
  failed_login_attempts: number;
  locked_until?: Date;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface ProductModel {
  id: string;
  sku: string;
  name: string;
  description?: string;
  category_id?: string;
  uom_id: string;
  type: string;
  cost_price: number;
  selling_price: number;
  min_stock_level: number;
  max_stock_level: number;
  reorder_point: number;
  lead_time_days: number;
  is_active: boolean;
  specifications: Record<string, unknown>;
  attachments: string[];
  created_at: Date;
  updated_at: Date;
}

export interface ManufacturingOrderModel {
  id: string;
  mo_number: string;
  product_id: string;
  bom_id: string;
  quantity: number;
  quantity_unit: string;
  status: string;
  priority: string;
  planned_start_date?: Date;
  planned_end_date?: Date;
  actual_start_date?: Date;
  actual_end_date?: Date;
  created_by: string;
  assigned_to?: string;
  notes?: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface RoleModel {
  id: string;
  name: string;
  description?: string;
  permissions: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshTokenModel {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
  revoked_at?: Date;
  replaced_by?: string;
}
