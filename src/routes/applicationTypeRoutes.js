const express = require('express');
const router = express.Router();
const applicationTypeController = require('@controllers/applicationTypeController');
const { authenticate, authorize } = require('@middleware/auth');
const { requirePermission } = require('@middleware/rbac');
const {
  createApplicationTypeValidation,
  updateApplicationTypeValidation,
  idParamValidation,
  queryFiltersValidation
} = require('@validators/applicationTypeValidator');

/**
 * @route   POST /api/application-types
 * @desc    Create new application type
 * @access  Private - Admin only with 'application_types.create' permission
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  requirePermission('application_types.create'),
  ...createApplicationTypeValidation,
  applicationTypeController.createApplicationType
);

/**
 * @route   GET /api/application-types/statistics
 * @desc    Get application types statistics
 * @access  Private - Admin only with 'application_types.view' permission
 */
router.get(
  '/statistics',
  authenticate,
  authorize('ADMIN'),
  requirePermission('application_types.view'),
  applicationTypeController.getStatistics
);

/**
 * @route   GET /api/application-types/active
 * @desc    Get all active application types (simple list)
 * @access  Public
 */
router.get(
  '/active',
  applicationTypeController.getActiveApplicationTypes
);

/**
 * @route   GET /api/application-types
 * @desc    Get all application types with pagination
 * @access  Public
 */
router.get(
  '/',
  ...queryFiltersValidation,
  applicationTypeController.getAllApplicationTypes
);

/**
 * @route   GET /api/application-types/:id/with-services
 * @desc    Get application type with all its services
 * @access  Public
 */
router.get(
  '/:id/with-services',
  ...idParamValidation,
  applicationTypeController.getApplicationTypeWithServices
);

/**
 * @route   GET /api/application-types/:id
 * @desc    Get application type by ID
 * @access  Public
 */
router.get(
  '/:id',
  ...idParamValidation,
  applicationTypeController.getApplicationTypeById
);

/**
 * @route   PATCH /api/application-types/:id
 * @desc    Update application type
 * @access  Private - Admin only with 'application_types.update' permission
 */
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission('application_types.update'),
  ...updateApplicationTypeValidation,
  applicationTypeController.updateApplicationType
);

/**
 * @route   PATCH /api/application-types/:id/activate
 * @desc    Activate application type
 * @access  Private - Admin only with 'application_types.update' permission
 */
router.patch(
  '/:id/activate',
  authenticate,
  authorize('ADMIN'),
  requirePermission('application_types.update'),
  ...idParamValidation,
  applicationTypeController.activateApplicationType
);

/**
 * @route   PATCH /api/application-types/:id/deactivate
 * @desc    Deactivate application type
 * @access  Private - Admin only with 'application_types.update' permission
 */
router.patch(
  '/:id/deactivate',
  authenticate,
  authorize('ADMIN'),
  requirePermission('application_types.update'),
  ...idParamValidation,
  applicationTypeController.deactivateApplicationType
);

/**
 * @route   DELETE /api/application-types/:id
 * @desc    Delete application type (soft delete)
 * @access  Private - Admin only with 'application_types.delete' permission
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission('application_types.delete'),
  ...idParamValidation,
  applicationTypeController.deleteApplicationType
);

/**
 * @route   POST /api/application-types/:id/restore
 * @desc    Restore soft deleted application type
 * @access  Private - Admin only with 'application_types.update' permission
 */
router.post(
  '/:id/restore',
  authenticate,
  authorize('ADMIN'),
  requirePermission('application_types.update'),
  ...idParamValidation,
  applicationTypeController.restoreApplicationType
);

module.exports = router;

