export interface IDomainEvent {
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly eventName: string;
  readonly payload: Record<string, unknown>;
}

export abstract class DomainEvent implements IDomainEvent {
  readonly occurredAt: Date;
  readonly aggregateId: string;
  readonly eventName: string;

  constructor(aggregateId: string, eventName: string) {
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
    this.eventName = eventName;
  }

  abstract get payload(): Record<string, unknown>;
}
