import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { injectable } from 'inversify';

import { ILogger } from '@application/interfaces/IPasswordService';

export interface LoggerConfig {
  level: string;
  filePath: string;
  maxFiles: string;
  maxSize: string;
  enableConsole: boolean;
  enableFile: boolean;
  format: 'json' | 'simple';
}

@injectable()
export class WinstonLogger implements ILogger {
  private readonly logger: winston.Logger;
  private readonly context: Record<string, unknown>;

  constructor(config?: LoggerConfig, context: Record<string, unknown> = {}) {
    this.context = context;
    
    const defaultConfig: LoggerConfig = {
      level: process.env.LOG_LEVEL || 'info',
      filePath: process.env.LOG_FILE_PATH || 'logs/',
      maxFiles: '14d',
      maxSize: '20m',
      enableConsole: process.env.NODE_ENV !== 'production',
      enableFile: true,
      format: process.env.NODE_ENV === 'production' ? 'json' : 'simple',
    };

    const finalConfig = { ...defaultConfig, ...config };

    this.logger = winston.createLogger({
      level: finalConfig.level,
      format: this.createFormat(finalConfig.format),
      defaultMeta: {
        service: 'manufacturing-erp',
        ...this.context,
      },
      transports: this.createTransports(finalConfig),
      exitOnError: false,
    });

    // Handle uncaught exceptions and unhandled rejections
    this.logger.exceptions.handle(
      new winston.transports.File({
        filename: `${finalConfig.filePath}/exceptions.log`,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      })
    );

    this.logger.rejections.handle(
      new winston.transports.File({
        filename: `${finalConfig.filePath}/rejections.log`,
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json()
        ),
      })
    );
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    this.logger.debug(message, { ...this.context, ...meta });
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    this.logger.info(message, { ...this.context, ...meta });
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    this.logger.warn(message, { ...this.context, ...meta });
  }

  public error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    const errorMeta = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    } : {};

    this.logger.error(message, {
      ...this.context,
      ...errorMeta,
      ...meta,
    });
  }

  public child(context: Record<string, unknown>): ILogger {
    return new WinstonLogger(undefined, { ...this.context, ...context });
  }

  private createFormat(formatType: 'json' | 'simple'): winston.Logform.Format {
    const baseFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS',
      }),
      winston.format.errors({ stack: true }),
      winston.format.splat()
    );

    if (formatType === 'json') {
      return winston.format.combine(
        baseFormat,
        winston.format.json()
      );
    }

    return winston.format.combine(
      baseFormat,
      winston.format.colorize({ all: true }),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        const metaString = Object.keys(meta).length > 0 
          ? `\n${JSON.stringify(meta, null, 2)}` 
          : '';
        
        return `${timestamp} [${service}] ${level}: ${message}${metaString}`;
      })
    );
  }

  private createTransports(config: LoggerConfig): winston.transport[] {
    const transports: winston.transport[] = [];

    if (config.enableConsole) {
      transports.push(
        new winston.transports.Console({
          format: this.createFormat('simple'),
          handleExceptions: true,
          handleRejections: true,
        })
      );
    }

    if (config.enableFile) {
      // Application logs
      transports.push(
        new DailyRotateFile({
          filename: `${config.filePath}/application-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxFiles: config.maxFiles,
          maxSize: config.maxSize,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      );

      // Error logs
      transports.push(
        new DailyRotateFile({
          filename: `${config.filePath}/error-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxFiles: config.maxFiles,
          maxSize: config.maxSize,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      );

      // Combined logs
      transports.push(
        new DailyRotateFile({
          filename: `${config.filePath}/combined-%DATE%.log`,
          datePattern: 'YYYY-MM-DD',
          maxFiles: config.maxFiles,
          maxSize: config.maxSize,
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        })
      );
    }

    return transports;
  }

  public getWinstonLogger(): winston.Logger {
    return this.logger;
  }

  public setLevel(level: string): void {
    this.logger.level = level;
  }

  public addTransport(transport: winston.transport): void {
    this.logger.add(transport);
  }

  public removeTransport(transport: winston.transport): void {
    this.logger.remove(transport);
  }

  public close(): void {
    this.logger.close();
  }
}

// Correlation ID middleware for request tracing
export class CorrelationIdManager {
  private static instance: CorrelationIdManager;
  private correlationIds = new Map<string, string>();

  public static getInstance(): CorrelationIdManager {
    if (!CorrelationIdManager.instance) {
      CorrelationIdManager.instance = new CorrelationIdManager();
    }
    return CorrelationIdManager.instance;
  }

  public generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public setCorrelationId(requestId: string, correlationId: string): void {
    this.correlationIds.set(requestId, correlationId);
  }

  public getCorrelationId(requestId: string): string | undefined {
    return this.correlationIds.get(requestId);
  }

  public removeCorrelationId(requestId: string): void {
    this.correlationIds.delete(requestId);
  }

  public clear(): void {
    this.correlationIds.clear();
  }
}

// Performance logger for monitoring
@injectable()
export class PerformanceLogger {
  private logger: ILogger | null = null;

  public setLogger(logger: ILogger): void {
    this.logger = logger;
  }

  public logDatabaseQuery(
    query: string,
    duration: number,
    rowCount?: number,
    error?: Error
  ): void {
    const meta = {
      type: 'database_query',
      query: query.substring(0, 500), // Truncate long queries
      duration,
      rowCount,
      error: error ? {
        name: error.name,
        message: error.message,
      } : undefined,
    };

    if (!this.logger) return;

    if (error) {
      this.logger.error('Database query failed', error, meta);
    } else if (duration > 1000) { // Log slow queries (>1s)
      this.logger.warn('Slow database query detected', meta);
    } else {
      this.logger.debug('Database query executed', meta);
    }
  }

  public logApiRequest(
    method: string,
    path: string,
    statusCode: number,
    duration: number,
    userId?: string,
    error?: Error
  ): void {
    const meta = {
      type: 'api_request',
      method,
      path,
      statusCode,
      duration,
      userId,
      error: error ? {
        name: error.name,
        message: error.message,
      } : undefined,
    };

    if (!this.logger) return;

    if (error || statusCode >= 500) {
      this.logger.error('API request failed', error, meta);
    } else if (statusCode >= 400) {
      this.logger.warn('API request client error', meta);
    } else if (duration > 5000) { // Log slow requests (>5s)
      this.logger.warn('Slow API request detected', meta);
    } else {
      this.logger.info('API request completed', meta);
    }
  }

  public logBusinessOperation(
    operation: string,
    duration: number,
    success: boolean,
    userId?: string,
    metadata?: Record<string, unknown>
  ): void {
    const meta = {
      type: 'business_operation',
      operation,
      duration,
      success,
      userId,
      ...metadata,
    };

    if (!this.logger) return;

    if (success) {
      this.logger.info('Business operation completed', meta);
    } else {
      this.logger.error('Business operation failed', undefined, meta);
    }
  }
}
