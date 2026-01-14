/**
 * Centralized error handling middleware
 * Catches all errors and returns consistent error responses
 */
export function errorHandler(err, req, res, next) {
  // Log error for debugging (in production, use proper logging)
  console.error('[Error]', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method
  });

  // Handle axios errors (from MFapi calls)
  if (err.isAxiosError) {
    const status = err.response?.status || 503;
    const message = getAxiosErrorMessage(err);
    
    return res.status(status).json({
      success: false,
      error: message
    });
  }

  // Handle validation errors (Zod)
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: err.errors
    });
  }

  // Handle SQLite errors
  if (err.code && err.code.startsWith('SQLITE')) {
    console.error('[SQLite Error]', err.code, err.message);
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
