/**
 * Custom error handler class for application errors
 */
class ErrorHandler extends Error {
  constructor(messageKey, statusCode = 500, data = {}) {
    super(messageKey);
    this.messageKey = messageKey;
    this.statusCode = statusCode;
    this.data = data;
    this.isOperational = true; // Distinguish operational errors from programmer errors
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Common error creators for convenience
 */
const ErrorHandlers = {
  badRequest: (messageKey = 'errors.badRequest', data = {}) => 
    new ErrorHandler(messageKey, 400, data),
  
  unauthorized: (messageKey = 'errors.unauthorized', data = {}) => 
    new ErrorHandler(messageKey, 401, data),
  
  forbidden: (messageKey = 'errors.forbidden', data = {}) => 
    new ErrorHandler(messageKey, 403, data),
  
  notFound: (messageKey = 'errors.notFound', data = {}) => 
    new ErrorHandler(messageKey, 404, data),
  
  conflict: (messageKey = 'errors.conflict', data = {}) => 
    new ErrorHandler(messageKey, 409, data),
  
  unprocessable: (messageKey = 'errors.unprocessable', data = {}) => 
    new ErrorHandler(messageKey, 422, data),
  
  tooManyRequests: (messageKey = 'errors.tooManyRequests', data = {}) => 
    new ErrorHandler(messageKey, 429, data),
  
  internal: (messageKey = 'errors.internal', data = {}) => 
    new ErrorHandler(messageKey, 500, data),
  
  serviceUnavailable: (messageKey = 'errors.serviceUnavailable', data = {}) => 
    new ErrorHandler(messageKey, 503, data)
};

module.exports = { ErrorHandler, ErrorHandlers };

