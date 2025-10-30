const { body, param } = require('express-validator');
const { validate } = require('@middleware/validation');

/**
 * Authentication Validation Schemas
 * 
 * Uses express-validator for request validation with i18next integration
 * All validation error messages use translation keys for multi-language support
 */

/**
 * User Registration Validation
 * Regular users can self-register
 */
const registerUserValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('validation.fullNameRequired')
    .isLength({ min: 2, max: 200 })
    .withMessage('validation.fullNameLength'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('validation.emailRequired')
    .isEmail()
    .withMessage('validation.invalidEmail')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('validation.passwordRequired')
    .isLength({ min: 8 })
    .withMessage('validation.passwordMinLength')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('validation.passwordStrength'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('validation.passwordRequired')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('validation.passwordMismatch'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('validation.phoneRequired')
    .matches(/^(05\d{8}|9715\d{8})$/)
    .withMessage('validation.invalidPhone') // UAE phone format: 05XXXXXXXX or 9715XXXXXXXX
];

/**
 * Agent Registration Validation
 * Agents register but require admin approval
 */
const registerAgentValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('validation.fullNameRequired')
    .isLength({ min: 2, max: 200 })
    .withMessage('validation.fullNameLength'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('validation.required')
    .isEmail()
    .withMessage('validation.email')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('validation.required')
    .isLength({ min: 8 })
    .withMessage('validation.minLength')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('validation.passwordStrength'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('validation.required')
    .custom((value, { req }) => value === req.body.password)
    .withMessage('validation.passwordMismatch'),

  body('phone')
    .notEmpty()
    .withMessage('validation.required') // Phone is required for agents
    .trim()
    .matches(/^05\d{8}$/)
    .withMessage('validation.phoneNumber'),

  body('licenseNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('validation.maxLength'),

  body('agencyName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('validation.maxLength')
];

/**
 * Admin Creation Validation
 * Only admins can create other admins
 */
const createAdminValidation = [
  body('firstName')
    .trim()
    .notEmpty()
    .withMessage('validation.required')
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.minLength')
    .isAlpha('en-US', { ignore: ' ' })
    .withMessage('validation.alpha'),

  body('lastName')
    .trim()
    .notEmpty()
    .withMessage('validation.required')
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.minLength')
    .isAlpha('en-US', { ignore: ' ' })
    .withMessage('validation.alpha'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('validation.required')
    .isEmail()
    .withMessage('validation.email')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('validation.required')
    .isLength({ min: 8 })
    .withMessage('validation.minLength')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('validation.passwordStrength'),

  body('phone')
    .optional()
    .trim()
    .matches(/^05\d{8}$/)
    .withMessage('validation.phoneNumber')
];

/**
 * Login Validation
 * Supports login with email or phone number
 */
const loginValidation = [
  body('identifier')
    .trim()
    .notEmpty()
    .withMessage('validation.identifierRequired')
    .custom((value) => {
      // Check if it's a valid email or valid UAE phone number
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isPhone = /^(05\d{8}|9715\d{8})$/.test(value.replace(/\D/g, ''));
      
      if (!isEmail && !isPhone) {
        throw new Error('validation.invalidIdentifier');
      }
      return true;
    }),

  body('password')
    .notEmpty()
    .withMessage('validation.passwordRequired'),
  
  body('deviceId')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('validation.invalidDeviceId'),
  
  body('fcmToken')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('validation.invalidFcmToken'),
  
  validate
];

/**
 * Refresh Token Validation
 */
const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty()
    .withMessage('validation.required')
    .isString()
    .withMessage('validation.required')
];

/**
 * Email Verification Validation
 */
const verifyEmailValidation = [
  param('token')
    .notEmpty()
    .withMessage('validation.required')
    .isLength({ min: 64, max: 64 })
    .withMessage('validation.required')
];

/**
 * Change Password Validation
 */
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('validation.required'),

  body('newPassword')
    .notEmpty()
    .withMessage('validation.required')
    .isLength({ min: 8 })
    .withMessage('validation.minLength')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('validation.passwordStrength')
    .custom((value, { req }) => value !== req.body.currentPassword)
    .withMessage('New password must be different from current password'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('validation.required')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('validation.passwordMismatch')
];

/**
 * Approve Agent Validation
 */
const approveAgentValidation = [
  param('agentId')
    .notEmpty()
    .withMessage('validation.required')
    .isInt({ min: 1 })
    .withMessage('validation.numeric')
];

/**
 * Deactivate User Validation (used for user ID param)
 */
const deactivateUserValidation = [
  param('userId')
    .notEmpty()
    .withMessage('validation.required')
    .isInt({ min: 1 })
    .withMessage('validation.numeric')
];

/**
 * Activate User Validation (used for user ID param)
 */
const activateUserValidation = [
  param('userId')
    .notEmpty()
    .withMessage('validation.required')
    .isInt({ min: 1 })
    .withMessage('validation.numeric')
];

/**
 * Agent ID Validation (for admin operations on agents)
 */
const agentIdValidation = [
  param('agentId')
    .notEmpty()
    .withMessage('validation.required')
    .isInt({ min: 1 })
    .withMessage('validation.numeric')
];

/**
 * Reject Agent Validation
 */
const rejectAgentValidation = [
  param('agentId')
    .notEmpty()
    .withMessage('validation.required')
    .isInt({ min: 1 })
    .withMessage('validation.numeric'),
  
  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('validation.maxLength')
];

/**
 * Update Agent Validation (by Admin or Agent self)
 */
const updateAgentValidation = [
  body('fullName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('validation.fullNameRequired')
    .isLength({ min: 2, max: 200 })
    .withMessage('validation.fullNameLength'),

  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('validation.invalidEmail')
    .normalizeEmail(),

  body('phone')
    .optional()
    .trim()
    .matches(/^(05\d{8})$/)
    .withMessage('validation.invalidPhone'),
    
  body('licenseNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('validation.maxLength'),
    
  body('agencyName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('validation.maxLength'),
    
  body('shiftId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.numeric'),
    
  body('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.numeric'),
    
  body('featured')
    .optional()
    .isBoolean()
    .withMessage('validation.boolean'),
    
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('validation.boolean')
];

/**
 * Create Agent Validation (Admin only)
 */
const createAgentValidation = [
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('validation.fullNameRequired')
    .isLength({ min: 2, max: 200 })
    .withMessage('validation.fullNameLength'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('validation.required')
    .isEmail()
    .withMessage('validation.invalidEmail')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('validation.required')
    .matches(/^(05\d{8})$/)
    .withMessage('validation.invalidPhone'),

  body('password')
    .notEmpty()
    .withMessage('validation.passwordRequired')
    .isLength({ min: 8 })
    .withMessage('validation.passwordMinLength')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/)
    .withMessage('validation.passwordStrength'),
    
  body('shiftId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.numeric'),
    
  body('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.numeric'),
    
  body('licenseNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('validation.maxLength'),
    
  body('agencyName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('validation.maxLength')
];

module.exports = {
  registerUserValidation,
  registerAgentValidation,
  createAdminValidation,
  loginValidation,
  refreshTokenValidation,
  verifyEmailValidation,
  changePasswordValidation,
  approveAgentValidation,
  rejectAgentValidation,
  deactivateUserValidation,
  activateUserValidation,
  updateAgentValidation,
  createAgentValidation
};

