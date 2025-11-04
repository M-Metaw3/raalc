const { body, param, query } = require('express-validator');
const { validate } = require('@middleware/validation');

/**
 * Validation for creating service
 */
const createServiceValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('validation.nameRequired')
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.nameLength'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('validation.descriptionLength'),

  body('price')
    .notEmpty()
    .withMessage('validation.priceRequired')
    .isFloat({ min: 0.01 })
    .withMessage('validation.pricePositive'),

  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.durationPositive'),

  body('departmentId')
    .notEmpty()
    .withMessage('validation.departmentIdRequired')
    .isInt({ min: 1 })
    .withMessage('validation.invalidDepartmentId'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidBoolean'),

  validate
];

/**
 * Validation for updating service
 */
const updateServiceValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.invalidId'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('validation.nameRequired')
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.nameLength'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('validation.descriptionLength'),

  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('validation.pricePositive'),

  body('duration')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.durationPositive'),

  body('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.invalidDepartmentId'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidBoolean'),

  validate
];

/**
 * Validation for service ID parameter
 */
const serviceIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.invalidId'),

  validate
];

/**
 * Validation for listing services
 */
const listServicesValidation = [
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

  query('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.invalidDepartmentId'),

  query('isActive')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidBoolean'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('validation.invalidPrice'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('validation.invalidPrice'),

  query('sortBy')
    .optional()
    .isIn(['name', 'price', 'duration', 'createdAt', 'updatedAt'])
    .withMessage('validation.invalidSortField'),

  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc'])
    .withMessage('validation.invalidSortOrder'),

  validate
];

/**
 * Validation for department ID parameter
 */
const departmentIdParamValidation = [
  param('departmentId')
    .isInt({ min: 1 })
    .withMessage('validation.invalidDepartmentId'),

  validate
];

module.exports = {
  createServiceValidation,
  updateServiceValidation,
  serviceIdValidation,
  listServicesValidation,
  departmentIdParamValidation
};

