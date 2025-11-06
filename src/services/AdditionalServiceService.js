const AdditionalServiceRepository = require('@repositories/AdditionalServiceRepository');
const ApplicationTypeRepository = require('@repositories/ApplicationTypeRepository');
const { ErrorHandlers } = require('@utils/ErrorHandler');
const logger = require('@utils/logger');
const fs = require('fs');
const path = require('path');

class AdditionalServiceService {
  /**
   * Create new additional service
   */
  async createService(serviceData, createdBy) {
    try {
      // Validate application type exists
      const applicationType = await ApplicationTypeRepository.findById(serviceData.applicationTypeId);
      if (!applicationType) {
        throw ErrorHandlers.notFound('applicationType.notFound');
      }

      // Check name uniqueness within application type
      const existingService = await AdditionalServiceRepository.findByNameInType(
        serviceData.name,
        serviceData.applicationTypeId
      );

      if (existingService) {
        throw ErrorHandlers.conflict('additionalService.alreadyExistsInType');
      }

      // Validate price (must be positive)
      if (serviceData.price <= 0) {
        throw ErrorHandlers.badRequest('additionalService.invalidPrice');
      }

      // Parse JSON fields if they're strings
      if (serviceData.requiredDocuments && typeof serviceData.requiredDocuments === 'string') {
        try {
          serviceData.requiredDocuments = JSON.parse(serviceData.requiredDocuments);
        } catch (e) {
          throw ErrorHandlers.badRequest('additionalService.invalidDocumentsFormat');
        }
      }

      if (serviceData.steps && typeof serviceData.steps === 'string') {
        try {
          serviceData.steps = JSON.parse(serviceData.steps);
        } catch (e) {
          throw ErrorHandlers.badRequest('additionalService.invalidStepsFormat');
        }
      }

      if (serviceData.features && typeof serviceData.features === 'string') {
        try {
          serviceData.features = JSON.parse(serviceData.features);
        } catch (e) {
          throw ErrorHandlers.badRequest('additionalService.invalidFeaturesFormat');
        }
      }

      // Convert JSON to string for storage
      if (serviceData.requiredDocuments) {
        serviceData.requiredDocuments = JSON.stringify(serviceData.requiredDocuments);
      }
      if (serviceData.steps) {
        serviceData.steps = JSON.stringify(serviceData.steps);
      }
      if (serviceData.features) {
        serviceData.features = JSON.stringify(serviceData.features);
      }

      // Create service
      const service = await AdditionalServiceRepository.create({
        ...serviceData,
        createdBy
      });

      logger.info(`Additional service created: ${service.name}`, {
        id: service.id,
        applicationTypeId: service.applicationTypeId,
        createdBy
      });

      return service;
    } catch (error) {
      logger.error('Error creating additional service:', error);
      throw error;
    }
  }

  /**
   * Get service by ID
   */
  async getServiceById(id) {
    const service = await AdditionalServiceRepository.findById(id);

    if (!service) {
      throw ErrorHandlers.notFound('additionalService.notFound');
    }

    // Parse JSON fields
    if (service.requiredDocuments) {
      try {
        service.requiredDocuments = JSON.parse(service.requiredDocuments);
      } catch (e) {
        service.requiredDocuments = [];
      }
    }

    if (service.steps) {
      try {
        service.steps = JSON.parse(service.steps);
      } catch (e) {
        service.steps = [];
      }
    }

    if (service.features) {
      try {
        service.features = JSON.parse(service.features);
      } catch (e) {
        service.features = [];
      }
    }

    return service;
  }

  /**
   * Get all services
   */
  async getAllServices(filters) {
    const result = await AdditionalServiceRepository.findAll(filters);

    // Parse JSON fields for each service
    result.services = result.services.map(service => {
      if (service.requiredDocuments) {
        try {
          service.requiredDocuments = JSON.parse(service.requiredDocuments);
        } catch (e) {
          service.requiredDocuments = [];
        }
      }

      if (service.steps) {
        try {
          service.steps = JSON.parse(service.steps);
        } catch (e) {
          service.steps = [];
        }
      }

      if (service.features) {
        try {
          service.features = JSON.parse(service.features);
        } catch (e) {
          service.features = [];
        }
      }

      return service;
    });

    return result;
  }

  /**
   * Get services by application type
   */
  async getServicesByApplicationType(applicationTypeId, activeOnly = false) {
    // Check if application type exists
    const applicationType = await ApplicationTypeRepository.findById(applicationTypeId);
    if (!applicationType) {
      throw ErrorHandlers.notFound('applicationType.notFound');
    }

    const services = await AdditionalServiceRepository.findByApplicationType(applicationTypeId, activeOnly);

    // Parse JSON fields
    return services.map(service => {
      if (service.requiredDocuments) {
        try {
          service.requiredDocuments = JSON.parse(service.requiredDocuments);
        } catch (e) {
          service.requiredDocuments = [];
        }
      }

      if (service.steps) {
        try {
          service.steps = JSON.parse(service.steps);
        } catch (e) {
          service.steps = [];
        }
      }

      if (service.features) {
        try {
          service.features = JSON.parse(service.features);
        } catch (e) {
          service.features = [];
        }
      }

      return service;
    });
  }

