const logger = require('@utils/logger');
const { ErrorHandlers } = require('@utils/ErrorHandler');

/**
 * Upload Middleware
 * 
 * Provides middleware for handling file uploads with Multer
 */

/**
 * Wrap Multer upload middleware for better error handling
 * @param {Function} upload - Multer upload instance
 * @returns {Function} Express middleware
 */
function wrapMulterUpload(upload) {
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) {
        // Multer errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(ErrorHandlers.badRequest('errors.fileTooLarge'));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(ErrorHandlers.badRequest('errors.tooManyFiles'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(ErrorHandlers.badRequest('errors.unexpectedField'));
        }
        
        // Custom errors (from fileFilter)
        if (err.message) {
          return next(ErrorHandlers.badRequest(err.message));
        }
        
        // Unknown error
        logger.error('Upload error:', err);
        return next(ErrorHandlers.badRequest('errors.uploadFailed'));
      }
      next();
    });
  };
}

/**
 * Log upload details
 * @returns {Function} Express middleware
 */
function logUpload(req, res, next) {
  if (req.file) {
    logger.info('File uploaded', {
      user: req.user ? req.user.email : 'unknown',
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  }
  
  if (req.files && req.files.length > 0) {
    logger.info('Multiple files uploaded', {
      user: req.user ? req.user.email : 'unknown',
      count: req.files.length,
      totalSize: req.files.reduce((sum, file) => sum + file.size, 0)
    });
  }
  
  next();
}

module.exports = {
  wrapMulterUpload,
  logUpload
};

