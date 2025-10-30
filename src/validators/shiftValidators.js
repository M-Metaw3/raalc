const { body, param, query } = require('express-validator');
const { validate } = require('@middleware/validation');

/**
 * Shift Validators
 * 
 * Validation rules for shift-related operations
 */

/**
 * Check-in validation
 */
exports.checkInValidation = [
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),
  body('location.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('location.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  validate
];

/**
 * Check-out validation
 */
exports.checkOutValidation = [
  body('location')
    .optional()
    .isObject()
    .withMessage('Location must be an object'),
  body('location.lat')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Invalid latitude'),
  body('location.lng')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Invalid longitude'),
  validate
];

/**
 * Break request validation
 */
exports.breakRequestValidation = [
  body('type')
    .notEmpty()
    .withMessage('Break type is required')
    .isIn(['short', 'lunch', 'emergency'])
    .withMessage('Invalid break type. Must be: short, lunch, or emergency'),
  body('requestedDuration')
    .notEmpty()
    .withMessage('Requested duration is required')
    .isInt({ min: 5, max: 120 })
    .withMessage('Duration must be between 5 and 120 minutes'),
  body('reason')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
  validate
];

/**
 * Break approval validation
 */
exports.breakApprovalValidation = [
  param('id')
    .notEmpty()
    .withMessage('Break request ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid break request ID'),
  body('notes')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must not exceed 500 characters'),
  validate
];

/**
 * Break rejection validation
 */
exports.breakRejectionValidation = [
  param('id')
    .notEmpty()
    .withMessage('Break request ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid break request ID'),
  body('reason')
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isString()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Reason must be between 10 and 500 characters'),
  validate
];

/**
 * Session ID param validation
 */
exports.sessionIdValidation = [
  param('sessionId')
    .notEmpty()
    .withMessage('Session ID is required')
    .isInt({ min: 1 })
    .withMessage('Invalid session ID'),
  validate
];

/**
 * Date range validation
 */
exports.dateRangeValidation = [
  query('startDate')
    .optional()
    .isDate()
    .withMessage('Invalid start date format (YYYY-MM-DD)'),
  query('endDate')
    .optional()
    .isDate()
    .withMessage('Invalid end date format (YYYY-MM-DD)'),
  validate
];

/**
 * Session filters validation
 */
exports.sessionFiltersValidation = [
  query('startDate')
    .optional()
    .isDate()
    .withMessage('Invalid start date'),
  query('endDate')
    .optional()
    .isDate()
    .withMessage('Invalid end date'),
  query('agentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid agent ID'),
  query('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid department ID'),
  query('status')
    .optional()
    .isIn(['active', 'on_break', 'completed', 'incomplete'])
    .withMessage('Invalid status'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid page number'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Invalid limit (1-100)'),
  validate
];

/**
 * Pending requests filters validation
 */
exports.pendingRequestsFiltersValidation = [
  query('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid department ID'),
  query('agentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Invalid agent ID'),
  validate
];

