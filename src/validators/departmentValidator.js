const { body, param, query } = require('express-validator');
const { validate } = require('@middleware/validation');

/**
 * Validation for creating department
 */
const createDepartmentValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('validation.nameRequired')
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.nameLength')
    .matches(/^[a-zA-Z0-9\s\-]+$/)
    .withMessage('validation.nameEnglishOnly'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('validation.descriptionLength'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidBoolean'),

  validate
];

/**
 * Validation for updating department
 */
const updateDepartmentValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.invalidId'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('validation.nameRequired')
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.nameLength')
    .matches(/^[a-zA-Z0-9\s\-]+$/)
    .withMessage('validation.nameEnglishOnly'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('validation.descriptionLength'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidBoolean'),

  validate
];

/**
 * Validation for department ID parameter
 */
const departmentIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.invalidId'),

  validate
];

/**
 * Validation for listing departments
 */
const listDepartmentsValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.invalidPage'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('validation.invalidLimit'),

  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('validation.searchLength'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidBoolean'),

  query('sortBy')
    .optional()
    .isIn(['name', 'createdAt', 'updatedAt'])
    .withMessage('validation.invalidSortField'),

  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('validation.invalidSortOrder'),

  validate
];

module.exports = {
  createDepartmentValidation,
  updateDepartmentValidation,
  departmentIdValidation,
  listDepartmentsValidation
};

