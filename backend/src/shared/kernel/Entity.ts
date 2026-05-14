import { v4 as uuidv4 } from 'uuid';

export abstract class Entity<TProps> {
  protected readonly _id: string;
  protected readonly props: TProps;

  protected constructor(props: TProps, id?: string) {
    this._id = id ?? uuidv4();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  equals(entity?: Entity<TProps>): boolean {
    if (!entity) return false;
    if (this === entity) return true;
    return this._id === entity._id;
  }
}
