const DepartmentService = require('@services/DepartmentService');

/**
 * Department Controller
 * Handles HTTP requests for department operations
 */
class DepartmentController {
  /**
   * Create new department
   * POST /api/departments
   */
  async createDepartment(req, res, next) {
    try {
      const departmentData = req.body;
      const createdBy = req.admin?.id || req.user?.id;

      const department = await DepartmentService.createDepartment(departmentData, createdBy);

      res.status(201).json({
        ok: true,
        message: req.t('department.created'),
        messageKey: 'department.created',
        data: { department }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all departments
   * GET /api/departments
   */
  async getAllDepartments(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search || '',
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : null,
        sortBy: req.query.sortBy || 'name',
        sortOrder: req.query.sortOrder || 'ASC'
      };

      const result = await DepartmentService.getAllDepartments(filters);

      res.json({
        ok: true,
        message: req.t('department.listRetrieved'),
        messageKey: 'department.listRetrieved',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get department by ID
   * GET /api/departments/:id
   */
  async getDepartmentById(req, res, next) {
    try {
      const departmentId = parseInt(req.params.id);
      const department = await DepartmentService.getDepartmentById(departmentId);

      res.json({
        ok: true,
        message: req.t('department.retrieved'),
        messageKey: 'department.retrieved',
        data: { department }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get department with all services
   * GET /api/departments/:id/services
   */
  async getDepartmentWithServices(req, res, next) {
    try {
      const departmentId = parseInt(req.params.id);
      const includeInactive = req.query.includeInactive === 'true';
      
      const department = await DepartmentService.getDepartmentWithServices(
        departmentId,
        includeInactive
      );

      res.json({
        ok: true,
        message: req.t('department.retrievedWithServices'),
        messageKey: 'department.retrievedWithServices',
        data: { department }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update department
   * PATCH /api/departments/:id
   */
  async updateDepartment(req, res, next) {
    try {
      const departmentId = parseInt(req.params.id);
      const updateData = req.body;
      const updatedBy = req.admin?.id || req.user?.id;

      const department = await DepartmentService.updateDepartment(
        departmentId,
        updateData,
        updatedBy
      );

      res.json({
        ok: true,
        message: req.t('department.updated'),
        messageKey: 'department.updated',
        data: { department }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete department
   * DELETE /api/departments/:id
   */
  async deleteDepartment(req, res, next) {
    try {
      const departmentId = parseInt(req.params.id);
      const deletedBy = req.admin?.id || req.user?.id;

      await DepartmentService.deleteDepartment(departmentId, deletedBy);

      res.json({
        ok: true,
        message: req.t('department.deleted'),
        messageKey: 'department.deleted',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate department
   * PATCH /api/departments/:id/activate
   */
  async activateDepartment(req, res, next) {
    try {
      const departmentId = parseInt(req.params.id);
      const activatedBy = req.admin?.id || req.user?.id;

      const department = await DepartmentService.activateDepartment(departmentId, activatedBy);

      res.json({
        ok: true,
        message: req.t('department.activated'),
        messageKey: 'department.activated',
        data: { department }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate department
   * PATCH /api/departments/:id/deactivate
   */
  async deactivateDepartment(req, res, next) {
    try {
      const departmentId = parseInt(req.params.id);
      const deactivatedBy = req.admin?.id || req.user?.id;

      const department = await DepartmentService.deactivateDepartment(departmentId, deactivatedBy);

      res.json({
        ok: true,
        message: req.t('department.deactivated'),
        messageKey: 'department.deactivated',
        data: { department }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get department statistics
   * GET /api/departments/stats
   */
  async getStatistics(req, res, next) {
    try {
      const stats = await DepartmentService.getStatistics();

      res.json({
        ok: true,
        message: req.t('department.statsRetrieved'),
        messageKey: 'department.statsRetrieved',
        data: { stats }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DepartmentController();

