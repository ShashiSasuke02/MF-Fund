import logger from '../services/logger.service.js';

/**
 * Centralized error handling middleware
 * Catches all errors and returns consistent error responses
 */
export function errorHandler(err, req, res, next) {
  const { requestId } = req;

  // Log error for debugging (using centralized logger)
  // We log all errors that reach here as 'error' level if they are 500s or unexpected
  // Validation errors or 4xx might be 'warn' or 'info' depending on preference

  // Handle axios errors (from MFapi calls)
  if (err.isAxiosError) {
    const status = err.response?.status || 503;
    const message = getAxiosErrorMessage(err);

    logger.warn(`External API Error: ${message}`, {
      requestId,
      method: req.method,
      url: req.url,
      status
    });

    return res.status(status).json({
      success: false,
      error: message
    });
  }

  // Handle validation errors (Zod)
  if (err.name === 'ZodError') {
    logger.debug(`Validation Error: ${req.url}`, {
      requestId,
      errors: err.errors
    });

    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors
    });
  }

  // Handle SQLite errors
  if (err.code && err.code.startsWith('SQLITE')) {
    logger.error(`Database Error: ${err.message}`, {
      requestId,
      code: err.code,
      stack: err.stack
    });

    return res.status(500).json({
      success: false,
      error: 'Database error occurred'
    });
  }

  // Default error response
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message || 'Internal server error';

  if (statusCode >= 500) {
    logger.error(`Server Error: ${err.message}`, {
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
    error: message
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
export function notFoundHandler(req, res) {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.path} not found`
  });
}

export default errorHandler;
