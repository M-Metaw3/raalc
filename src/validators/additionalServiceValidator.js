const { body, param, query } = require('express-validator');
const { validate } = require('@middleware/validation');

/**
 * Validation for creating additional service
 */
const createAdditionalServiceValidation = [
  body('applicationTypeId')
    .notEmpty()
    .withMessage('validation.applicationTypeIdRequired')
    .isInt({ min: 1 })
    .withMessage('validation.invalidApplicationTypeId'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('validation.nameRequired')
    .isLength({ min: 2, max: 200 })
    .withMessage('validation.nameLength'),

  body('nameAr')
    .trim()
    .notEmpty()
    .withMessage('validation.nameArRequired')
    .isLength({ min: 2, max: 200 })
    .withMessage('validation.nameArLength'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('validation.descriptionLength'),

  body('descriptionAr')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('validation.descriptionArLength'),

  body('price')
    .notEmpty()
    .withMessage('validation.priceRequired')
    .isFloat({ min: 0.01 })
    .withMessage('validation.invalidPrice'),

  body('duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('validation.durationLength'),

  body('durationAr')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('validation.durationArLength'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('validation.iconLength'),

  body('image')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('validation.imageLength'),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('validation.invalidOrder'),

  body('isRequired')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidBoolean'),

  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidBoolean'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidBoolean'),

  body('requiredDocuments')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('validation.invalidJSON');
        }
      } else if (!Array.isArray(value)) {
        throw new Error('validation.invalidArray');
      }
      return true;
    }),

  body('steps')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('validation.invalidJSON');
        }
      } else if (!Array.isArray(value)) {
        throw new Error('validation.invalidArray');
      }
      return true;
    }),

  body('features')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('validation.invalidJSON');
        }
      } else if (!Array.isArray(value)) {
        throw new Error('validation.invalidArray');
      }
      return true;
    }),

  validate
];

/**
 * Validation for updating additional service
 */
const updateAdditionalServiceValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('validation.invalidId'),

  body('applicationTypeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.invalidApplicationTypeId'),

  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('validation.nameLength'),

  body('nameAr')
    .optional()
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('validation.nameArLength'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('validation.descriptionLength'),

  body('descriptionAr')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('validation.descriptionArLength'),

  body('price')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('validation.invalidPrice'),

  body('duration')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('validation.durationLength'),

  body('durationAr')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('validation.durationArLength'),

  body('icon')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('validation.iconLength'),

  body('image')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('validation.imageLength'),

  body('order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('validation.invalidOrder'),

  body('isRequired')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidBoolean'),

  body('isFeatured')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidBoolean'),

  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('validation.invalidBoolean'),

  body('requiredDocuments')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('validation.invalidJSON');
        }
      } else if (!Array.isArray(value)) {
        throw new Error('validation.invalidArray');
      }
      return true;
    }),

  body('steps')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('validation.invalidJSON');
        }
      } else if (!Array.isArray(value)) {
        throw new Error('validation.invalidArray');
      }
      return true;
    }),

  body('features')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (e) {
          throw new Error('validation.invalidJSON');
        }
      } else if (!Array.isArray(value)) {
        throw new Error('validation.invalidArray');
      }
      return true;
    }),

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
 * Validation for application type ID parameter
 */
const applicationTypeIdParamValidation = [
  param('applicationTypeId')
    .isInt({ min: 1 })
    .withMessage('validation.invalidApplicationTypeId'),

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

  query('applicationTypeId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('validation.invalidApplicationTypeId'),

  query('isActive')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('validation.invalidBoolean'),

  query('isFeatured')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('validation.invalidBoolean'),

  query('isRequired')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('validation.invalidBoolean'),

  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('validation.invalidPrice'),

  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('validation.invalidPrice'),

  query('orderBy')
    .optional()
    .isIn(['order', 'name', 'price', 'createdAt', 'updatedAt'])
    .withMessage('validation.invalidOrderBy'),

  query('orderDirection')
    .optional()
    .isIn(['ASC', 'DESC'])
    .withMessage('validation.invalidOrderDirection'),

  query('activeOnly')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('validation.invalidBoolean'),

  validate
];

module.exports = {
  createAdditionalServiceValidation,
  updateAdditionalServiceValidation,
  idParamValidation,
  applicationTypeIdParamValidation,
  queryFiltersValidation
};

