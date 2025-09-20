export interface IPasswordService {
  /**
   * Hash a plain text password
   */
  hash(password: string): Promise<string>;

  /**
   * Verify a plain text password against a hash
   */
  verify(password: string, hash: string): Promise<boolean>;

  /**
   * Generate a secure random password
   */
  generateSecurePassword(length?: number): string;

  /**
   * Validate password strength
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    score: number;
    feedback: string[];
  };
}

export interface IJWTService {
  /**
   * Generate an access token
   */
  generateAccessToken(payload: {
    userId: string;
    username: string;
    email: string;
    roleId?: string;
  }): Promise<string>;

  /**
   * Generate a refresh token
   */
  generateRefreshToken(userId: string): Promise<{
    token: string;
    refreshToken: import('@domain/entities/RefreshToken').RefreshToken;
  }>;

  /**
   * Verify and decode an access token
   */
  verifyAccessToken(token: string): Promise<{
    userId: string;
    username: string;
    email: string;
    roleId?: string;
    iat: number;
    exp: number;
  }>;

  /**
   * Hash a token for storage
   */
  hashToken(token: string): string;

  /**
   * Get access token expiration time in seconds
   */
  getAccessTokenExpirationTime(): number;

  /**
   * Get refresh token expiration time in seconds
   */
  getRefreshTokenExpirationTime(): number;

  /**
   * Get token expiration time from a token
   */
  getTokenExpirationTime(token: string): number | null;
}

export interface IEmailService {
  /**
   * Send email verification email
   */
  sendEmailVerification(to: string, token: string, username: string): Promise<void>;

  /**
   * Send password reset email
   */
  sendPasswordReset(to: string, token: string, username: string): Promise<void>;

  /**
   * Send welcome email
   */
  sendWelcomeEmail(to: string, username: string): Promise<void>;

  /**
   * Send manufacturing order notification
   */
  sendManufacturingOrderNotification(
    to: string,
    moNumber: string,
    status: string,
    details: Record<string, unknown>
  ): Promise<void>;

  /**
   * Send low stock alert
   */
  sendLowStockAlert(
    to: string,
    productSku: string,
    currentStock: number,
    reorderPoint: number
  ): Promise<void>;
}

export interface IFileStorageService {
  /**
   * Upload a file
   */
  uploadFile(
    file: Buffer,
    filename: string,
    mimeType: string,
    folder?: string
  ): Promise<{
    filename: string;
    path: string;
    size: number;
    url: string;
  }>;

  /**
   * Delete a file
   */
  deleteFile(path: string): Promise<void>;

  /**
   * Get file URL
   */
  getFileUrl(path: string): string;

  /**
   * Check if file exists
   */
  fileExists(path: string): Promise<boolean>;
}

export interface IEventPublisher {
  /**
   * Publish a domain event
   */
  publish(event: import('@/types/common').DomainEvent): Promise<void>;

  /**
   * Publish multiple domain events
   */
  publishMany(events: import('@/types/common').DomainEvent[]): Promise<void>;
}

export interface ITransactionManager {
  /**
   * Execute a function within a database transaction
   */
  executeInTransaction<T>(fn: () => Promise<T>): Promise<T>;

  /**
   * Execute a function within a transaction with isolation level
   */
  executeInTransactionWithIsolation<T>(
    fn: () => Promise<T>,
    isolationLevel: 'READ_UNCOMMITTED' | 'READ_COMMITTED' | 'REPEATABLE_READ' | 'SERIALIZABLE'
  ): Promise<T>;
}

export interface ILogger {
  /**
   * Log debug message
   */
  debug(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log info message
   */
  info(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log warning message
   */
  warn(message: string, meta?: Record<string, unknown>): void;

  /**
   * Log error message
   */
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;

  /**
   * Create child logger with additional context
   */
  child(context: Record<string, unknown>): ILogger;
}

export interface ICacheService {
  /**
   * Get value from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set value in cache
   */
  set(key: string, value: unknown, ttlSeconds?: number): Promise<void>;

  /**
   * Delete value from cache
   */
  delete(key: string): Promise<void>;

  /**
   * Check if key exists in cache
   */
  exists(key: string): Promise<boolean>;

  /**
   * Clear all cache
   */
  clear(): Promise<void>;

  /**
   * Get multiple values from cache
   */
  mget<T>(keys: string[]): Promise<(T | null)[]>;

  /**
   * Set multiple values in cache
   */
  mset(keyValues: Record<string, unknown>, ttlSeconds?: number): Promise<void>;
}

export interface INotificationService {
  /**
   * Send notification to user
   */
  sendNotification(
    userId: string,
    title: string,
    message: string,
    type?: 'info' | 'warning' | 'error' | 'success',
    metadata?: Record<string, unknown>
  ): Promise<void>;

  /**
   * Send notification to multiple users
   */
  sendBulkNotification(
    userIds: string[],
    title: string,
    message: string,
    type?: 'info' | 'warning' | 'error' | 'success',
    metadata?: Record<string, unknown>
  ): Promise<void>;

  /**
   * Mark notification as read
   */
  markAsRead(notificationId: string, userId: string): Promise<void>;

  /**
   * Get user notifications
   */
  getUserNotifications(
    userId: string,
    unreadOnly?: boolean,
    limit?: number,
    offset?: number
  ): Promise<{
    notifications: Array<{
      id: string;
      title: string;
      message: string;
      type: string;
      isRead: boolean;
      createdAt: Date;
      metadata?: Record<string, unknown>;
    }>;
    total: number;
    unreadCount: number;
  }>;
}
