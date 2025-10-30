const { body, param } = require('express-validator');
const { validate } = require('@middleware/validation');

/**
 * Document Validators
 * 
 * Validation rules for document upload and management
 */

/**
 * Upload documents validation
 * Note: Multer handles file validation (size, type) in middleware
 */
const uploadDocuments = [
  // Files are validated by Multer middleware
  // This validates any additional body fields if needed
  validate
];

/**
 * Delete document validation
 */
const deleteDocument = [
  param('documentId')
    .trim()
    .notEmpty()
    .withMessage('validation.documentIdRequired')
    .isNumeric()
    .withMessage('validation.invalidDocumentId'),
  
  validate
];

module.exports = {
  uploadDocuments,
  deleteDocument
};

