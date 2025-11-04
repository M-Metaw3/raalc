const ServiceRepository = require('@repositories/ServiceRepository');
const DepartmentRepository = require('@repositories/DepartmentRepository');
const { ErrorHandlers } = require('@utils/ErrorHandler');
const { GENERAL_ERRORS } = require('@utils/ErrorCodes');
const logger = require('@utils/logger');

/**
 * Service Service
 * Handles business logic for services
 */
class ServiceService {
  /**
   * Create a new service
   */
  async createService(serviceData, createdBy) {
    try {
      // Check if department exists
      const department = await DepartmentRepository.findById(serviceData.departmentId);
      if (!department) {
        throw ErrorHandlers.notFound('department.notFound');
      }

      // Check if department is active
      if (!department.isActive) {
        throw ErrorHandlers.badRequest('department.inactive');
      }

      // Check if service name already exists in this department
      const existingService = await ServiceRepository.findByNameAndDepartment(
        serviceData.name,
        serviceData.departmentId
      );
      if (existingService) {
        throw ErrorHandlers.conflict('service.nameAlreadyExistsInDepartment');
      }

      // Validate price is positive
      if (serviceData.price <= 0) {
        throw ErrorHandlers.badRequest('service.pricePositive');
      }

      // Create service
      const service = await ServiceRepository.create({
        ...serviceData,
        isActive: serviceData.isActive !== undefined ? serviceData.isActive : true
      });

      logger.info(`Service created: ${service.name}`, {
        serviceId: service.id,
        departmentId: service.departmentId,
        createdBy
      });

      return service;
    } catch (error) {
      logger.error('Error creating service:', error);
      throw error;
    }
  }

  /**
   * Get all services with pagination and filters
   */
  async getAllServices(filters) {
    try {
      return await ServiceRepository.findAll(filters);
    } catch (error) {
      logger.error('Error getting services:', error);
      throw error;
    }
  }

  /**
   * Get service by ID
   */
  async getServiceById(serviceId) {
    try {
      const service = await ServiceRepository.findById(serviceId);

      if (!service) {
        throw ErrorHandlers.notFound('service.notFound');
      }

      return service;
    } catch (error) {
      logger.error('Error getting service by ID:', error);
      throw error;
    }
  }

  /**
   * Get services by department
   */
  async getServicesByDepartment(departmentId, includeInactive = false) {
    try {
      // Check if department exists
      const department = await DepartmentRepository.findById(departmentId);
      if (!department) {
        throw ErrorHandlers.notFound('department.notFound');
      }

      const services = await ServiceRepository.findByDepartmentId(
        departmentId,
        includeInactive
      );

      return services;
    } catch (error) {
      logger.error('Error getting services by department:', error);
      throw error;
    }
  }

  /**
   * Update service
   */
  async updateService(serviceId, updateData, updatedBy) {
    try {
      // Check if service exists
      const service = await ServiceRepository.findById(serviceId);
      if (!service) {
        throw ErrorHandlers.notFound('service.notFound');
      }

      // If department is being changed, check new department exists
      if (updateData.departmentId && updateData.departmentId !== service.departmentId) {
        const newDepartment = await DepartmentRepository.findById(updateData.departmentId);
        if (!newDepartment) {
          throw ErrorHandlers.notFound('department.notFound');
        }

        if (!newDepartment.isActive) {
          throw ErrorHandlers.badRequest('department.inactive');
        }

        // Check if name exists in new department
        const existingService = await ServiceRepository.findByNameAndDepartment(
          updateData.name || service.name,
          updateData.departmentId
        );
        if (existingService) {
          throw ErrorHandlers.conflict('service.nameAlreadyExistsInDepartment');
        }
      }

      // If name is being updated, check uniqueness in current department
      if (updateData.name && updateData.name !== service.name) {
        const existingService = await ServiceRepository.findByNameAndDepartment(
          updateData.name,
          updateData.departmentId || service.departmentId,
          serviceId
        );
        if (existingService) {
          throw ErrorHandlers.conflict('service.nameAlreadyExistsInDepartment');
        }
      }

      // Validate price is positive if provided
      if (updateData.price !== undefined && updateData.price <= 0) {
        throw ErrorHandlers.badRequest('service.pricePositive');
      }

      // Update service
      const updatedService = await ServiceRepository.update(serviceId, updateData);

      logger.info(`Service updated: ${updatedService.name}`, {
        serviceId,
        updatedBy
      });

      return updatedService;
    } catch (error) {
      logger.error('Error updating service:', error);
      throw error;
    }
  }

  /**
   * Delete service (soft delete)
   */
  async deleteService(serviceId, deletedBy) {
    try {
      // Check if service exists
      const service = await ServiceRepository.findById(serviceId);
      if (!service) {
        throw ErrorHandlers.notFound('service.notFound');
      }

      // Soft delete
      const deleted = await ServiceRepository.softDelete(serviceId);

      if (!deleted) {
        throw ErrorHandlers.internal('service.deleteFailed');
      }

      logger.info(`Service deleted: ${service.name}`, {
        serviceId,
        deletedBy
      });

      return true;
    } catch (error) {
      logger.error('Error deleting service:', error);
      throw error;
    }
  }

  /**
   * Activate service
   */
  async activateService(serviceId, activatedBy) {
    try {
      const service = await ServiceRepository.findById(serviceId);
      if (!service) {
        throw ErrorHandlers.notFound('service.notFound');
      }

      if (service.isActive) {
        throw ErrorHandlers.badRequest('service.alreadyActive');
      }

      // Check if department is active
      const department = await DepartmentRepository.findById(service.departmentId);
      if (!department || !department.isActive) {
        throw ErrorHandlers.badRequest('department.inactive');
      }

      await ServiceRepository.update(serviceId, { isActive: true });

      logger.info(`Service activated: ${service.name}`, {
        serviceId,
        activatedBy
      });

      return await ServiceRepository.findById(serviceId);
    } catch (error) {
      logger.error('Error activating service:', error);
      throw error;
    }
  }

  /**
   * Deactivate service
   */
  async deactivateService(serviceId, deactivatedBy) {
    try {
      const service = await ServiceRepository.findById(serviceId);
      if (!service) {
        throw ErrorHandlers.notFound('service.notFound');
      }

      if (!service.isActive) {
        throw ErrorHandlers.badRequest('service.alreadyInactive');
      }

      await ServiceRepository.update(serviceId, { isActive: false });

      logger.info(`Service deactivated: ${service.name}`, {
        serviceId,
        deactivatedBy
      });

      return await ServiceRepository.findById(serviceId);
    } catch (error) {
      logger.error('Error deactivating service:', error);
      throw error;
    }
  }

  /**
   * Upload service image
   */
  async uploadServiceImage(serviceId, imagePath, uploadedBy) {
    try {
      const service = await ServiceRepository.findById(serviceId);
      if (!service) {
        throw ErrorHandlers.notFound('service.notFound');
      }

      await ServiceRepository.update(serviceId, { image: imagePath });

      logger.info(`Service image uploaded: ${service.name}`, {
        serviceId,
        uploadedBy
      });

      return await ServiceRepository.findById(serviceId);
    } catch (error) {
      logger.error('Error uploading service image:', error);
      throw error;
    }
  }

  /**
   * Get service statistics
   */
  async getStatistics() {
    try {
      return await ServiceRepository.getStatistics();
    } catch (error) {
      logger.error('Error getting service statistics:', error);
      throw error;
    }
  }
}

module.exports = new ServiceService();

