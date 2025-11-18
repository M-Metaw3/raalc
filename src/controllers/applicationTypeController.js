const ApplicationTypeService = require('@services/ApplicationTypeService');

class ApplicationTypeController {
  /**
   * Create new application type
   * POST /api/application-types
   */
  async createApplicationType(req, res, next) {
    try {
      const typeData = req.body;
      const createdBy = req.user.id;

      const applicationType = await ApplicationTypeService.createApplicationType(typeData, createdBy);

      res.status(201).json({
        ok: true,
        message: req.t('applicationType.created'),
        messageKey: 'applicationType.created',
        data: { applicationType }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all application types
   * GET /api/application-types
   * @query includeDeleted - Include soft deleted items (default: false)
   * @query deletedOnly - Show only deleted items (default: false)
   */
  async getAllApplicationTypes(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search || '',
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        includeDeleted: req.query.includeDeleted === 'true',
        deletedOnly: req.query.deletedOnly === 'true',
        orderBy: req.query.orderBy || 'order',
        orderDirection: req.query.orderDirection || 'ASC'
      };

      const result = await ApplicationTypeService.getAllApplicationTypes(filters);

      res.json({
        ok: true,
        message: req.t('success.retrieved'),
        messageKey: 'success.retrieved',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all active application types (simple list)
   * GET /api/application-types/active
   */
  async getActiveApplicationTypes(req, res, next) {
    try {
      const applicationTypes = await ApplicationTypeService.getActiveApplicationTypes();

      res.json({
        ok: true,
        message: req.t('success.retrieved'),
        messageKey: 'success.retrieved',
        data: { applicationTypes }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get application type by ID
   * GET /api/application-types/:id
   */
  async getApplicationTypeById(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const applicationType = await ApplicationTypeService.getApplicationTypeById(id);

      res.json({
        ok: true,
        message: req.t('success.retrieved'),
        messageKey: 'success.retrieved',
        data: { applicationType }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get application type with services
   * GET /api/application-types/:id/with-services
   */
  async getApplicationTypeWithServices(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const applicationType = await ApplicationTypeService.getApplicationTypeWithServices(id);

      res.json({
        ok: true,
        message: req.t('success.retrieved'),
        messageKey: 'success.retrieved',
        data: { applicationType }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update application type
   * PATCH /api/application-types/:id
   */
  async updateApplicationType(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const updatedBy = req.user.id;

      const applicationType = await ApplicationTypeService.updateApplicationType(id, updateData, updatedBy);

      res.json({
        ok: true,
        message: req.t('applicationType.updated'),
        messageKey: 'applicationType.updated',
        data: { applicationType }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete application type
   * DELETE /api/application-types/:id
   */
  async deleteApplicationType(req, res, next) {
    try {
      const id = parseInt(req.params.id);

      await ApplicationTypeService.deleteApplicationType(id);

      res.json({
        ok: true,
        message: req.t('applicationType.deleted'),
        messageKey: 'applicationType.deleted',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restore application type
   * POST /api/application-types/:id/restore
   */
  async restoreApplicationType(req, res, next) {
    try {
      const id = parseInt(req.params.id);

      const applicationType = await ApplicationTypeService.restoreApplicationType(id);

      res.json({
        ok: true,
        message: req.t('applicationType.restored'),
        messageKey: 'applicationType.restored',
        data: { applicationType }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate application type
   * PATCH /api/application-types/:id/activate
   */
  async activateApplicationType(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const updatedBy = req.user.id;

      const applicationType = await ApplicationTypeService.toggleStatus(id, true, updatedBy);

      res.json({
        ok: true,
        message: req.t('applicationType.activated'),
        messageKey: 'applicationType.activated',
        data: { applicationType }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate application type
   * PATCH /api/application-types/:id/deactivate
   */
  async deactivateApplicationType(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const updatedBy = req.user.id;

      const applicationType = await ApplicationTypeService.toggleStatus(id, false, updatedBy);

      res.json({
        ok: true,
        message: req.t('applicationType.deactivated'),
        messageKey: 'applicationType.deactivated',
        data: { applicationType }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get statistics
   * GET /api/application-types/statistics
   */
  async getStatistics(req, res, next) {
    try {
      const statistics = await ApplicationTypeService.getStatistics();

      res.json({
        ok: true,
        message: req.t('success.retrieved'),
        messageKey: 'success.retrieved',
        data: { statistics }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ApplicationTypeController();

