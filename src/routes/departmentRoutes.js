const express = require('express');
const router = express.Router();
const departmentController = require('@controllers/departmentController');
const { authenticate, authorize } = require('@middleware/auth');
const { requirePermission } = require('@middleware/rbac');
const {
  createDepartmentValidation,
  updateDepartmentValidation,
  departmentIdValidation,
  listDepartmentsValidation
} = require('@validators/departmentValidator');

/**
 * @route   GET /api/departments/stats
 * @desc    Get department statistics
 * @access  Private - Admin with permission
 */
router.get(
  '/stats',
  authenticate,
  authorize('ADMIN'),
  requirePermission('view_departments'),
  departmentController.getStatistics
);

/**
 * @route   POST /api/departments
 * @desc    Create new department
 * @access  Private - Admin with create_departments permission
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  requirePermission('create_departments'),
  ...createDepartmentValidation,
  departmentController.createDepartment
);

/**
 * @route   GET /api/departments
 * @desc    Get all departments (Public - active only)
 * @access  Public
 */
router.get(
  '/',
  ...listDepartmentsValidation,
  departmentController.getAllDepartments
);

/**
 * @route   GET /api/departments/:id
 * @desc    Get department by ID
 * @access  Public
 */
router.get(
  '/:id',
  ...departmentIdValidation,
  departmentController.getDepartmentById
);

/**
 * @route   GET /api/departments/:id/services
 * @desc    Get department with all services
 * @access  Public (agents/admins can see inactive services with query param)
 */
router.get(
  '/:id/services',
  ...departmentIdValidation,
  departmentController.getDepartmentWithServices
);

/**
 * @route   PATCH /api/departments/:id
 * @desc    Update department
 * @access  Private - Admin with update_departments permission
 */
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission('update_departments'),
  ...updateDepartmentValidation,
  departmentController.updateDepartment
);

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete department (soft delete)
 * @access  Private - Admin with delete_departments permission
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission('delete_departments'),
  ...departmentIdValidation,
  departmentController.deleteDepartment
);

/**
 * @route   PATCH /api/departments/:id/activate
 * @desc    Activate department
 * @access  Private - Admin with update_departments permission
 */
router.patch(
  '/:id/activate',
  authenticate,
  authorize('ADMIN'),
  requirePermission('update_departments'),
  ...departmentIdValidation,
  departmentController.activateDepartment
);

/**
 * @route   PATCH /api/departments/:id/deactivate
 * @desc    Deactivate department
 * @access  Private - Admin with update_departments permission
 */
router.patch(
  '/:id/deactivate',
  authenticate,
  authorize('ADMIN'),
  requirePermission('update_departments'),
  ...departmentIdValidation,
  departmentController.deactivateDepartment
);

module.exports = router;

