const ServiceRequestRepository = require('@repositories/ServiceRequestRepository');
const RequestDocumentRepository = require('@repositories/RequestDocumentRepository');
const UserRepository = require('@repositories/UserRepository');
const DepartmentRepository = require('@repositories/DepartmentRepository');
const AgentRepository = require('@repositories/AgentRepository');
const { ErrorHandlers } = require('@utils/ErrorHandler');
const logger = require('@utils/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * ServiceRequestService
 * 
 * Handles business logic for service requests
 */
class ServiceRequestService {
  /**
   * Create a new service request
   */
  async createRequest(userId, requestData, files = []) {
    try {
      // Validate user exists
      const user = await UserRepository.findById(userId);
      if (!user) {
        throw ErrorHandlers.notFound('errors.userNotFound');
      }

      // Validate department exists
      const department = await DepartmentRepository.findById(requestData.categoryId);
      if (!department) {
        throw ErrorHandlers.notFound('serviceRequest.categoryNotFound');
      }

      // Check if department is active
      if (!department.isActive) {
        throw ErrorHandlers.badRequest('serviceRequest.categoryInactive');
      }

      // If agent selected, validate agent exists and belongs to category
      if (requestData.agentId) {
        const agent = await AgentRepository.findById(requestData.agentId);
        if (!agent) {
          throw ErrorHandlers.notFound('serviceRequest.agentNotFound');
        }

        // Check if agent is active
        if (!agent.isActive) {
          throw ErrorHandlers.badRequest('serviceRequest.agentInactive');
        }

        // Verify agent belongs to this category
        const agentBelongsToCategory = await this._verifyAgentCategory(requestData.agentId, requestData.categoryId);
        if (!agentBelongsToCategory) {
          throw ErrorHandlers.badRequest('serviceRequest.agentNotInCategory');
        }
      }

      // Validate meeting date is not in the past
      const meetingDateTime = new Date(`${requestData.meetingDate}T${requestData.meetingTime}`);
      if (meetingDateTime < new Date()) {
        throw ErrorHandlers.badRequest('serviceRequest.meetingDateInPast');
      }

      // Validate document count (max 5)
      if (files && files.length > 5) {
        throw ErrorHandlers.badRequest('serviceRequest.tooManyDocuments');
      }

      // Prepare request data
      const serviceRequestData = {
        userId,
        fullName: requestData.fullName || user.fullName,
        email: requestData.email || user.email,
        phone: requestData.phone || user.phone,
        additionalEmail: requestData.additionalEmail || null,
        additionalPhone: requestData.additionalPhone || null,
        categoryId: requestData.categoryId,
        notes: requestData.notes || null,
        meetingType: requestData.meetingType,
        meetingDate: requestData.meetingDate,
        meetingTime: requestData.meetingTime,
        meetingDuration: requestData.meetingDuration || 60,
        agentId: requestData.agentId || null,
        isAgentSelectedByUser: !!requestData.agentId,
        status: 'pending',
        priority: 'normal'
      };

      // Create service request
      const serviceRequest = await ServiceRequestRepository.create(serviceRequestData);

      // Upload and save documents if provided
      if (files && files.length > 0) {
        const documentsData = files.map(file => ({
          requestId: serviceRequest.id,
          fileName: file.originalname,
          filePath: file.path,
          fileType: file.mimetype,
          fileSize: file.size,
          uploadedBy: userId
        }));

        await RequestDocumentRepository.createMany(documentsData);
      }

      // Get full request with relations
      const fullRequest = await ServiceRequestRepository.findById(serviceRequest.id);

      // TODO: Send notifications
      // await this._sendRequestCreatedNotifications(fullRequest);

      logger.info('Service request created successfully', {
        requestId: serviceRequest.id,
        userId,
        categoryId: requestData.categoryId
      });

      return fullRequest;
    } catch (error) {
      // Cleanup uploaded files on error
      if (files && files.length > 0) {
        await this._cleanupFiles(files);
      }
      
      logger.error('Error creating service request:', error);
      throw error;
    }
  }

  /**
   * Get service request by ID
   */
  async getRequestById(requestId, userId, userRole) {
    const request = await ServiceRequestRepository.findById(requestId);

    if (!request) {
      throw ErrorHandlers.notFound('serviceRequest.notFound');
    }

    // Authorization check
    if (userRole === 'USER') {
      // User can only view their own requests
      if (request.userId !== userId) {
        throw ErrorHandlers.forbidden('errors.forbidden');
      }
    } else if (userRole === 'AGENT') {
      // Agent can only view requests assigned to them
      if (request.agentId !== userId) {
        throw ErrorHandlers.forbidden('errors.forbidden');
      }
    }
    // Admin can view all requests

    return request;
  }

  /**
   * Get user's service requests
   */
  async getUserRequests(userId, options = {}) {
    return await ServiceRequestRepository.findByUserId(userId, options);
  }

  /**
   * Get agent's service requests
   */
  async getAgentRequests(agentId, options = {}) {
    return await ServiceRequestRepository.findByAgentId(agentId, options);
  }

  /**
   * Get all service requests (Admin only)
   */
  async getAllRequests(options = {}) {
    return await ServiceRequestRepository.findAll(options);
  }

  /**
   * Assign agent to request (Admin only)
   */
  async assignAgent(requestId, agentId, adminId) {
    const request = await ServiceRequestRepository.findById(requestId);

    if (!request) {
      throw ErrorHandlers.notFound('serviceRequest.notFound');
    }

    if (request.status !== 'pending') {
      throw ErrorHandlers.badRequest('serviceRequest.cannotAssignAgentToNonPendingRequest');
    }

    // Validate agent
    const agent = await AgentRepository.findById(agentId);
    if (!agent) {
      throw ErrorHandlers.notFound('serviceRequest.agentNotFound');
    }

    if (!agent.isActive) {
      throw ErrorHandlers.badRequest('serviceRequest.agentInactive');
    }

    // Verify agent belongs to request category
    const agentBelongsToCategory = await this._verifyAgentCategory(agentId, request.categoryId);
    if (!agentBelongsToCategory) {
      throw ErrorHandlers.badRequest('serviceRequest.agentNotInCategory');
    }

    // Update request
    const updatedRequest = await ServiceRequestRepository.update(requestId, {
      agentId,
      isAgentSelectedByUser: false
    });

    // TODO: Send notification to agent
    // await this._sendAgentAssignedNotification(updatedRequest);

    logger.info('Agent assigned to request', {
      requestId,
      agentId,
      assignedBy: adminId
    });

    return updatedRequest;
  }

  /**
   * Reassign agent (Current agent or Admin)
   */
  async reassignAgent(requestId, newAgentId, currentAgentId, reason, userRole) {
    const request = await ServiceRequestRepository.findById(requestId);

    if (!request) {
      throw ErrorHandlers.notFound('serviceRequest.notFound');
    }

    // Authorization check
    if (userRole === 'AGENT' && request.agentId !== currentAgentId) {
      throw ErrorHandlers.forbidden('errors.forbidden');
    }

    // Validate new agent
    const newAgent = await AgentRepository.findById(newAgentId);
    if (!newAgent) {
      throw ErrorHandlers.notFound('serviceRequest.agentNotFound');
    }

    if (!newAgent.isActive) {
      throw ErrorHandlers.badRequest('serviceRequest.agentInactive');
    }

    // Verify new agent belongs to request category
    const agentBelongsToCategory = await this._verifyAgentCategory(newAgentId, request.categoryId);
    if (!agentBelongsToCategory) {
      throw ErrorHandlers.badRequest('serviceRequest.agentNotInCategory');
    }

    // Update request
    const updatedRequest = await ServiceRequestRepository.update(requestId, {
      previousAgentId: request.agentId,
      agentId: newAgentId,
      reassignmentRequestedBy: currentAgentId,
      reassignmentRequestedAt: new Date(),
      reassignmentReason: reason
    });

    // TODO: Send notifications
    // await this._sendReassignmentNotifications(updatedRequest);

    logger.info('Request reassigned to new agent', {
      requestId,
      previousAgentId: request.agentId,
      newAgentId,
      reassignedBy: currentAgentId
    });

    return updatedRequest;
  }

  /**
   * Approve request (Agent or Admin)
   */
  async approveRequest(requestId, approverId, serviceId = null) {
    const request = await ServiceRequestRepository.findById(requestId);

    if (!request) {
      throw ErrorHandlers.notFound('serviceRequest.notFound');
    }

    if (request.status !== 'pending') {
      throw ErrorHandlers.badRequest('serviceRequest.cannotApproveNonPendingRequest');
    }

    const updateData = {
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date()
    };

    // If service specified, validate and assign
    if (serviceId) {
      const service = await this._validateService(serviceId, request.categoryId);
      updateData.serviceId = service.id;
    }

    const updatedRequest = await ServiceRequestRepository.update(requestId, updateData);

    // TODO: Send notification to user
    // await this._sendRequestApprovedNotification(updatedRequest);

    logger.info('Request approved', {
      requestId,
      approvedBy: approverId,
      serviceId
    });

    return updatedRequest;
  }

  /**
   * Reject request (Agent or Admin)
   */
  async rejectRequest(requestId, rejectedBy, reason) {
    const request = await ServiceRequestRepository.findById(requestId);

    if (!request) {
      throw ErrorHandlers.notFound('serviceRequest.notFound');
    }

    if (request.status !== 'pending') {
      throw ErrorHandlers.badRequest('serviceRequest.cannotRejectNonPendingRequest');
    }

    const updatedRequest = await ServiceRequestRepository.update(requestId, {
      status: 'rejected',
      rejectedBy,
      rejectedAt: new Date(),
      rejectionReason: reason
    });

    // TODO: Send notification to user
    // await this._sendRequestRejectedNotification(updatedRequest);

    logger.info('Request rejected', {
      requestId,
      rejectedBy,
      reason
    });

    return updatedRequest;
  }

  /**
   * Complete request (Agent or Admin)
   */
  async completeRequest(requestId, completedBy) {
    const request = await ServiceRequestRepository.findById(requestId);

    if (!request) {
      throw ErrorHandlers.notFound('serviceRequest.notFound');
    }

    if (request.status !== 'approved') {
      throw ErrorHandlers.badRequest('serviceRequest.cannotCompleteNonApprovedRequest');
    }

    const updatedRequest = await ServiceRequestRepository.update(requestId, {
      status: 'completed',
      completedAt: new Date()
    });

    // TODO: Send notification to user
    // await this._sendRequestCompletedNotification(updatedRequest);

    logger.info('Request completed', {
      requestId,
      completedBy
    });

    return updatedRequest;
  }

  /**
   * Cancel request (Admin only)
   */
  async cancelRequest(requestId, cancelledBy, reason) {
    const request = await ServiceRequestRepository.findById(requestId);

    if (!request) {
      throw ErrorHandlers.notFound('serviceRequest.notFound');
    }

    if (['completed', 'cancelled'].includes(request.status)) {
      throw ErrorHandlers.badRequest('serviceRequest.cannotCancelFinishedRequest');
    }

    const updatedRequest = await ServiceRequestRepository.update(requestId, {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason
    });

    // TODO: Send notification to user and agent
    // await this._sendRequestCancelledNotifications(updatedRequest);

    logger.info('Request cancelled', {
      requestId,
      cancelledBy,
      reason
    });

    return updatedRequest;
  }

  /**
   * Update request priority (Admin only)
   */
  async updatePriority(requestId, priority) {
    const request = await ServiceRequestRepository.findById(requestId);

    if (!request) {
      throw ErrorHandlers.notFound('serviceRequest.notFound');
    }

    const validPriorities = ['low', 'normal', 'high', 'urgent'];
    if (!validPriorities.includes(priority)) {
      throw ErrorHandlers.badRequest('serviceRequest.invalidPriority');
    }

    return await ServiceRequestRepository.update(requestId, { priority });
  }

  /**
   * Add admin notes (Admin or Agent)
   */
  async addAdminNotes(requestId, notes, addedBy) {
    const request = await ServiceRequestRepository.findById(requestId);

    if (!request) {
      throw ErrorHandlers.notFound('serviceRequest.notFound');
    }

    return await ServiceRequestRepository.update(requestId, {
      adminNotes: notes
    });
  }

  /**
   * Get statistics
   */
  async getStatistics(filters = {}) {
    return await ServiceRequestRepository.getStatistics(filters);
  }

  /**
   * Get upcoming meetings for agent
   */
  async getUpcomingMeetings(agentId, days = 7) {
    return await ServiceRequestRepository.getUpcomingMeetings(agentId, days);
  }

  /**
   * PRIVATE HELPER METHODS
   */

  /**
   * Verify agent belongs to category/department
   */
  async _verifyAgentCategory(agentId, categoryId) {
    // Get agent
    const agent = await AgentRepository.findById(agentId);
    
    if (!agent) {
      return false;
    }
    
    // Check if agent has a department assigned
    if (!agent.departmentId) {
      return false;
    }
    
    // Check if agent's departmentId matches the categoryId (with type coercion)
    return parseInt(agent.departmentId) === parseInt(categoryId);
  }

  /**
   * Validate service belongs to category
   */
  async _validateService(serviceId, categoryId) {
    const ServiceRepository = require('@repositories/ServiceRepository');
    const service = await ServiceRepository.findById(serviceId);

    if (!service) {
      throw ErrorHandlers.notFound('serviceRequest.serviceNotFound');
    }

    if (service.categoryId !== categoryId) {
      throw ErrorHandlers.badRequest('serviceRequest.serviceNotInCategory');
    }

    if (!service.isActive) {
      throw ErrorHandlers.badRequest('serviceRequest.serviceInactive');
    }

    return service;
  }

  /**
   * Cleanup uploaded files
   */
  async _cleanupFiles(files) {
    try {
      for (const file of files) {
        if (file.path) {
          await fs.unlink(file.path).catch(() => {});
        }
      }
    } catch (error) {
      logger.error('Error cleaning up files:', error);
    }
  }

  /**
   * Send notifications (placeholders for future implementation)
   */
  async _sendRequestCreatedNotifications(request) {
    // TODO: Implement notification service
    // Send to: User, Admin, Agent (if assigned)
  }

  async _sendAgentAssignedNotification(request) {
    // TODO: Send to assigned agent
  }

  async _sendReassignmentNotifications(request) {
    // TODO: Send to previous agent and new agent
  }

  async _sendRequestApprovedNotification(request) {
    // TODO: Send to user
  }

  async _sendRequestRejectedNotification(request) {
    // TODO: Send to user
  }

  async _sendRequestCompletedNotification(request) {
    // TODO: Send to user
  }

  async _sendRequestCancelledNotifications(request) {
    // TODO: Send to user and agent
  }
}

module.exports = new ServiceRequestService();

