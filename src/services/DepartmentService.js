const DepartmentRepository = require('@repositories/DepartmentRepository');
const { ErrorHandlers } = require('@utils/ErrorHandler');
const { GENERAL_ERRORS } = require('@utils/ErrorCodes');
const logger = require('@utils/logger');

/**
 * Department Service
 * Handles business logic for departments
 */
class DepartmentService {
  /**
   * Create a new department
   */
  async createDepartment(departmentData, createdBy) {
    try {
      // Check if department name already exists
      const existingDepartment = await DepartmentRepository.findByName(departmentData.name);
      if (existingDepartment) {
        throw ErrorHandlers.conflict('department.nameAlreadyExists');
      }

      // Validate name is English only (letters, numbers, spaces, hyphens)
      const englishOnly = /^[a-zA-Z0-9\s\-]+$/;
      if (!englishOnly.test(departmentData.name)) {
        throw ErrorHandlers.badRequest('department.nameEnglishOnly');
      }

      // Create department
      const department = await DepartmentRepository.create({
        ...departmentData,
        isActive: departmentData.isActive !== undefined ? departmentData.isActive : true
      });

      logger.info(`Department created: ${department.name}`, {
        departmentId: department.id,
        createdBy
      });

      return department;
    } catch (error) {
      logger.error('Error creating department:', error);
      throw error;
    }
  }

  /**
   * Get all departments with pagination and filters
   */
  async getAllDepartments(filters) {
    try {
      const result = await DepartmentRepository.findAll(filters);

      // Add services count to each department
      const departmentsWithCount = await Promise.all(
        result.departments.map(async (dept) => {
          const deptWithCount = await DepartmentRepository.findByIdWithServicesCount(dept.id);
          return deptWithCount || dept;
        })
      );

      return {
        departments: departmentsWithCount,
        pagination: result.pagination
      };
    } catch (error) {
      logger.error('Error getting departments:', error);
      throw error;
    }
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(departmentId) {
    try {
      const department = await DepartmentRepository.findByIdWithServicesCount(departmentId);

      if (!department) {
        throw ErrorHandlers.notFound('department.notFound');
      }

      return department;
    } catch (error) {
      logger.error('Error getting department by ID:', error);
      throw error;
    }
  }

  /**
   * Get department with all services
   */
  async getDepartmentWithServices(departmentId, includeInactive = false) {
    try {
      const department = await DepartmentRepository.findByIdWithServices(
        departmentId,
        includeInactive
      );

      if (!department) {
        throw ErrorHandlers.notFound('department.notFound');
      }

      return department;
    } catch (error) {
      logger.error('Error getting department with services:', error);
      throw error;
    }
  }

  /**
   * Update department
   */
  async updateDepartment(departmentId, updateData, updatedBy) {
    try {
      // Check if department exists
      const department = await DepartmentRepository.findById(departmentId);
      if (!department) {
        throw ErrorHandlers.notFound('department.notFound');
      }

      // If name is being updated, check uniqueness
      if (updateData.name && updateData.name !== department.name) {
        // Validate name is English only
        const englishOnly = /^[a-zA-Z0-9\s\-]+$/;
        if (!englishOnly.test(updateData.name)) {
          throw ErrorHandlers.badRequest('department.nameEnglishOnly');
        }

        const existingDepartment = await DepartmentRepository.findByName(
          updateData.name,
          departmentId
        );
        if (existingDepartment) {
          throw ErrorHandlers.conflict('department.nameAlreadyExists');
        }
      }

      // Update department
      const updatedDepartment = await DepartmentRepository.update(departmentId, updateData);

      logger.info(`Department updated: ${updatedDepartment.name}`, {
        departmentId,
        updatedBy
      });

      return updatedDepartment;
    } catch (error) {
      logger.error('Error updating department:', error);
      throw error;
    }
  }

  /**
   * Delete department (soft delete)
   */
  async deleteDepartment(departmentId, deletedBy) {
    try {
      // Check if department exists
      const department = await DepartmentRepository.findById(departmentId);
      if (!department) {
        throw ErrorHandlers.notFound('department.notFound');
      }

      // Soft delete
      const deleted = await DepartmentRepository.softDelete(departmentId);

      if (!deleted) {
        throw ErrorHandlers.internal('department.deleteFailed');
      }

      logger.info(`Department deleted: ${department.name}`, {
        departmentId,
        deletedBy
      });

      return true;
    } catch (error) {
      logger.error('Error deleting department:', error);
      throw error;
    }
  }

  /**
   * Activate department
   */
  async activateDepartment(departmentId, activatedBy) {
    try {
      const department = await DepartmentRepository.findById(departmentId);
      if (!department) {
        throw ErrorHandlers.notFound('department.notFound');
      }

      if (department.isActive) {
        throw ErrorHandlers.badRequest('department.alreadyActive');
      }

      await DepartmentRepository.update(departmentId, { isActive: true });

      logger.info(`Department activated: ${department.name}`, {
        departmentId,
        activatedBy
      });

      return await DepartmentRepository.findById(departmentId);
    } catch (error) {
      logger.error('Error activating department:', error);
      throw error;
    }
  }

  /**
   * Deactivate department
   */
  async deactivateDepartment(departmentId, deactivatedBy) {
    try {
      const department = await DepartmentRepository.findById(departmentId);
      if (!department) {
        throw ErrorHandlers.notFound('department.notFound');
      }

      if (!department.isActive) {
        throw ErrorHandlers.badRequest('department.alreadyInactive');
      }

      await DepartmentRepository.update(departmentId, { isActive: false });

      logger.info(`Department deactivated: ${department.name}`, {
        departmentId,
        deactivatedBy
      });

      return await DepartmentRepository.findById(departmentId);
    } catch (error) {
      logger.error('Error deactivating department:', error);
      throw error;
    }
  }

  /**
   * Get department statistics
   */
  async getStatistics() {
    try {
      return await DepartmentRepository.getStatistics();
    } catch (error) {
      logger.error('Error getting department statistics:', error);
      throw error;
    }
  }
}

module.exports = new DepartmentService();

