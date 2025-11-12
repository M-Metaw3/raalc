const ServiceRequestService = require('@services/ServiceRequestService');

/**
 * ServiceRequestController
 * 
 * Handles HTTP requests for service requests
 */
class ServiceRequestController {
  /**
   * Create a new service request
   * POST /api/service-requests
   * @access Private (User)
   */
  async createRequest(req, res, next) {
    try {
      const userId = req.user.id;
      const requestData = req.body;
      const files = req.files || [];

      const serviceRequest = await ServiceRequestService.createRequest(
        userId,
        requestData,
        files
      );

      res.status(201).json({
        ok: true,
        message: req.t('serviceRequest.created'),
        messageKey: 'serviceRequest.created',
        data: { serviceRequest }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get service request by ID
   * GET /api/service-requests/:id
   * @access Private (User/Agent/Admin)
   */
  async getRequest(req, res, next) {
    try {
      const requestId = parseInt(req.params.id);
      const userId = req.user.id;
      const userRole = req.user.role || 'USER';

      const serviceRequest = await ServiceRequestService.getRequestById(
        requestId,
        userId,
        userRole
      );

      res.json({
        ok: true,
        message: req.t('success.retrieved'),
        messageKey: 'success.retrieved',
        data: { serviceRequest }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's service requests
   * GET /api/service-requests/my-requests
   * @access Private (User)
   */
  async getMyRequests(req, res, next) {
    try {
      const userId = req.user.id;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : undefined
      };

      const result = await ServiceRequestService.getUserRequests(userId, options);

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
   * Get agent's service requests
   * GET /api/service-requests/agent-requests
   * @access Private (Agent)
   */
  async getAgentRequests(req, res, next) {
    try {
      const agentId = req.user.id;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : undefined
      };

      const result = await ServiceRequestService.getAgentRequests(agentId, options);

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
   * Get all service requests
   * GET /api/service-requests
   * @access Private (Admin)
   */
  async getAllRequests(req, res, next) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : undefined,
        agentId: req.query.agentId ? parseInt(req.query.agentId) : undefined,
        priority: req.query.priority,
        searchTerm: req.query.search
      };

      const result = await ServiceRequestService.getAllRequests(options);

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
   * Assign agent to request
   * PUT /api/service-requests/:id/assign-agent
   * @access Private (Admin)
   */
  async assignAgent(req, res, next) {
    try {
      const requestId = parseInt(req.params.id);
      const { agentId } = req.body;
      const adminId = req.user.id;

      const serviceRequest = await ServiceRequestService.assignAgent(
        requestId,
        agentId,
        adminId
      );

      res.json({
        ok: true,
        message: req.t('serviceRequest.agentAssigned'),
        messageKey: 'serviceRequest.agentAssigned',
        data: { serviceRequest }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reassign agent
   * PUT /api/service-requests/:id/reassign-agent
   * @access Private (Agent/Admin)
   */
  async reassignAgent(req, res, next) {
    try {
      const requestId = parseInt(req.params.id);
      const { newAgentId, reason } = req.body;
      const currentAgentId = req.user.id;
      const userRole = req.user.role || 'AGENT';

      const serviceRequest = await ServiceRequestService.reassignAgent(
        requestId,
        newAgentId,
        currentAgentId,
        reason,
        userRole
      );

      res.json({
        ok: true,
        message: req.t('serviceRequest.agentReassigned'),
        messageKey: 'serviceRequest.agentReassigned',
        data: { serviceRequest }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve request
   * PUT /api/service-requests/:id/approve
   * @access Private (Agent/Admin)
   */
  async approveRequest(req, res, next) {
    try {
      const requestId = parseInt(req.params.id);
      const { serviceId } = req.body;
      const approverId = req.user.id;

      const serviceRequest = await ServiceRequestService.approveRequest(
        requestId,
        approverId,
        serviceId
      );

      res.json({
        ok: true,
        message: req.t('serviceRequest.approved'),
        messageKey: 'serviceRequest.approved',
        data: { serviceRequest }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject request
   * PUT /api/service-requests/:id/reject
   * @access Private (Agent/Admin)
   */
  async rejectRequest(req, res, next) {
    try {
      const requestId = parseInt(req.params.id);
      const { reason } = req.body;
      const rejectedBy = req.user.id;

      const serviceRequest = await ServiceRequestService.rejectRequest(
        requestId,
        rejectedBy,
        reason
      );

      res.json({
        ok: true,
        message: req.t('serviceRequest.rejected'),
        messageKey: 'serviceRequest.rejected',
        data: { serviceRequest }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete request
   * PUT /api/service-requests/:id/complete
   * @access Private (Agent/Admin)
   */
  async completeRequest(req, res, next) {
    try {
      const requestId = parseInt(req.params.id);
      const completedBy = req.user.id;

      const serviceRequest = await ServiceRequestService.completeRequest(
        requestId,
        completedBy
      );

      res.json({
        ok: true,
        message: req.t('serviceRequest.completed'),
        messageKey: 'serviceRequest.completed',
        data: { serviceRequest }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel request
   * PUT /api/service-requests/:id/cancel
   * @access Private (Admin)
   */
  async cancelRequest(req, res, next) {
    try {
      const requestId = parseInt(req.params.id);
      const { reason } = req.body;
      const cancelledBy = req.user.id;

      const serviceRequest = await ServiceRequestService.cancelRequest(
        requestId,
        cancelledBy,
        reason
      );

      res.json({
        ok: true,
        message: req.t('serviceRequest.cancelled'),
        messageKey: 'serviceRequest.cancelled',
        data: { serviceRequest }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update request priority
   * PUT /api/service-requests/:id/priority
   * @access Private (Admin)
   */
  async updatePriority(req, res, next) {
    try {
      const requestId = parseInt(req.params.id);
      const { priority } = req.body;

      const serviceRequest = await ServiceRequestService.updatePriority(
        requestId,
        priority
      );

      res.json({
        ok: true,
        message: req.t('serviceRequest.priorityUpdated'),
        messageKey: 'serviceRequest.priorityUpdated',
        data: { serviceRequest }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add admin notes
   * PUT /api/service-requests/:id/notes
   * @access Private (Agent/Admin)
   */
  async addAdminNotes(req, res, next) {
    try {
      const requestId = parseInt(req.params.id);
      const { notes } = req.body;
      const addedBy = req.user.id;

      const serviceRequest = await ServiceRequestService.addAdminNotes(
        requestId,
        notes,
        addedBy
      );

      res.json({
        ok: true,
        message: req.t('serviceRequest.notesAdded'),
        messageKey: 'serviceRequest.notesAdded',
        data: { serviceRequest }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get statistics
   * GET /api/service-requests/statistics
   * @access Private (Admin)
   */
  async getStatistics(req, res, next) {
    try {
      const filters = {
        agentId: req.query.agentId ? parseInt(req.query.agentId) : undefined,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId) : undefined,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const statistics = await ServiceRequestService.getStatistics(filters);

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
   * Get upcoming meetings
   * GET /api/service-requests/upcoming-meetings
   * @access Private (Agent)
   */
  async getUpcomingMeetings(req, res, next) {
    try {
      const agentId = req.user.id;
      const days = parseInt(req.query.days) || 7;

      const meetings = await ServiceRequestService.getUpcomingMeetings(agentId, days);

      res.json({
        ok: true,
        message: req.t('success.retrieved'),
        messageKey: 'success.retrieved',
        data: { meetings, count: meetings.length }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ServiceRequestController();

