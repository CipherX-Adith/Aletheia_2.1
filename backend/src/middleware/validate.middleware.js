import { validationResult } from 'express-validator';
import { AppError } from '../common/errors/AppError.js';

/**
 * Runs after express-validator chains.
 * Collects all errors and throws a 422 if any exist.
 */
export function validate(req, res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const errors = result.array().map((e) => ({
      field: e.path,
      message: e.msg,
      value: e.value,
    }));
    return next(AppError.unprocessable('Validation failed', errors));
  }
  next();
}

export default validate;
