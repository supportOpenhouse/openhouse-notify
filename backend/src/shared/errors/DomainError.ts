import { AppError } from './AppError';

export class DomainError extends AppError {
  constructor(message: string, code?: string) {
    super(message, 422, true, code);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
