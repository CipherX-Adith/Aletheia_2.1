/**
 * Custom application error class with HTTP status code
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errors = errors;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message, errors = null) {
    return new AppError(message, 400, errors);
  }

  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403);
  }

  static notFound(message = 'Resource not found') {
    return new AppError(message, 404);
  }

  static conflict(message) {
    return new AppError(message, 409);
  }

  static unprocessable(message, errors = null) {
    return new AppError(message, 422, errors);
  }

  static internal(message = 'Internal server error') {
    return new AppError(message, 500);
  }
}

export default AppError;
