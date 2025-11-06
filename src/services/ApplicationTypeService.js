const ApplicationTypeRepository = require('@repositories/ApplicationTypeRepository');
const { ErrorHandlers } = require('@utils/ErrorHandler');
const logger = require('@utils/logger');

class ApplicationTypeService {
  /**
   * Create new application type
   */
  async createApplicationType(typeData, createdBy) {
    try {
      // Validate name uniqueness
      const existingType = await ApplicationTypeRepository.findByName(typeData.name);
      if (existingType) {
        throw ErrorHandlers.conflict('applicationType.alreadyExists');
      }

      // Validate name format (English only - letters, numbers, spaces, hyphens)
      if (!/^[a-zA-Z0-9\s\-]+$/.test(typeData.name)) {
        throw ErrorHandlers.badRequest('applicationType.invalidNameFormat');
      }

      // Create application type
      const applicationType = await ApplicationTypeRepository.create({
        ...typeData,
        createdBy
      });

      logger.info(`Application type created: ${applicationType.name}`, {
        id: applicationType.id,
        createdBy
      });

      return applicationType;
    } catch (error) {
      logger.error('Error creating application type:', error);
      throw error;
    }
  }

  /**
   * Get application type by ID
   */
  async getApplicationTypeById(id) {
    const applicationType = await ApplicationTypeRepository.findById(id);

    if (!applicationType) {
      throw ErrorHandlers.notFound('applicationType.notFound');
    }

    return applicationType;
  }

  /**
   * Get application type with services
   */
  async getApplicationTypeWithServices(id) {
    const applicationType = await ApplicationTypeRepository.findByIdWithServices(id);

    if (!applicationType) {
      throw ErrorHandlers.notFound('applicationType.notFound');
    }

    // Count services
    const servicesCount = applicationType.additionalServices ? applicationType.additionalServices.length : 0;

    return {
      ...applicationType,
      servicesCount
    };
  }

  /**
   * Get all application types
   */
  async getAllApplicationTypes(filters) {
    return await ApplicationTypeRepository.findAll(filters);
  }

  /**
   * Get all active application types (simple list)
   */
  async getActiveApplicationTypes() {
    return await ApplicationTypeRepository.findAllActive();
  }

  /**
   * Update application type
   */
  async updateApplicationType(id, updateData, updatedBy) {
    try {
      // Check if exists
      const existingType = await this.getApplicationTypeById(id);

      // If updating name, check uniqueness
      if (updateData.name && updateData.name !== existingType.name) {
        const duplicateName = await ApplicationTypeRepository.findByName(updateData.name);
        if (duplicateName) {
          throw ErrorHandlers.conflict('applicationType.alreadyExists');
        }

        // Validate name format
        if (!/^[a-zA-Z0-9\s\-]+$/.test(updateData.name)) {
          throw ErrorHandlers.badRequest('applicationType.invalidNameFormat');
        }
      }

      // Update
      const updated = await ApplicationTypeRepository.update(id, {
        ...updateData,
        updatedBy
      });

      logger.info(`Application type updated: ${id}`, { updatedBy });

      return updated;
    } catch (error) {
      logger.error('Error updating application type:', error);
      throw error;
    }
  }

  /**
   * Delete application type (soft delete)
   */
  async deleteApplicationType(id) {
    try {
      // Check if exists
      await this.getApplicationTypeById(id);

      // Check if has services
      const servicesCount = await ApplicationTypeRepository.countServices(id);
      if (servicesCount > 0) {
        throw ErrorHandlers.badRequest('applicationType.hasServices');
      }

      await ApplicationTypeRepository.softDelete(id);

      logger.info(`Application type deleted: ${id}`);
    } catch (error) {
      logger.error('Error deleting application type:', error);
      throw error;
    }
  }

  /**
   * Restore deleted application type
   */
  async restoreApplicationType(id) {
    try {
      const restored = await ApplicationTypeRepository.restore(id);

      if (!restored) {
        throw ErrorHandlers.notFound('applicationType.notFound');
      }

      logger.info(`Application type restored: ${id}`);

      return restored;
    } catch (error) {
      logger.error('Error restoring application type:', error);
      throw error;
    }
  }

  /**
   * Activate/Deactivate application type
   */
  async toggleStatus(id, isActive, updatedBy) {
    try {
      await this.getApplicationTypeById(id);

      const updated = await ApplicationTypeRepository.update(id, {
        isActive,
        updatedBy
      });

      logger.info(`Application type status changed: ${id} -> ${isActive}`, { updatedBy });

      return updated;
    } catch (error) {
      logger.error('Error toggling application type status:', error);
      throw error;
    }
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    return await ApplicationTypeRepository.getStatistics();
  }
}

module.exports = new ApplicationTypeService();

