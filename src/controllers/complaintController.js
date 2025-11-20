const ComplaintService = require('@services/ComplaintService');
const { ErrorHandlers } = require('@utils/ErrorHandler');

/**
 * Complaint Controller
 * 
 * Handles HTTP requests for complaints
 */
class ComplaintController {
  /**
   * Create a new complaint
   * POST /api/complaints
   * @access Public (can be anonymous or authenticated)
   */
  async createComplaint(req, res, next) {
    try {
      const complaintData = req.body;
      const userId = req.user?.id || null; // Get user ID if authenticated

      // Process uploaded files
      let attachmentUrls = [];
      if (req.files && req.files.length > 0) {
        const UploadService = require('@services/UploadService');
        attachmentUrls = UploadService.generateFileUrls(req.files);
      }

      // Add attachment URLs to complaint data
      complaintData.attachments = attachmentUrls;

      const complaint = await ComplaintService.createComplaint(complaintData, userId);

      res.status(201).json({
        ok: true,
        message: req.t('complaint.created'),
        messageKey: 'complaint.created',
        data: { 
          complaint,
          uploadedFiles: attachmentUrls.length,
          attachmentUrls
        }
      });
    } catch (error) {
      // Cleanup uploaded files on error
      if (req.files && req.files.length > 0) {
        const UploadService = require('@services/UploadService');
        UploadService.cleanupFiles(req.files);
      }
      next(error);
    }
  }

  /**
   * Get complaint by ID
   * GET /api/complaints/:id
   * @access Private - Admin with complaints.read or User (own complaints)
   */
  async getComplaintById(req, res, next) {
    try {
      const complaintId = parseInt(req.params.id);
      const complaint = await ComplaintService.getComplaintById(complaintId);

      // Check if user can access this complaint
      // Admin can access all (if has complaints.read permission - checked via middleware)
      // User can only access their own complaints
      if (req.user.userType === 'USER') {
        if (!complaint.userId || complaint.userId !== req.user.id) {
          throw ErrorHandlers.forbidden('auth.accessDenied');
        }
      } else if (req.user.userType === 'ADMIN') {
        // Admin access is controlled by requirePermission middleware in routes
        // If they reach here, they have the permission
      }

      res.json({
        ok: true,
        message: req.t('complaint.retrieved'),
        messageKey: 'complaint.retrieved',
        data: { complaint }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all complaints (Admin only)
   * GET /api/complaints
   * @access Private - Admin with complaints.list permission
   */
  async getAllComplaints(req, res, next) {
    try {
      const filters = {
        status: req.query.status,
        complaintType: req.query.complaintType,
        departmentId: req.query.departmentId ? parseInt(req.query.departmentId) : undefined,
        email: req.query.email,
        search: req.query.search
      };

      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await ComplaintService.getAllComplaints(filters, pagination);

      res.json({
        ok: true,
        message: req.t('complaint.listRetrieved'),
        messageKey: 'complaint.listRetrieved',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's own complaints
   * GET /api/complaints/my-complaints
   * @access Private - User only
   */
  async getMyComplaints(req, res, next) {
    try {
      const userId = req.user.id;
      const pagination = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await ComplaintService.getUserComplaints(userId, pagination);

      res.json({
        ok: true,
        message: req.t('complaint.myComplaintsRetrieved'),
        messageKey: 'complaint.myComplaintsRetrieved',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resolve complaint
   * POST /api/complaints/:id/resolve
   * @access Private - Admin with complaints.resolve permission
   */
  async resolveComplaint(req, res, next) {
    try {
      const complaintId = parseInt(req.params.id);
      const adminId = req.user.id;
      const { resolutionNotes } = req.body;

      const complaint = await ComplaintService.resolveComplaint(
        complaintId,
        adminId,
        resolutionNotes
      );

      res.json({
        ok: true,
        message: req.t('complaint.resolved'),
        messageKey: 'complaint.resolved',
        data: { complaint }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject complaint
   * POST /api/complaints/:id/reject
   * @access Private - Admin with complaints.reject permission
   */
  async rejectComplaint(req, res, next) {
    try {
      const complaintId = parseInt(req.params.id);
      const adminId = req.user.id;
      const { rejectionReason } = req.body;

      const complaint = await ComplaintService.rejectComplaint(
        complaintId,
        adminId,
        rejectionReason
      );

      res.json({
        ok: true,
        message: req.t('complaint.rejected'),
        messageKey: 'complaint.rejected',
        data: { complaint }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reopen complaint
   * POST /api/complaints/:id/reopen
   * @access Private - Admin with complaints.reopen permission
   */
  async reopenComplaint(req, res, next) {
    try {
      const complaintId = parseInt(req.params.id);

      const complaint = await ComplaintService.reopenComplaint(complaintId);

      res.json({
        ok: true,
        message: req.t('complaint.reopened'),
        messageKey: 'complaint.reopened',
        data: { complaint }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update complaint status
   * PATCH /api/complaints/:id/status
   * @access Private - Admin with complaints.update permission
   */
  async updateStatus(req, res, next) {
    try {
      const complaintId = parseInt(req.params.id);
      const { status } = req.body;
      const adminId = req.user.id;

      const complaint = await ComplaintService.updateStatus(
        complaintId,
        status,
        adminId
      );

      res.json({
        ok: true,
        message: req.t('complaint.statusUpdated'),
        messageKey: 'complaint.statusUpdated',
        data: { complaint }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete complaint
   * DELETE /api/complaints/:id
   * @access Private - Admin with complaints.delete permission
   */
  async deleteComplaint(req, res, next) {
    try {
      const complaintId = parseInt(req.params.id);

      await ComplaintService.deleteComplaint(complaintId);

      res.json({
        ok: true,
        message: req.t('complaint.deleted'),
        messageKey: 'complaint.deleted',
        data: {}
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get complaint statistics
   * GET /api/complaints/statistics
   * @access Private - Admin with complaints.list permission
   */
  async getStatistics(req, res, next) {
    try {
      const statistics = await ComplaintService.getStatistics();

      res.json({
        ok: true,
        message: req.t('complaint.statisticsRetrieved'),
        messageKey: 'complaint.statisticsRetrieved',
        data: { statistics }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ComplaintController();

