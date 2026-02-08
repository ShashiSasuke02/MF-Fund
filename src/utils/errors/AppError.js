/**
 * Centralized Error Class
 * Extends standard Error to include HTTP status codes and operational flags
 */
class AppError extends Error {
    constructor(message, statusCode, errorCode = null, details = null) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.errorCode = errorCode; // Machine-readable code (e.g. AUTH_001)
        this.code = errorCode; // Alias for compatibility
        this.details = details; // Validation details or extra context
        this.isOperational = true; // Distinguish operational errors from programming bugs

        Error.captureStackTrace(this, this.constructor);
    }
}

export default AppError;
