const express = require('express');
const router = express.Router();
const serviceController = require('@controllers/serviceController');
const { authenticate, authorize } = require('@middleware/auth');
const { requirePermission } = require('@middleware/rbac');
const { wrapMulterUpload, logUpload } = require('@middleware/upload');
const UploadService = require('@services/UploadService');
const {
  createServiceValidation,
  updateServiceValidation,
  serviceIdValidation,
  listServicesValidation,
  departmentIdParamValidation
} = require('@validators/serviceValidator');

/**
 * @route   GET /api/services/stats
 * @desc    Get service statistics
 * @access  Private - Admin with permission
 */
router.get(
  '/stats',
  authenticate,
  authorize('ADMIN'),
  requirePermission('view_departments'), // using same permission as departments
  serviceController.getStatistics
);

/**
 * @route   POST /api/services
 * @desc    Create new service
 * @access  Private - Admin with create_departments permission
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  requirePermission('create_departments'),
  ...createServiceValidation,
  serviceController.createService
);

/**
 * @route   GET /api/services
 * @desc    Get all services
 * @access  Public/Private - Public sees active only, Agents/Admins can see all
 */
router.get(
  '/',
  ...listServicesValidation,
  serviceController.getAllServices
);

/**
 * @route   GET /api/services/:id
 * @desc    Get service by ID
 * @access  Public/Private - Public sees active only
 */
router.get(
  '/:id',
  ...serviceIdValidation,
  serviceController.getServiceById
);

/**
 * @route   PATCH /api/services/:id
 * @desc    Update service
 * @access  Private - Admin with update_departments permission
 */
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission('update_departments'),
  ...updateServiceValidation,
  serviceController.updateService
);

/**
 * @route   DELETE /api/services/:id
 * @desc    Delete service (soft delete)
 * @access  Private - Admin with delete_departments permission
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission('delete_departments'),
  ...serviceIdValidation,
  serviceController.deleteService
);

/**
 * @route   PATCH /api/services/:id/activate
 * @desc    Activate service
 * @access  Private - Admin with update_departments permission
 */
router.patch(
  '/:id/activate',
  authenticate,
  authorize('ADMIN'),
  requirePermission('update_departments'),
  ...serviceIdValidation,
  serviceController.activateService
);

/**
 * @route   PATCH /api/services/:id/deactivate
 * @desc    Deactivate service
 * @access  Private - Admin with update_departments permission
 */
router.patch(
  '/:id/deactivate',
  authenticate,
  authorize('ADMIN'),
  requirePermission('update_departments'),
  ...serviceIdValidation,
  serviceController.deactivateService
);

/**
 * @route   POST /api/services/:id/image
 * @desc    Upload service image
 * @access  Private - Admin with update_departments permission
 */
router.post(
  '/:id/image',
  authenticate,
  authorize('ADMIN'),
  requirePermission('update_departments'),
  ...serviceIdValidation,
  wrapMulterUpload(UploadService.uploadSingle('ADMIN', 'services')),
  logUpload,
  serviceController.uploadServiceImage
);

module.exports = router;

