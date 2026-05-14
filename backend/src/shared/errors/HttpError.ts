import { AppError } from './AppError';

export class BadRequestError extends AppError {
  constructor(message = 'Bad request', code?: string) {
    super(message, 400, true, code);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized', code?: string) {
    super(message, 401, true, code);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden', code?: string) {
    super(message, 403, true, code);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code?: string) {
    super(message, 404, true, code);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict', code?: string) {
    super(message, 409, true, code);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message = 'Unprocessable entity', code?: string) {
    super(message, 422, true, code);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Internal server error', code?: string) {
    super(message, 500, false, code);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporarily unavailable', code?: string) {
    super(message, 503, true, code);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
