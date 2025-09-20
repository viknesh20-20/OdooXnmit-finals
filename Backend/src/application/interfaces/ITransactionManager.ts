export interface ITransactionManager {
  /**
   * Execute a function within a database transaction
   */
  executeInTransaction<T>(operation: () => Promise<T>): Promise<T>;

  /**
   * Begin a new transaction
   */
  beginTransaction(): Promise<void>;

  /**
   * Commit the current transaction
   */
  commit(): Promise<void>;

  /**
   * Rollback the current transaction
   */
  rollback(): Promise<void>;

  /**
   * Check if currently in a transaction
   */
  isInTransaction(): boolean;
}
