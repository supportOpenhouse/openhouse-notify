import { Entity } from './Entity';
import { IDomainEvent } from './DomainEvent';

export abstract class AggregateRoot<TProps> extends Entity<TProps> {
  private _domainEvents: IDomainEvent[] = [];

  get domainEvents(): ReadonlyArray<IDomainEvent> {
    return this._domainEvents;
  }

  protected addDomainEvent(event: IDomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}
