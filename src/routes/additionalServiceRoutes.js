const express = require('express');
const router = express.Router();
const additionalServiceController = require('@controllers/additionalServiceController');
const { authenticate, authorize } = require('@middleware/auth');
const { requirePermission } = require('@middleware/rbac');
const { wrapMulterUpload, logUpload } = require('@middleware/upload');
const UploadService = require('@services/UploadService');
const {
  createAdditionalServiceValidation,
  updateAdditionalServiceValidation,
  idParamValidation,
  applicationTypeIdParamValidation,
  queryFiltersValidation
} = require('@validators/additionalServiceValidator');

/**
 * @route   POST /api/additional-services
 * @desc    Create new additional service
 * @access  Private - Admin only with 'additional_services.create' permission
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  requirePermission('additional_services.create'),
  ...createAdditionalServiceValidation,
  additionalServiceController.createService
);

/**
 * @route   GET /api/additional-services/statistics
 * @desc    Get additional services statistics
 * @access  Private - Admin only with 'additional_services.view' permission
 */
router.get(
  '/statistics',
  authenticate,
  authorize('ADMIN'),
  requirePermission('additional_services.view'),
  additionalServiceController.getStatistics
);

/**
 * @route   GET /api/additional-services/featured
 * @desc    Get featured services
 * @access  Public
 */
router.get(
  '/featured',
  queryFiltersValidation,
  additionalServiceController.getFeaturedServices
);

/**
 * @route   GET /api/additional-services
 * @desc    Get all additional services with pagination
 * @access  Public
 */
router.get(
  '/',
  ...queryFiltersValidation,
  additionalServiceController.getAllServices
);

/**
 * @route   GET /api/application-types/:applicationTypeId/services/statistics
 * @desc    Get services statistics for a specific application type
 * @access  Private - Admin only
 */
router.get(
  '/application-types/:applicationTypeId/statistics',
  authenticate,
  authorize('ADMIN'),
  requirePermission('additional_services.view'),
  ...applicationTypeIdParamValidation,
  additionalServiceController.getStatisticsByType
);

/**
 * @route   GET /api/application-types/:applicationTypeId/services
 * @desc    Get all services for a specific application type
 * @access  Public
 */
router.get(
  '/application-types/:applicationTypeId',
  ...applicationTypeIdParamValidation,
  ...queryFiltersValidation,
  additionalServiceController.getServicesByApplicationType
);

/**
 * @route   GET /api/additional-services/:id
 * @desc    Get additional service by ID
 * @access  Public
 */
router.get(
  '/:id',
  ...idParamValidation,
  additionalServiceController.getServiceById
);

/**
 * @route   PATCH /api/additional-services/:id
 * @desc    Update additional service
 * @access  Private - Admin only with 'additional_services.update' permission
 */
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission('additional_services.update'),
  ...updateAdditionalServiceValidation,
  additionalServiceController.updateService
);

/**
 * @route   PATCH /api/additional-services/:id/activate
 * @desc    Activate additional service
 * @access  Private - Admin only with 'additional_services.update' permission
 */
router.patch(
  '/:id/activate',
  authenticate,
  authorize('ADMIN'),
  requirePermission('additional_services.update'),
  ...idParamValidation,
  additionalServiceController.activateService
);

/**
 * @route   PATCH /api/additional-services/:id/deactivate
 * @desc    Deactivate additional service
 * @access  Private - Admin only with 'additional_services.update' permission
 */
router.patch(
  '/:id/deactivate',
  authenticate,
  authorize('ADMIN'),
  requirePermission('additional_services.update'),
  ...idParamValidation,
  additionalServiceController.deactivateService
);

/**
 * @route   POST /api/additional-services/:id/image
 * @desc    Upload service image
 * @access  Private - Admin only with 'additional_services.update' permission
 */
router.post(
  '/:id/image',
  authenticate,
  authorize('ADMIN'),
  requirePermission('additional_services.update'),
  ...idParamValidation,
  wrapMulterUpload(UploadService.uploadSingle('image', 'additional-services')),
  logUpload,
  additionalServiceController.uploadImage
);

/**
 * @route   DELETE /api/additional-services/:id
 * @desc    Delete additional service (soft delete)
 * @access  Private - Admin only with 'additional_services.delete' permission
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission('additional_services.delete'),
  ...idParamValidation,
  additionalServiceController.deleteService
);

/**
 * @route   POST /api/additional-services/:id/restore
 * @desc    Restore soft deleted additional service
 * @access  Private - Admin only with 'additional_services.update' permission
 */
router.post(
  '/:id/restore',
  authenticate,
  authorize('ADMIN'),
  requirePermission('additional_services.update'),
  ...idParamValidation,
  additionalServiceController.restoreService
);

module.exports = router;