  /**
   * Get featured services
   */
  async getFeaturedServices(limit = 10) {
    const services = await AdditionalServiceRepository.findFeatured(limit);

    // Parse JSON fields
    return services.map(service => {
      if (service.requiredDocuments) {
        try {
          service.requiredDocuments = JSON.parse(service.requiredDocuments);
        } catch (e) {
          service.requiredDocuments = [];
        }
      }

      return service;
    });
  }

  /**
   * Update service
   */
  async updateService(id, updateData, updatedBy) {
    try {
      // Check if exists
      const existingService = await this.getServiceById(id);

      // If updating name, check uniqueness within application type
      const applicationTypeId = updateData.applicationTypeId || existingService.applicationTypeId;

      if (updateData.name && updateData.name !== existingService.name) {
        const duplicateName = await AdditionalServiceRepository.findByNameInType(
          updateData.name,
          applicationTypeId,
          id
        );

        if (duplicateName) {
          throw ErrorHandlers.conflict('additionalService.alreadyExistsInType');
        }
      }

      // If changing application type, validate it exists
      if (updateData.applicationTypeId && updateData.applicationTypeId !== existingService.applicationTypeId) {
        const newApplicationType = await ApplicationTypeRepository.findById(updateData.applicationTypeId);
        if (!newApplicationType) {
          throw ErrorHandlers.notFound('applicationType.notFound');
        }
      }

      // Validate price if provided
      if (updateData.price !== undefined && updateData.price <= 0) {
        throw ErrorHandlers.badRequest('additionalService.invalidPrice');
      }

      // Handle JSON fields
      if (updateData.requiredDocuments) {
        if (typeof updateData.requiredDocuments === 'string') {
          try {
            JSON.parse(updateData.requiredDocuments);
          } catch (e) {
            throw ErrorHandlers.badRequest('additionalService.invalidDocumentsFormat');
          }
        } else {
          updateData.requiredDocuments = JSON.stringify(updateData.requiredDocuments);
        }
      }

      if (updateData.steps) {
        if (typeof updateData.steps === 'string') {
          try {
            JSON.parse(updateData.steps);
          } catch (e) {
            throw ErrorHandlers.badRequest('additionalService.invalidStepsFormat');
          }
        } else {
          updateData.steps = JSON.stringify(updateData.steps);
        }
      }

      if (updateData.features) {
        if (typeof updateData.features === 'string') {
          try {
            JSON.parse(updateData.features);
          } catch (e) {
            throw ErrorHandlers.badRequest('additionalService.invalidFeaturesFormat');
          }
        } else {
          updateData.features = JSON.stringify(updateData.features);
        }
      }

      // Update
      const updated = await AdditionalServiceRepository.update(id, {
        ...updateData,
        updatedBy
      });

      logger.info(`Additional service updated: ${id}`, { updatedBy });

      return await this.getServiceById(id);
    } catch (error) {
      logger.error('Error updating additional service:', error);
      throw error;
    }
  }

  /**
   * Delete service (soft delete)
   */
  async deleteService(id) {
    try {
      // Check if exists
      await this.getServiceById(id);

      await AdditionalServiceRepository.softDelete(id);

      logger.info(`Additional service deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting additional service:', error);
      throw error;
    }
  }

  /**
   * Restore deleted service
   */
  async restoreService(id) {
    try {
      const restored = await AdditionalServiceRepository.restore(id);

      if (!restored) {
        throw ErrorHandlers.notFound('additionalService.notFound');
      }

      logger.info(`Additional service restored: ${id}`);

      return await this.getServiceById(id);
    } catch (error) {
      logger.error('Error restoring additional service:', error);
      throw error;
    }
  }

  /**
   * Activate/Deactivate service
   */
  async toggleStatus(id, isActive, updatedBy) {
    try {
      await this.getServiceById(id);

      const updated = await AdditionalServiceRepository.update(id, {
        isActive,
        updatedBy
      });

      logger.info(`Additional service status changed: ${id} -> ${isActive}`, { updatedBy });

      return await this.getServiceById(id);
    } catch (error) {
      logger.error('Error toggling additional service status:', error);
      throw error;
    }
  }

  /**
   * Upload service image
   */
  async uploadImage(id, imagePath) {
    try {
      // Check if service exists
      const service = await this.getServiceById(id);

      // Delete old image if exists
      if (service.image) {
        const oldImagePath = path.join(__dirname, '../../', service.image);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }

      // Update image path
      const updated = await AdditionalServiceRepository.updateImage(id, imagePath);

      logger.info(`Additional service image uploaded: ${id}`);

      return await this.getServiceById(id);
    } catch (error) {
      logger.error('Error uploading additional service image:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    return await AdditionalServiceRepository.getStatistics();
  }

  /**
   * Get statistics by application type
   */
  async getStatisticsByType(applicationTypeId) {
    // Check if application type exists
    const applicationType = await ApplicationTypeRepository.findById(applicationTypeId);
    if (!applicationType) {
      throw ErrorHandlers.notFound('applicationType.notFound');
    }

    return await AdditionalServiceRepository.getStatisticsByType(applicationTypeId);
  }
}

module.exports = new AdditionalServiceService();

