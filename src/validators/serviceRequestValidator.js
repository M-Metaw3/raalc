const { body, param, query } = require('express-validator');
const { validate } = require('@middleware/validation');

/**
 * Validation rules for service requests
 */

/**
 * Create service request validation
 */
const createRequestValidation = [
  body('categoryId')
    .notEmpty()
    .withMessage('validation.categoryIdRequired')
    .isInt({ min: 1 })
    .withMessage('validation.categoryIdInvalid'),

  body('fullName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.fullNameLength'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('validation.emailInvalid')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-()]+$/)
    .withMessage('validation.phoneInvalid')
    .isLength({ min: 8, max: 20 })
    .withMessage('validation.phoneLength'),

  body('additionalEmail')
    .optional()
    .trim()
    .isEmail()
    .withMessage('validation.emailInvalid')
    .normalizeEmail(),

  body('additionalPhone')
    .optional()
    .trim()
    .matches(/^[+]?[\d\s\-()]+$/)
    .withMessage('validation.phoneInvalid')
    .isLength({ min: 8, max: 20 })
    .withMessage('validation.phoneLength'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('validation.notesTooLong'),

  body('meetingType')
    .notEmpty()
    .withMessage('validation.meetingTypeRequired')
    .isIn(['online', 'offline'])
    .withMessage('validation.meetingTypeInvalid'),

  body('meetingDate')
    .notEmpty()
    .withMessage('validation.meetingDateRequired')
    .isDate()
    .withMessage('validation.meetingDateInvalid')
    .custom((value) => {
      const date = new Date(value);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date < today) {
        throw new Error('validation.meetingDatePast');
      }
      return true;
    }),

  body('meetingTime')
    .notEmpty()
    .withMessage('validation.meetingTimeRequired')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('validation.meetingTimeInvalid'),

  body('meetingDuration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('validation.meetingDurationInvalid'),

  body('agentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.agentIdInvalid'),

  validate
];

/**
 * Assign agent validation
 */
const assignAgentValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.requestIdInvalid'),

  body('agentId')
    .notEmpty()
    .withMessage('validation.agentIdRequired')
    .isInt({ min: 1 })
    .withMessage('validation.agentIdInvalid'),

  validate
];

/**
 * Reassign agent validation
 */
const reassignAgentValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.requestIdInvalid'),

  body('newAgentId')
    .notEmpty()
    .withMessage('validation.agentIdRequired')
    .isInt({ min: 1 })
    .withMessage('validation.agentIdInvalid'),

  body('reason')
    .notEmpty()
    .withMessage('validation.reasonRequired')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('validation.reasonLength'),

  validate
];

/**
 * Approve request validation
 */
const approveRequestValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.requestIdInvalid'),

  body('serviceId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.serviceIdInvalid'),

  validate
];

/**
 * Reject request validation
 */
const rejectRequestValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.requestIdInvalid'),

  body('reason')
    .notEmpty()
    .withMessage('validation.reasonRequired')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('validation.reasonLength'),

  validate
];

/**
 * Complete request validation
 */
const completeRequestValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.requestIdInvalid'),

  validate
];

/**
 * Cancel request validation
 */
const cancelRequestValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.requestIdInvalid'),

  body('reason')
    .notEmpty()
    .withMessage('validation.reasonRequired')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('validation.reasonLength'),

  validate
];

/**
 * Update priority validation
 */
const updatePriorityValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.requestIdInvalid'),

  body('priority')
    .notEmpty()
    .withMessage('validation.priorityRequired')
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('validation.priorityInvalid'),

  validate
];

/**
 * Add admin notes validation
 */
const addAdminNotesValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.requestIdInvalid'),

  body('notes')
    .notEmpty()
    .withMessage('validation.notesRequired')
    .trim()
    .isLength({ min: 5, max: 5000 })
    .withMessage('validation.notesLength'),

  validate
];

/**
 * Get request by ID validation
 */
const getRequestValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.requestIdInvalid'),

  validate
];

/**
 * Query parameters validation for listing
 */
const listRequestsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.pageInvalid'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('validation.limitInvalid'),

  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'completed', 'cancelled'])
    .withMessage('validation.statusInvalid'),

  query('categoryId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.categoryIdInvalid'),

  query('agentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.agentIdInvalid'),

  query('priority')
    .optional()
    .isIn(['low', 'normal', 'high', 'urgent'])
    .withMessage('validation.priorityInvalid'),

  validate
];

module.exports = {
  createRequestValidation,
  assignAgentValidation,
  reassignAgentValidation,
  approveRequestValidation,
  rejectRequestValidation,
  completeRequestValidation,
  cancelRequestValidation,
  updatePriorityValidation,
  addAdminNotesValidation,
  getRequestValidation,
  listRequestsValidation
};

