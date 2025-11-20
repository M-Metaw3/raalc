const { body, param, query } = require('express-validator');
const { validate } = require('@middleware/validation');

/**
 * Complaint Validators
 */

// Create complaint validation
const createComplaintValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('validation.firstNameRequired')
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.firstNameLength'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('validation.lastNameRequired')
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.lastNameLength'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('validation.emailRequired')
    .isEmail()
    .withMessage('validation.invalidEmail')
    .normalizeEmail(),

  body('phoneNumber')
    .optional()
    .trim()
    .isLength({ min: 10, max: 20 })
    .withMessage('validation.invalidPhone'),

  body('complaintType')
    .optional()
    .isIn(['financial', 'technical', 'service', 'other'])
    .withMessage('validation.invalidComplaintType'),

  body('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.invalidDepartmentId'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('validation.descriptionRequired')
    .isLength({ min: 10, max: 5000 })
    .withMessage('validation.descriptionLength'),

  // attachments are now handled via multer file upload
  // No need to validate in body since they come from req.files

  validate
];

// Resolve complaint validation
const resolveComplaintValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.invalidComplaintId'),

  body('resolutionNotes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('validation.resolutionNotesLength'),

  validate
];

// Reject complaint validation
const rejectComplaintValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.invalidComplaintId'),

  body('rejectionReason')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('validation.rejectionReasonLength'),

  validate
];

// Update status validation
const updateStatusValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.invalidComplaintId'),

  body('status')
    .notEmpty()
    .withMessage('validation.statusRequired')
    .isIn(['pending', 'in_progress', 'resolved', 'rejected', 'closed'])
    .withMessage('validation.invalidComplaintStatus'),

  validate
];

// Complaint ID validation
const complaintIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.invalidComplaintId'),

  validate
];

// List complaints query validation
const listComplaintsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.invalidPage'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('validation.invalidLimit'),

  query('status')
    .optional()
    .isIn(['pending', 'in_progress', 'resolved', 'rejected', 'closed'])
    .withMessage('validation.invalidComplaintStatus'),

  query('complaintType')
    .optional()
    .isIn(['financial', 'technical', 'service', 'other'])
    .withMessage('validation.invalidComplaintType'),

  query('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.invalidDepartmentId'),

  query('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('validation.invalidEmail'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.searchLength'),

  validate
];

module.exports = {
  createComplaintValidation,
  resolveComplaintValidation,
  rejectComplaintValidation,
  updateStatusValidation,
  complaintIdValidation,
  listComplaintsValidation
};

