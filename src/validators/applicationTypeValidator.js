const { body, param, query } = require('express-validator');
const { validate } = require('@middleware/validation');

/**
 * Validation for creating application type
 */
const createApplicationTypeValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('validation.nameRequired')
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.nameLength')
    .matches(/^[a-zA-Z0-9\s\-]+$/)
    .withMessage('validation.nameFormatEnglish'),

  body('nameAr')
    .trim()
    .notEmpty()
    .withMessage('validation.nameArRequired')
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.nameArLength'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('validation.descriptionLength'),

  body('descriptionAr')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('validation.descriptionArLength'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('validation.iconLength'),

  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('validation.invalidColor'),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('validation.invalidOrder'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidBoolean'),

  validate
];

/**
 * Validation for updating application type
 */
const updateApplicationTypeValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.invalidId'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.nameLength')
    .matches(/^[a-zA-Z0-9\s\-]+$/)
    .withMessage('validation.nameFormatEnglish'),

  body('nameAr')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('validation.nameArLength'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('validation.descriptionLength'),

  body('descriptionAr')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('validation.descriptionArLength'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('validation.iconLength'),

  body('color')
    .optional()
    .trim()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('validation.invalidColor'),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('validation.invalidOrder'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidBoolean'),

  validate
];

/**
 * Validation for ID parameter
 */
const idParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.invalidId'),

  validate
];

/**
 * Validation for query filters
 */
const queryFiltersValidation = [
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
    .isLength({ max: 255 })
    .withMessage('validation.searchLength'),

  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('validation.invalidBoolean'),

  query('orderBy')
    .optional()
    .isIn(['order', 'name', 'createdAt', 'updatedAt'])
    .withMessage('validation.invalidOrderBy'),

  query('orderDirection')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('validation.invalidOrderDirection'),

  validate
];

module.exports = {
  createApplicationTypeValidation,
  updateApplicationTypeValidation,
  idParamValidation,
  queryFiltersValidation
};

