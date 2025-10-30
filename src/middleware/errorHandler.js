const { ErrorHandler } = require('../utils/ErrorHandler');
const logger = require('../utils/logger');

/**
 * Express error handling middleware
 */
const errorMiddleware = (err, req, res, next) => {
  const lang = req.language || 'en';
  
  // Log the error
  logger.error('Request error', {
    path: req.path,
    method: req.method,
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    statusCode: err.statusCode || 500
  });
  
  // Handle operational errors
  if (err instanceof ErrorHandler) {
    return res.status(err.statusCode).json({
      ok: false,
      message: req.t(err.messageKey, err.data),
      messageKey: err.messageKey,
      data: err.data,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
  
  // Handle validation errors from express-validator
  if (err.type === 'validation') {
    return res.status(422).json({
      ok: false,
      message: req.t('errors.validation'),
      errors: err.errors,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      ok: false,
      message: req.t('errors.invalidToken'),
      messageKey: 'errors.invalidToken'
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      ok: false,
      message: req.t('errors.tokenExpired'),
      messageKey: 'errors.tokenExpired'
    });
  }
  
  // Handle Multer errors (file upload)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        ok: false,
        message: req.t('errors.fileTooLarge'),
        messageKey: 'errors.fileTooLarge'
      });
    }
    return res.status(400).json({
      ok: false,
      message: req.t('errors.uploadError'),
      messageKey: 'errors.uploadError'
    });
  }
  
  // Handle database errors
  if (err.name === 'QueryFailedError') {
    logger.error('Database query failed', { error: err.message });
    return res.status(500).json({
      ok: false,
      message: req.t('errors.databaseError'),
      messageKey: 'errors.databaseError',
      ...(process.env.NODE_ENV === 'development' && { detail: err.message })
    });
  }
  
  // Default to 500 internal server error
  return res.status(500).json({
    ok: false,
    message: req.t ? req.t('errors.internal') : 'Internal server error',
    messageKey: 'errors.internal',
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack
    })
  });
};

module.exports = { errorMiddleware };

