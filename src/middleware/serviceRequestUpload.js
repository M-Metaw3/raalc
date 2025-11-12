const multer = require('multer');
const path = require('path');
const { ErrorHandlers } = require('@utils/ErrorHandler');

/**
 * Service Request Document Upload Middleware
 * 
 * Handles file uploads for service requests
 * - Maximum 5 files per request
 * - Maximum 5MB per file
 * - Allowed formats: PDF, Images (JPEG, PNG, GIF, WebP), Word (DOC, DOCX)
 */

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join('uploads', 'service-requests');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${sanitizedName}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // PDF
    'application/pdf',
    // Word documents
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // .docx
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      ErrorHandlers.badRequest('serviceRequest.invalidFileType'),
      false
    );
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5 // Maximum 5 files
  }
});

/**
 * Upload multiple documents (max 5)
 */
const uploadDocuments = upload.array('documents', 5);

/**
 * Wrapper to handle multer errors
 */
const wrapUpload = (uploadMiddleware) => {
  return (req, res, next) => {
    uploadMiddleware(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Multer-specific errors
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(ErrorHandlers.badRequest('errors.fileTooLarge'));
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return next(ErrorHandlers.badRequest('serviceRequest.tooManyDocuments'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(ErrorHandlers.badRequest('errors.unexpectedField'));
        }
        return next(ErrorHandlers.badRequest('errors.uploadFailed'));
      } else if (err) {
        // Other errors (e.g., invalid file type)
        return next(err);
      }
      next();
    });
  };
};

module.exports = {
  uploadDocuments: wrapUpload(uploadDocuments)
};

