const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { ErrorHandlers } = require('@utils/ErrorHandler');
const logger = require('@utils/logger');

/**
 * Upload Service
 * 
 * Handles file uploads using Multer with organized storage
 * Creates separate folders for each user/agent based on email or phone
 */
class UploadService {
  constructor() {
    this.baseUploadDir = process.env.UPLOAD_DIR || 'uploads';
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB default
    
    // Allowed image mime types
    this.allowedImageTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    // Allowed document types
    this.allowedDocumentTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
  }

  /**
   * Create user-specific folder path
   * @param {string} userType - USER, AGENT, or ADMIN
   * @param {string} identifier - Email or phone number
   * @returns {string} Folder path
   */
  createUserFolder(userType, identifier) {
    try {
      // Sanitize identifier to be safe for folder names
      const sanitized = identifier
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase();
      
      const folderPath = path.join(
        this.baseUploadDir,
        userType.toLowerCase(),
        sanitized
      );

      // Create folder if it doesn't exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        logger.info(`Created upload folder: ${folderPath}`);
      }

      return folderPath;
    } catch (error) {
      logger.error('Error creating user folder:', error);
      throw ErrorHandlers.internal('errors.uploadError');
    }
  }

  /**
   * Generate unique filename
   * @param {string} originalName - Original file name
   * @returns {string} Unique filename
   */
  generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(8).toString('hex');
    const extension = path.extname(originalName);
    const nameWithoutExt = path.basename(originalName, extension);
    
    // Sanitize filename
    const safeName = nameWithoutExt
      .replace(/[^a-zA-Z0-9]/g, '_')
      .substring(0, 50);
    
    return `${safeName}_${timestamp}_${randomString}${extension}`;
  }

  /**
   * Multer storage configuration for user/agent profile images
   * @param {string} userType - USER, AGENT, or ADMIN
   */
  createProfileImageStorage(userType) {
    return multer.diskStorage({
      destination: (req, file, cb) => {
        try {
          // Get user identifier from request
          // Could be from authenticated user or from body
          const identifier = req.user?.email || req.body?.email || req.body?.phone;
          
          if (!identifier) {
            return cb(new Error('MISSING_IDENTIFIER'));
          }

          const folderPath = this.createUserFolder(userType, identifier);
          cb(null, folderPath);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        try {
          const uniqueName = this.generateUniqueFilename(file.originalname);
          cb(null, uniqueName);
        } catch (error) {
          cb(error);
        }
      }
    });
  }

  /**
   * File filter for images
   */
  imageFileFilter(req, file, cb) {
    if (this.allowedImageTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_FILE_TYPE'));
    }
  }

  /**
   * File filter for documents
   */
  documentFileFilter(req, file, cb) {
    if (this.allowedDocumentTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_DOCUMENT_TYPE'));
    }
  }

  /**
   * Create multer upload middleware for user profile image
   */
  createUserImageUpload() {
    return multer({
      storage: this.createProfileImageStorage('USER'),
      fileFilter: this.imageFileFilter.bind(this),
      limits: {
        fileSize: this.maxFileSize,
        files: 1
      }
    }).single('avatar');
  }

  /**
   * Create multer upload middleware for agent profile image
   */
  createAgentImageUpload() {
    return multer({
      storage: this.createProfileImageStorage('AGENT'),
      fileFilter: this.imageFileFilter.bind(this),
      limits: {
        fileSize: this.maxFileSize,
        files: 1
      }
    }).single('avatar');
  }

  /**
   * Create multer upload middleware for agent documents
   */
  createAgentDocumentsUpload() {
    return multer({
      storage: this.createProfileImageStorage('AGENT'),
      fileFilter: this.documentFileFilter.bind(this),
      limits: {
        fileSize: this.maxFileSize * 2, // 10MB for documents
        files: 5
      }
    }).array('documents', 5);
  }

  /**
   * Create multer upload middleware for admin profile image
   */
  createAdminImageUpload() {
    return multer({
      storage: this.createProfileImageStorage('ADMIN'),
      fileFilter: this.imageFileFilter.bind(this),
      limits: {
        fileSize: this.maxFileSize,
        files: 1
      }
    }).single('avatar');
  }

  /**
   * Get file URL
   * @param {string} filePath - File path
   * @returns {string} Public URL
   */
  getFileUrl(filePath) {
    if (!filePath) return null;
    
    const baseUrl = process.env.APP_URL || 'http://localhost:4000';
    // Convert Windows backslashes to forward slashes for URLs
    const urlPath = filePath.replace(/\\/g, '/');
    return `${baseUrl}/${urlPath}`;
  }

  /**
   * Delete file
   * @param {string} filePath - File path to delete
   */
  deleteFile(filePath) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted file: ${filePath}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * Delete old file when updating
   * @param {string} oldUrl - Old file URL
   */
  deleteFileByUrl(oldUrl) {
    if (!oldUrl) return false;

    try {
      const baseUrl = process.env.APP_URL || 'http://localhost:4000';
      const filePath = oldUrl.replace(baseUrl + '/', '').replace(/\//g, path.sep);
      return this.deleteFile(filePath);
    } catch (error) {
      logger.error('Error deleting file by URL:', error);
      return false;
    }
  }

  /**
   * Validate image dimensions (optional)
   * @param {string} filePath - Path to image file
   * @param {number} maxWidth - Maximum width
   * @param {number} maxHeight - Maximum height
   */
  async validateImageDimensions(filePath, maxWidth = 2000, maxHeight = 2000) {
    // This would require image processing library like 'sharp'
    // Implementation depends on requirements
    return true;
  }

  /**
   * Get file info
   * @param {Object} file - Multer file object
   * @returns {Object} File information
   */
  getFileInfo(file) {
    if (!file) return null;

    return {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: file.path,
      url: this.getFileUrl(file.path)
    };
  }

  /**
   * Clean up temporary files on error
   * @param {Object|Array} files - Multer file(s)
   */
  cleanupFiles(files) {
    try {
      const fileArray = Array.isArray(files) ? files : [files];
      
      fileArray.forEach(file => {
        if (file && file.path) {
          this.deleteFile(file.path);
        }
      });
    } catch (error) {
      logger.error('Error cleaning up files:', error);
    }
  }
  /**
   * Upload single file (image) with dynamic configuration
   * @param {string} userType - USER, AGENT, or ADMIN
   * @param {string} fieldName - Form field name (default: 'avatar')
   * @returns {multer} Multer instance
   */
  uploadSingle(userType, fieldName = 'avatar') {
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB default

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        try {
          // Get user identifier (email, phone, or id)
          const identifier = req.user?.email || req.user?.phone || req.user?.id?.toString() || 'temp';
          const folderPath = this.createUserFolder(userType, identifier);
          cb(null, folderPath);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext)
          .replace(/[^a-zA-Z0-9]/g, '_')
          .substring(0, 50);
        cb(null, `${fieldName}_${baseName}_${uniqueSuffix}${ext}`);
      }
    });

    const fileFilter = (req, file, cb) => {
      if (this.allowedImageTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed. Only images are allowed.`), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: maxSize,
        files: 1
      }
    }).single(fieldName);
  }

  /**
   * Upload multiple documents with dynamic configuration
   * @param {string} userType - USER, AGENT, or ADMIN
   * @param {string} fieldName - Form field name
   * @param {number} maxCount - Maximum number of files
   * @returns {multer} Multer instance
   */
  uploadMultiple(userType, fieldName = 'documents', maxCount = null) {
    const maxFiles = maxCount || parseInt(process.env.MAX_DOCUMENTS_COUNT) || 5;
    const maxSize = parseInt(process.env.MAX_DOCUMENT_SIZE) || 10 * 1024 * 1024; // 10MB default

    // Get allowed document types from env
    const allowedTypes = process.env.ALLOWED_DOCUMENT_MIME_TYPES
      ? process.env.ALLOWED_DOCUMENT_MIME_TYPES.split(',')
      : [...this.allowedImageTypes, ...this.allowedDocumentTypes];

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        try {
          // Get user identifier (email or phone)
          const identifier = req.user.email || req.user.phone || req.user.id.toString();
          const folderPath = this.createUserFolder(userType, identifier);
          cb(null, folderPath);
        } catch (error) {
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext)
          .replace(/[^a-zA-Z0-9]/g, '_')
          .substring(0, 50);
        cb(null, `doc_${baseName}_${uniqueSuffix}${ext}`);
      }
    });

    const fileFilter = (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: maxSize,
        files: maxFiles
      }
    }).array(fieldName, maxFiles);
  }

  /**
   * Upload multiple files for complaints (supports anonymous users)
   * @param {string} fieldName - Form field name (default: 'attachments')
   * @param {number} maxCount - Maximum number of files (default: 5)
   * @returns {multer} Multer instance
   */
  uploadComplaintAttachments(fieldName = 'attachments', maxCount = 5) {
    const maxFiles = maxCount || 5;
    const maxSize = parseInt(process.env.MAX_COMPLAINT_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default

    // Allowed types: images and documents
    const allowedTypes = [
      ...this.allowedImageTypes,
      ...this.allowedDocumentTypes
    ];

    const storage = multer.diskStorage({
      destination: (req, file, cb) => {
        try {
          // Create complaints folder
          const folderPath = path.join(this.baseUploadDir, 'complaints');
          
          // Create folder if it doesn't exist
          if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
            logger.info(`Created complaints upload folder: ${folderPath}`);
          }
          
          cb(null, folderPath);
        } catch (error) {
          logger.error('Error creating complaints folder:', error);
          cb(error);
        }
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext)
          .replace(/[^a-zA-Z0-9]/g, '_')
          .substring(0, 50);
        cb(null, `complaint_${baseName}_${uniqueSuffix}${ext}`);
      }
    });

    const fileFilter = (req, file, cb) => {
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error(`File type ${file.mimetype} not allowed. Allowed types: ${allowedTypes.join(', ')}`), false);
      }
    };

    return multer({
      storage,
      fileFilter,
      limits: {
        fileSize: maxSize,
        files: maxFiles
      }
    }).array(fieldName, maxFiles);
  }

  /**
   * Generate file URLs from uploaded files
   * @param {Array} files - Array of multer file objects
   * @returns {Array} Array of file URLs
   */
  generateFileUrls(files) {
    if (!files || files.length === 0) {
      return [];
    }

    const baseUrl = process.env.APP_URL || 'http://localhost:4000';
    return files.map(file => {
      // Convert Windows path to URL path
      const urlPath = file.path.replace(/\\/g, '/');
      return `${baseUrl}/${urlPath}`;
    });
  }
}

module.exports = new UploadService();

