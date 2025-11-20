const ComplaintRepository = require('@repositories/ComplaintRepository');
const { ErrorHandlers } = require('@utils/ErrorHandler');
const logger = require('@utils/logger');

/**
 * Complaint Service
 * 
 * Handles all business logic for complaints
 */
class ComplaintService {
  /**
   * Create a new complaint
   * @param {Object} complaintData - Complaint data
   * @param {number|null} userId - User ID if authenticated
   * @returns {Promise<Object>} Created complaint
   */
  async createComplaint(complaintData, userId = null) {
    try {
      // Prepare complaint data
      const data = {
        firstName: complaintData.firstName,
        lastName: complaintData.lastName,
        email: complaintData.email,
        phoneNumber: complaintData.phoneNumber || null,
        complaintType: complaintData.complaintType || 'other',
        departmentId: complaintData.departmentId || null,
        description: complaintData.description,
        attachments: complaintData.attachments || [],
        status: 'pending',
        userId: userId || null
      };

      // Create complaint
      const complaint = await ComplaintRepository.create(data);

      logger.info('Complaint created', {
        complaintId: complaint.id,
        email: complaint.email,
        userId: userId || 'anonymous'
      });

      return complaint;
    } catch (error) {
      logger.error('Error creating complaint:', error);
      throw error;
    }
  }

  /**
   * Get complaint by ID
   * @param {number} complaintId - Complaint ID
   * @returns {Promise<Object>} Complaint
   */
  async getComplaintById(complaintId) {
    const complaint = await ComplaintRepository.findById(complaintId);

    if (!complaint) {
      throw ErrorHandlers.notFound('errors.complaintNotFound');
    }

    if (complaint.deletedAt) {
      throw ErrorHandlers.notFound('errors.complaintNotFound');
    }

    return complaint;
  }

  /**
   * Get all complaints with filters
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Complaints list
   */
  async getAllComplaints(filters = {}, pagination = {}) {
    try {
      return await ComplaintRepository.findAll(filters, pagination);
    } catch (error) {
      logger.error('Error getting complaints:', error);
      throw error;
    }
  }

  /**
   * Get user complaints
   * @param {number} userId - User ID
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} User complaints
   */
  async getUserComplaints(userId, pagination = {}) {
    try {
      return await ComplaintRepository.findByUserId(userId, pagination);
    } catch (error) {
      logger.error('Error getting user complaints:', error);
      throw error;
    }
  }

  /**
   * Resolve complaint
   * @param {number} complaintId - Complaint ID
   * @param {number} adminId - Admin ID
   * @param {string} resolutionNotes - Resolution notes
   * @returns {Promise<Object>} Updated complaint
   */
  async resolveComplaint(complaintId, adminId, resolutionNotes = null) {
    try {
      const complaint = await this.getComplaintById(complaintId);

      if (complaint.status === 'resolved') {
        throw ErrorHandlers.badRequest('errors.complaintAlreadyResolved');
      }

      if (complaint.status === 'closed') {
        throw ErrorHandlers.badRequest('errors.complaintClosed');
      }

      const updated = await ComplaintRepository.resolve(
        complaintId,
        adminId,
        resolutionNotes
      );

      logger.info('Complaint resolved', {
        complaintId,
        adminId,
        email: complaint.email
      });

      return updated;
    } catch (error) {
      logger.error('Error resolving complaint:', error);
      throw error;
    }
  }

  /**
   * Reject complaint
   * @param {number} complaintId - Complaint ID
   * @param {number} adminId - Admin ID
   * @param {string} rejectionReason - Rejection reason
   * @returns {Promise<Object>} Updated complaint
   */
  async rejectComplaint(complaintId, adminId, rejectionReason = null) {
    try {
      const complaint = await this.getComplaintById(complaintId);

      if (complaint.status === 'rejected') {
        throw ErrorHandlers.badRequest('errors.complaintAlreadyRejected');
      }

      if (complaint.status === 'closed') {
        throw ErrorHandlers.badRequest('errors.complaintClosed');
      }

      const updated = await ComplaintRepository.reject(
        complaintId,
        adminId,
        rejectionReason
      );

      logger.info('Complaint rejected', {
        complaintId,
        adminId,
        email: complaint.email
      });

      return updated;
    } catch (error) {
      logger.error('Error rejecting complaint:', error);
      throw error;
    }
  }

  /**
   * Reopen complaint
   * @param {number} complaintId - Complaint ID
   * @returns {Promise<Object>} Updated complaint
   */
  async reopenComplaint(complaintId) {
    try {
      const complaint = await this.getComplaintById(complaintId);

      if (complaint.status === 'pending' || complaint.status === 'in_progress') {
        throw ErrorHandlers.badRequest('errors.complaintAlreadyOpen');
      }

      if (complaint.status === 'closed') {
        throw ErrorHandlers.badRequest('errors.complaintClosed');
      }

      const updated = await ComplaintRepository.reopen(complaintId);

      logger.info('Complaint reopened', {
        complaintId,
        email: complaint.email
      });

      return updated;
    } catch (error) {
      logger.error('Error reopening complaint:', error);
      throw error;
    }
  }

  /**
   * Update complaint status
   * @param {number} complaintId - Complaint ID
   * @param {string} status - New status
   * @param {number} adminId - Admin ID
   * @returns {Promise<Object>} Updated complaint
   */
  async updateStatus(complaintId, status, adminId) {
    try {
      const complaint = await this.getComplaintById(complaintId);

      const validStatuses = ['pending', 'in_progress', 'resolved', 'rejected', 'closed'];
      if (!validStatuses.includes(status)) {
        throw ErrorHandlers.badRequest('errors.invalidComplaintStatus');
      }

      const updateData = { status };
      
      if (status === 'resolved' || status === 'rejected') {
        updateData.resolvedBy = adminId;
        updateData.resolvedAt = new Date();
      }

      const updated = await ComplaintRepository.update(complaintId, updateData);

      logger.info('Complaint status updated', {
        complaintId,
        status,
        adminId
      });

      return updated;
    } catch (error) {
      logger.error('Error updating complaint status:', error);
      throw error;
    }
  }

  /**
   * Delete complaint (soft delete)
   * @param {number} complaintId - Complaint ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteComplaint(complaintId) {
    try {
      await this.getComplaintById(complaintId);
      await ComplaintRepository.delete(complaintId);

      logger.info('Complaint deleted', { complaintId });

      return true;
    } catch (error) {
      logger.error('Error deleting complaint:', error);
      throw error;
    }
  }

  /**
   * Get complaint statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    try {
      return await ComplaintRepository.getStatistics();
    } catch (error) {
      logger.error('Error getting complaint statistics:', error);
      throw error;
    }
  }
}

module.exports = new ComplaintService();

