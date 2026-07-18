import { env } from '../../config/env.js';
import { logger } from '../logger/index.js';
import { AppError } from './AppError.js';

/**
 * Global Express error handling middleware
 */
export function errorHandler(err, req, res, next) {
  let error = err;

  // Wrap non-operational errors
  if (!error.isOperational) {
    logger.error('Unexpected error:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
    });
    error = AppError.internal();
  } else {
    logger.warn('Operational error:', { message: err.message, statusCode: err.statusCode });
  }

  // Prisma errors
  if (err.code === 'P2002') {
    error = AppError.conflict('A record with this value already exists');
  } else if (err.code === 'P2025') {
    error = AppError.notFound('Record not found');
  } else if (err.code === 'P2003') {
    error = AppError.badRequest('Referenced record does not exist');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = AppError.unauthorized('Invalid token');
  } else if (err.name === 'TokenExpiredError') {
    error = AppError.unauthorized('Token has expired');
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    errors: error.errors || null,
    ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
}

export default errorHandler;
