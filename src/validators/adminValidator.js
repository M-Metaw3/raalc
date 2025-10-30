const { body, param, query } = require('express-validator');
const { validate } = require('@middleware/validation');

/**
 * Admin Validators
 * 
 * Validation rules for admin-related requests
 */

/**
 * Admin login validation
 */
const loginValidation = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('validation.emailRequired')
    .isEmail()
    .withMessage('validation.invalidEmail'),

  body('password')
    .notEmpty()
    .withMessage('validation.passwordRequired'),

  validate
];

/**
 * Create admin validation
 */
const createAdminValidation = [
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
    .withMessage('validation.invalidEmail'),

  body('password')
    .notEmpty()
    .withMessage('validation.passwordRequired')
    .isLength({ min: 8 })
    .withMessage('validation.passwordMinLength')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('validation.passwordStrength'),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('validation.invalidPhone'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidIsActive'),

  body('roleIds')
    .optional()
    .isArray()
    .withMessage('validation.invalidRoleIds'),

  body('roleIds.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.invalidRoleId'),

  validate
];

/**
 * Update profile validation
 */
const updateProfileValidation = [
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.firstNameLength'),

  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.lastNameLength'),

  body('phone')
    .optional()
    .trim()
    .isMobilePhone()
    .withMessage('validation.invalidPhone'),

  validate
];

/**
 * Change password validation
 */
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('validation.currentPasswordRequired'),

  body('newPassword')
    .notEmpty()
    .withMessage('validation.newPasswordRequired')
    .isLength({ min: 8 })
    .withMessage('validation.passwordMinLength')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('validation.passwordStrength')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('validation.newPasswordSameAsCurrent');
      }
      return true;
    }),

  body('confirmPassword')
    .notEmpty()
    .withMessage('validation.confirmPasswordRequired')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('validation.passwordsDoNotMatch');
      }
      return true;
    }),

  validate
];

/**
 * Admin ID parameter validation
 */
const adminIdValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('validation.adminIdRequired')
    .isInt({ min: 1 })
    .withMessage('validation.invalidAdminId'),

  validate
];

/**
 * Set admin status validation
 */
const setStatusValidation = [
  ...adminIdValidation,

  body('isActive')
    .notEmpty()
    .withMessage('validation.isActiveRequired')
    .isBoolean()
    .withMessage('validation.invalidIsActive'),

  validate
];

/**
 * Assign roles validation
 */
const assignRolesValidation = [
  ...adminIdValidation,

  body('roleIds')
    .notEmpty()
    .withMessage('validation.roleIdsRequired')
    .isArray({ min: 1 })
    .withMessage('validation.roleIdsMinLength'),

  body('roleIds.*')
    .isInt({ min: 1 })
    .withMessage('validation.invalidRoleId'),

  validate
];

/**
 * Refresh token validation
 */
const refreshTokenValidation = [
  body('refreshToken')
    .trim()
    .notEmpty()
    .withMessage('validation.refreshTokenRequired'),

  validate
];

/**
 * Query filters validation
 */
const queryFiltersValidation = [
  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('validation.invalidIsActive'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.searchLength'),

  validate
];

module.exports = {
  loginValidation,
  createAdminValidation,
  updateProfileValidation,
  changePasswordValidation,
  adminIdValidation,
  setStatusValidation,
  assignRolesValidation,
  refreshTokenValidation,
  queryFiltersValidation
};

