const ServiceService = require('@services/ServiceService');
const UploadService = require('@services/UploadService');

/**
 * Service Controller
 * Handles HTTP requests for service operations
 */
class ServiceController {
  /**
   * Create new service
   * POST /api/services
   */
  async createService(req, res, next) {
    try {
      const serviceData = req.body;
      const createdBy = req.admin?.id || req.user?.id;

      const service = await ServiceService.createService(serviceData, createdBy);

      res.status(201).json({
        ok: true,
        message: req.t('service.created'),
        messageKey: 'service.created',
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all services
   * GET /api/services
   */
  async getAllServices(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search || '',
        departmentId: req.query.departmentId ? parseInt(req.query.departmentId) : null,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : null,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
        sortBy: req.query.sortBy || 'createdAt',
        sortOrder: req.query.sortOrder || 'DESC'
      };

      const result = await ServiceService.getAllServices(filters);

      res.json({
        ok: true,
        message: req.t('service.listRetrieved'),
        messageKey: 'service.listRetrieved',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get service by ID
   * GET /api/services/:id
   */
  async getServiceById(req, res, next) {
    try {
      const serviceId = parseInt(req.params.id);
      const service = await ServiceService.getServiceById(serviceId);

      res.json({
        ok: true,
        message: req.t('service.retrieved'),
        messageKey: 'service.retrieved',
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get services by department
   * GET /api/departments/:departmentId/services
   */
  async getServicesByDepartment(req, res, next) {
    try {
      const departmentId = parseInt(req.params.departmentId);
      const includeInactive = req.query.includeInactive === 'true';

      const services = await ServiceService.getServicesByDepartment(
        departmentId,
        includeInactive
      );

      res.json({
        ok: true,
        message: req.t('service.listRetrieved'),
        messageKey: 'service.listRetrieved',
        data: { services, count: services.length }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update service
   * PATCH /api/services/:id
   */
  async updateService(req, res, next) {
    try {
      const serviceId = parseInt(req.params.id);
      const updateData = req.body;
      const updatedBy = req.admin?.id || req.user?.id;

      const service = await ServiceService.updateService(serviceId, updateData, updatedBy);

      res.json({
        ok: true,
        message: req.t('service.updated'),
        messageKey: 'service.updated',
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete service
   * DELETE /api/services/:id
   */
  async deleteService(req, res, next) {
    try {
      const serviceId = parseInt(req.params.id);
      const deletedBy = req.admin?.id || req.user?.id;

      await ServiceService.deleteService(serviceId, deletedBy);

      res.json({
        ok: true,
        message: req.t('service.deleted'),
        messageKey: 'service.deleted',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate service
   * PATCH /api/services/:id/activate
   */
  async activateService(req, res, next) {
    try {
      const serviceId = parseInt(req.params.id);
      const activatedBy = req.admin?.id || req.user?.id;

      const service = await ServiceService.activateService(serviceId, activatedBy);

      res.json({
        ok: true,
        message: req.t('service.activated'),
        messageKey: 'service.activated',
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate service
   * PATCH /api/services/:id/deactivate
   */
  async deactivateService(req, res, next) {
    try {
      const serviceId = parseInt(req.params.id);
      const deactivatedBy = req.admin?.id || req.user?.id;

      const service = await ServiceService.deactivateService(serviceId, deactivatedBy);

      res.json({
        ok: true,
        message: req.t('service.deactivated'),
        messageKey: 'service.deactivated',
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload service image
   * POST /api/services/:id/image
   */
  async uploadServiceImage(req, res, next) {
    try {
      const serviceId = parseInt(req.params.id);
      const uploadedBy = req.admin?.id || req.user?.id;

      if (!req.file) {
        throw ErrorHandlers.badRequest('errors.fileRequired');
      }

      const imagePath = `/${req.file.path.replace(/\\/g, '/')}`;
      const service = await ServiceService.uploadServiceImage(serviceId, imagePath, uploadedBy);

      res.json({
        ok: true,
        message: req.t('service.imageUploaded'),
        messageKey: 'service.imageUploaded',
        data: { service }
      });
    } catch (error) {
      // Cleanup on error
      if (req.file) {
        UploadService.cleanupFiles(req.file);
      }
      next(error);
    }
  }

  /**
   * Get service statistics
   * GET /api/services/stats
   */
  async getStatistics(req, res, next) {
    try {
      const stats = await ServiceService.getStatistics();

      res.json({
        ok: true,
        message: req.t('service.statsRetrieved'),
        messageKey: 'service.statsRetrieved',
        data: { stats }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ServiceController();

