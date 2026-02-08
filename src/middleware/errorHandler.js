import logger from '../services/logger.service.js';
import AppError from '../utils/errors/AppError.js';

/**
 * Centralized error handling middleware
 * Catches all errors and returns consistent error responses
 */
export function errorHandler(err, req, res, next) {
  const { requestId } = req;

  // 1. Handle AppError (Known operational errors)
  if (err instanceof AppError) {
    if (err.isOperational) {
      logger.warn(`Operational Error: ${err.message}`, {
        requestId,
        errorCode: err.errorCode,
        statusCode: err.statusCode,
        details: err.details
      });
    } else {
      logger.error(`System Error: ${err.message}`, {
        requestId,
        stack: err.stack
      });
    }

    return res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      code: err.errorCode,
      details: err.details
    });
  }

  // 2. Handle Axios Errors (External API failures)
  if (err.isAxiosError) {
    const status = err.response?.status || 503;
    const message = getAxiosErrorMessage(err);

    logger.warn(`External API Error: ${message}`, {
      requestId,
      method: req.method,
      url: req.url,
      status,
      originalError: err.message
    });

    return res.status(status).json({
      success: false,
      status: 'error',
      message: message,
      code: 'EXT_API_ERROR'
    });
  }

  // 3. Handle Validation Errors (Zod/Joi generic handling if not wrapped in AppError)
  if (err.name === 'ZodError') {
    logger.debug(`Validation Error: ${req.url}`, {
      requestId,
      errors: err.errors
    });

    return res.status(400).json({
      success: false,
      status: 'fail',
      message: 'Validation error',
      code: 'VAL_ERROR',
      details: err.errors
    });
  }

  // 4. Handle Database Errors (SQLite/MySQL specific logic)
  if (err.code && (err.code.startsWith('SQLITE') || err.code === 'ER_DUP_ENTRY')) {
    logger.error(`Database Error: ${err.message}`, {
      requestId,
      code: err.code,
      stack: err.stack
    });

    // Handle unique constraint violations gracefully
    if (err.code === 'SQLITE_CONSTRAINT' || err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        success: false,
        status: 'fail',
        message: 'Duplicate entry found',
        code: 'DB_DUPLICATE'
      });
    }

    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Database operation failed',
      code: 'DB_ERROR'
    });
  }

  // 5. Default / Unknown Errors
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message || 'Internal server error';

  const logLevel = statusCode >= 500 ? 'error' : 'warn';

  if (logLevel === 'error') {
    logger.error(`Unexpected Server Error: ${err.message}`, {
      requestId,
      stack: err.stack,
      url: req.url,
      method: req.method
    });
  } else {
    logger.warn(`Client Error: ${err.message}`, {
      requestId,
      statusCode
    });
  }

  res.status(statusCode).json({
    success: false,
    status: 'error',
    message: message,
    code: 'INTERNAL_SERVER_ERROR'
  });
}

/**
 * Get user-friendly message for axios errors
 */
function getAxiosErrorMessage(err) {
  if (err.code === 'ECONNABORTED') {
    return 'Request to external API timed out. Please try again.';
  }
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    return 'Unable to reach external API. Please try again later.';
  }
  if (err.response) {
    const status = err.response.status;
    if (status === 404) return 'Requested resource not found';
    if (status === 429) return 'Too many requests. Please wait and try again.';
    if (status >= 500) return 'External API is experiencing issues. Please try again later.';
  }
  return 'Failed to fetch data from external service';
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(req, res, next) {
  next(new AppError(`Route ${req.method} ${req.path} not found`, 404, 'ROUTE_NOT_FOUND'));
}

export default errorHandler;
