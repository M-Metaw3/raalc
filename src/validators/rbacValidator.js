const { body, param, query } = require('express-validator');
const { validate } = require('@middleware/validation');

/**
 * RBAC Validators
 * 
 * Validation rules for role and permission management
 */

/**
 * Create role validation
 */
const createRoleValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('validation.roleNameRequired')
    .isLength({ min: 2, max: 50 })
    .withMessage('validation.roleNameLength'),

  body('slug')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('validation.roleSlugLength')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('validation.invalidRoleSlug'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('validation.descriptionLength'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidIsActive'),

  validate
];

/**
 * Update role validation
 */
const updateRoleValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('validation.roleIdRequired')
    .isInt({ min: 1 })
    .withMessage('validation.invalidRoleId'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('validation.roleNameLength'),

  body('slug')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('validation.roleSlugLength')
    .matches(/^[a-z0-9-]+$/)
    .withMessage('validation.invalidRoleSlug'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('validation.descriptionLength'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidIsActive'),

  validate
];

/**
 * Role ID parameter validation
 */
const roleIdValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('validation.roleIdRequired')
    .isInt({ min: 1 })
    .withMessage('validation.invalidRoleId'),

  validate
];

/**
 * Assign permissions validation
 */
const assignPermissionsValidation = [
  param('id')
    .trim()
    .notEmpty()
    .withMessage('validation.roleIdRequired')
    .isInt({ min: 1 })
    .withMessage('validation.invalidRoleId'),

  body('permissionIds')
    .notEmpty()
    .withMessage('validation.permissionIdsRequired')
    .isArray({ min: 1 })
    .withMessage('validation.permissionIdsMinLength'),

  body('permissionIds.*')
    .isInt({ min: 1 })
    .withMessage('validation.invalidPermissionId'),

  validate
];

/**
 * Create permission validation
 */
const createPermissionValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('validation.permissionNameRequired')
    .isLength({ min: 3, max: 100 })
    .withMessage('validation.permissionNameLength')
    .matches(/^[a-z]+\.[a-z]+$/)
    .withMessage('validation.invalidPermissionFormat'),

  body('resource')
    .trim()
    .notEmpty()
    .withMessage('validation.resourceRequired')
    .isLength({ min: 2, max: 50 })
    .withMessage('validation.resourceLength'),

  body('action')
    .trim()
    .notEmpty()
    .withMessage('validation.actionRequired')
    .isLength({ min: 2, max: 50 })
    .withMessage('validation.actionLength'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('validation.descriptionLength'),

  body('group')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('validation.groupLength'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidIsActive'),

  validate
];

/**
 * Query filters validation
 */
const permissionsQueryValidation = [
  query('groupBy')
    .optional()
    .isIn(['group', 'resource'])
    .withMessage('validation.invalidGroupBy'),

  validate
];

/**
 * Remove permission from role validation
 */
const removePermissionValidation = [
  param('roleId')
    .trim()
    .notEmpty()
    .withMessage('validation.roleIdRequired')
    .isInt({ min: 1 })
    .withMessage('validation.invalidRoleId'),

  param('permissionId')
    .trim()
    .notEmpty()
    .withMessage('validation.permissionIdRequired')
    .isInt({ min: 1 })
    .withMessage('validation.invalidPermissionId'),

  validate
];

module.exports = {
  createRoleValidation,
  updateRoleValidation,
  roleIdValidation,
  assignPermissionsValidation,
  createPermissionValidation,
  permissionsQueryValidation,
  removePermissionValidation
};

