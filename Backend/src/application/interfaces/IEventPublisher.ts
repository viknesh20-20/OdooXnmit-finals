import { DomainEvent } from '@/types/common';

export interface IEventPublisher {
  /**
   * Publish a single domain event
   */
  publish<T extends DomainEvent>(event: T): Promise<void>;

  /**
   * Publish multiple domain events
   */
  publishMany<T extends DomainEvent>(events: T[]): Promise<void>;

  /**
   * Subscribe to domain events of a specific type
   */
  subscribe<T extends DomainEvent>(
    eventType: string,
    handler: (event: T) => Promise<void>
  ): void;

  /**
   * Unsubscribe from domain events of a specific type
   */
  unsubscribe(eventType: string, handler: Function): void;
}
