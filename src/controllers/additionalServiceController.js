const AdditionalServiceService = require('@services/AdditionalServiceService');

class AdditionalServiceController {
  /**
   * Create new additional service
   * POST /api/additional-services
   */
  async createService(req, res, next) {
    try {
      const serviceData = req.body;
      const createdBy = req.user.id;

      const service = await AdditionalServiceService.createService(serviceData, createdBy);

      res.status(201).json({
        ok: true,
        message: req.t('additionalService.created'),
        messageKey: 'additionalService.created',
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all services
   * GET /api/additional-services
   */
  async getAllServices(req, res, next) {
    try {
      const filters = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20,
        search: req.query.search || '',
        applicationTypeId: req.query.applicationTypeId ? parseInt(req.query.applicationTypeId) : undefined,
        isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
        isFeatured: req.query.isFeatured !== undefined ? req.query.isFeatured === 'true' : undefined,
        isRequired: req.query.isRequired !== undefined ? req.query.isRequired === 'true' : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
        orderBy: req.query.orderBy || 'order',
        orderDirection: req.query.orderDirection || 'ASC'
      };

      const result = await AdditionalServiceService.getAllServices(filters);

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
   * Get services by application type
   * GET /api/application-types/:applicationTypeId/services
   */
  async getServicesByApplicationType(req, res, next) {
    try {
      const applicationTypeId = parseInt(req.params.applicationTypeId);
      const activeOnly = req.query.activeOnly === 'true';

      const services = await AdditionalServiceService.getServicesByApplicationType(applicationTypeId, activeOnly);

      res.json({
        ok: true,
        message: req.t('success.retrieved'),
        messageKey: 'success.retrieved',
        data: { services, count: services.length }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get featured services
   * GET /api/additional-services/featured
   */
  async getFeaturedServices(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 10;

      const services = await AdditionalServiceService.getFeaturedServices(limit);

      res.json({
        ok: true,
        message: req.t('success.retrieved'),
        messageKey: 'success.retrieved',
        data: { services, count: services.length }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get service by ID
   * GET /api/additional-services/:id
   */
  async getServiceById(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const service = await AdditionalServiceService.getServiceById(id);

      res.json({
        ok: true,
        message: req.t('success.retrieved'),
        messageKey: 'success.retrieved',
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update service
   * PATCH /api/additional-services/:id
   */
  async updateService(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const updateData = req.body;
      const updatedBy = req.user.id;

      const service = await AdditionalServiceService.updateService(id, updateData, updatedBy);

      res.json({
        ok: true,
        message: req.t('additionalService.updated'),
        messageKey: 'additionalService.updated',
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete service
   * DELETE /api/additional-services/:id
   */
  async deleteService(req, res, next) {
    try {
      const id = parseInt(req.params.id);

      await AdditionalServiceService.deleteService(id);

      res.json({
        ok: true,
        message: req.t('additionalService.deleted'),
        messageKey: 'additionalService.deleted',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restore service
   * POST /api/additional-services/:id/restore
   */
  async restoreService(req, res, next) {
    try {
      const id = parseInt(req.params.id);

      const service = await AdditionalServiceService.restoreService(id);

      res.json({
        ok: true,
        message: req.t('additionalService.restored'),
        messageKey: 'additionalService.restored',
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate service
   * PATCH /api/additional-services/:id/activate
   */
  async activateService(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const updatedBy = req.user.id;

      const service = await AdditionalServiceService.toggleStatus(id, true, updatedBy);

      res.json({
        ok: true,
        message: req.t('additionalService.activated'),
        messageKey: 'additionalService.activated',
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate service
   * PATCH /api/additional-services/:id/deactivate
   */
  async deactivateService(req, res, next) {
    try {
      const id = parseInt(req.params.id);
      const updatedBy = req.user.id;

      const service = await AdditionalServiceService.toggleStatus(id, false, updatedBy);

      res.json({
        ok: true,
        message: req.t('additionalService.deactivated'),
        messageKey: 'additionalService.deactivated',
        data: { service }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload service image
   * POST /api/additional-services/:id/image
   */
  async uploadImage(req, res, next) {
    try {
      const id = parseInt(req.params.id);

      if (!req.file) {
        throw ErrorHandlers.badRequest('errors.fileRequired');
      }

      const imagePath = `/${req.file.path.replace(/\\/g, '/')}`;
      const service = await AdditionalServiceService.uploadImage(id, imagePath);

      res.json({
        ok: true,
        message: req.t('upload.success'),
        messageKey: 'upload.success',
        data: { service }
      });
    } catch (error) {
      // Cleanup file on error
      if (req.file) {
        const fs = require('fs');
        const path = require('path');
        const filePath = path.join(__dirname, '../../', req.file.path);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      next(error);
    }
  }

  /**
   * Get statistics
   * GET /api/additional-services/statistics
   */
  async getStatistics(req, res, next) {
    try {
      const statistics = await AdditionalServiceService.getStatistics();

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

  /**
   * Get statistics by application type
   * GET /api/application-types/:applicationTypeId/services/statistics
   */
  async getStatisticsByType(req, res, next) {
    try {
      const applicationTypeId = parseInt(req.params.applicationTypeId);

      const statistics = await AdditionalServiceService.getStatisticsByType(applicationTypeId);

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

module.exports = new AdditionalServiceController();

