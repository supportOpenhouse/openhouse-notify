import { EventEmitter } from 'events';
import { IDomainEvent } from '@shared/kernel';
import { logger } from '@infrastructure/logger';

type DomainEventHandler = (event: IDomainEvent) => void | Promise<void>;

class EventBus extends EventEmitter {
  publish(event: IDomainEvent): void {
    logger.debug('EventBus: publishing', { eventName: event.eventName });
    this.emit(event.eventName, event);
  }

  subscribe(eventName: string, handler: DomainEventHandler): void {
    this.on(eventName, handler);
    logger.debug('EventBus: subscribed', { eventName });
  }

  unsubscribe(eventName: string, handler: DomainEventHandler): void {
    this.off(eventName, handler);
  }
}

export const eventBus = new EventBus();
eventBus.setMaxListeners(100);
