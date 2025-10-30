const multer = require('multer');
const { ErrorHandlers } = require('@utils/ErrorHandler');
const logger = require('@utils/logger');
const UploadService = require('@services/UploadService');

/**
 * Multer Error Handler Middleware
 * 
 * Handles all multer-related errors with proper translations
 */
const handleMulterError = (error, req, res, next) => {
  // Clean up uploaded files on error
  if (req.file) {
    UploadService.cleanupFiles(req.file);
  }
  if (req.files) {
    UploadService.cleanupFiles(req.files);
  }

  // Handle Multer errors
  if (error instanceof multer.MulterError) {
    logger.warn(`Multer error: ${error.code}`, {
      field: error.field,
      limit: error.limit
    });

    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(413).json({
          ok: false,
          message: req.t('errors.fileTooLarge'),
          messageKey: 'errors.fileTooLarge',
          statusCode: 413,
          details: {
            maxSize: `${process.env.MAX_FILE_SIZE || 5242880} bytes`,
            maxSizeMB: `${(parseInt(process.env.MAX_FILE_SIZE) || 5242880) / 1024 / 1024}MB`
          }
        });

      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          ok: false,
          message: req.t('errors.tooManyFiles'),
          messageKey: 'errors.tooManyFiles',
          statusCode: 400
        });

      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          ok: false,
          message: req.t('errors.unexpectedField'),
          messageKey: 'errors.unexpectedField',
          statusCode: 400,
          details: {
            field: error.field
          }
        });

      case 'LIMIT_PART_COUNT':
      case 'LIMIT_FIELD_KEY':
      case 'LIMIT_FIELD_VALUE':
      case 'LIMIT_FIELD_COUNT':
        return res.status(400).json({
          ok: false,
          message: req.t('errors.uploadLimitExceeded'),
          messageKey: 'errors.uploadLimitExceeded',
          statusCode: 400
        });

      default:
        return res.status(400).json({
          ok: false,
          message: req.t('errors.uploadError'),
          messageKey: 'errors.uploadError',
          statusCode: 400
        });
    }
  }

  // Handle custom errors
  if (error.message === 'INVALID_FILE_TYPE') {
    return res.status(400).json({
      ok: false,
      message: req.t('errors.invalidFileType'),
      messageKey: 'errors.invalidFileType',
      statusCode: 400,
      details: {
        allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      }
    });
  }

  if (error.message === 'INVALID_DOCUMENT_TYPE') {
    return res.status(400).json({
      ok: false,
      message: req.t('errors.invalidDocumentType'),
      messageKey: 'errors.invalidDocumentType',
      statusCode: 400,
      details: {
        allowedTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx']
      }
    });
  }

  if (error.message === 'MISSING_IDENTIFIER') {
    return res.status(400).json({
      ok: false,
      message: req.t('errors.missingUserIdentifier'),
      messageKey: 'errors.missingUserIdentifier',
      statusCode: 400
    });
  }

  // Pass other errors to the main error handler
  next(error);
};

/**
 * Wrapper for multer upload middleware with error handling
 * @param {Function} uploadMiddleware - Multer middleware
 */
const wrapMulterUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (error) => {
      if (error) {
        return handleMulterError(error, req, res, next);
      }
      next();
    });
  };
};

/**
 * Validate that a file was uploaded
 */
const requireFile = (fieldName = 'avatar') => {
  return (req, res, next) => {
    if (!req.file && !req.files) {
      return res.status(400).json({
        ok: false,
        message: req.t('errors.fileRequired'),
        messageKey: 'errors.fileRequired',
        statusCode: 400,
        details: {
          field: fieldName
        }
      });
    }
    next();
  };
};

/**
 * Validate file is an image
 */
const validateImage = (req, res, next) => {
  if (!req.file) {
    return next();
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (!allowedTypes.includes(req.file.mimetype)) {
    UploadService.cleanupFiles(req.file);
    return res.status(400).json({
      ok: false,
      message: req.t('errors.invalidFileType'),
      messageKey: 'errors.invalidFileType',
      statusCode: 400,
      details: {
        allowedTypes: allowedTypes,
        receivedType: req.file.mimetype
      }
    });
  }

  next();
};

/**
 * Log upload activity
 */
const logUpload = (req, res, next) => {
  if (req.file) {
    logger.info('File uploaded', {
      userId: req.user?.id,
      userType: req.user?.userType,
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  }

  if (req.files && req.files.length > 0) {
    logger.info('Multiple files uploaded', {
      userId: req.user?.id,
      userType: req.user?.userType,
      count: req.files.length,
      totalSize: req.files.reduce((sum, file) => sum + file.size, 0)
    });
  }

  next();
};

module.exports = {
  handleMulterError,
  wrapMulterUpload,
  requireFile,
  validateImage,
  logUpload
};

