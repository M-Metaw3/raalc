const BreakRequestRepository = require('@repositories/BreakRequestRepository');
const AgentSessionRepository = require('@repositories/AgentSessionRepository');
const AgentRepository = require('@repositories/AgentRepository');
const ShiftRepository = require('@repositories/ShiftRepository');
const ActivityLogRepository = require('@repositories/ActivityLogRepository');
const { ErrorHandlers } = require('@utils/ErrorHandler');

/**
 * BreakRequest Service
 * 
 * Handles break requests, approvals, and break management
 */
class BreakRequestService {
  /**
   * Request a break
   */
  async requestBreak(agentId, data) {
    const { type, requestedDuration, reason } = data;

    // Get active session
    const session = await AgentSessionRepository.findActiveSession(agentId);
    if (!session) {
      throw ErrorHandlers.badRequest('shift.noActiveSession');
    }

    if (session.status === 'on_break') {
      throw ErrorHandlers.conflict('shift.alreadyOnBreak');
    }

    // Get shift with break policy
    const shift = await ShiftRepository.findWithPolicy(session.shiftId);
    if (!shift || !shift.breakPolicy) {
      throw ErrorHandlers.notFound('shift.breakPolicyNotFound');
    }

    const policy = shift.breakPolicy;

    // Validate break request against policy
    const validation = await this._validateBreakRequest(
      agentId,
      session.id,
      type,
      requestedDuration,
      policy
    );

    if (!validation.valid) {
      throw ErrorHandlers.badRequest(validation.errorKey, validation.data);
    }

    // Determine if auto-approve
    const autoApproved = requestedDuration <= policy.autoApproveLimit && validation.valid;
    const status = autoApproved ? 'approved' : 'pending';

    // Create break request
    const breakRequest = await BreakRequestRepository.create({
      sessionId: session.id,
      agentId,
      policyId: policy.id,
      type,
      requestedDuration,
      status,
      autoApproved,
      reason,
      violatedRules: validation.warnings || null
    });

    // Log activity
    await ActivityLogRepository.logActivity(
      agentId,
      'break_request',
      `Requested ${type} break for ${requestedDuration} minutes`,
      JSON.stringify({ type, requestedDuration, autoApproved }),
      { breakId: breakRequest.id, type, requestedDuration, autoApproved },
      session.id
    );

    // If auto-approved, start break immediately
    if (autoApproved) {
      return await this.startBreak(breakRequest.id);
    }

    return {
      breakRequest,
      message: 'shift.breakRequestPending',
      requiresApproval: true
    };
  }

  /**
   * Start a break (after approval)
   */
  async startBreak(breakRequestId) {
    const breakRequest = await BreakRequestRepository.findById(breakRequestId);
    if (!breakRequest) {
      throw ErrorHandlers.notFound('shift.breakRequestNotFound');
    }

    if (breakRequest.status === 'rejected') {
      throw ErrorHandlers.badRequest('shift.breakRequestRejected');
    }

    if (breakRequest.status === 'active') {
      throw ErrorHandlers.conflict('shift.breakAlreadyActive');
    }

    if (breakRequest.status !== 'approved') {
      throw ErrorHandlers.badRequest('shift.breakNotApproved');
    }

    // Update break request status
    const updatedBreak = await BreakRequestRepository.startBreak(breakRequestId);

    // Update session status
    await AgentSessionRepository.update(breakRequest.sessionId, {
      status: 'on_break'
    });

    // Update agent status
    await AgentRepository.update(breakRequest.agentId, {
      currentStatus: 'on_break'
    });

    // Log activity
    await ActivityLogRepository.logActivity(
      breakRequest.agentId,
      'break_start',
      `Started ${breakRequest.type} break`,
      JSON.stringify({ breakId: breakRequestId, type: breakRequest.type }),
      { breakId: breakRequestId, type: breakRequest.type },
      breakRequest.sessionId
    );

    return {
      breakRequest: updatedBreak,
      message: 'shift.breakStarted'
    };
  }

  /**
   * End a break (resume work)
   */
  async endBreak(agentId) {
    // Get active break
    const breakRequest = await BreakRequestRepository.findActiveBreak(agentId);
    if (!breakRequest) {
      throw ErrorHandlers.badRequest('shift.noActiveBreak');
    }

    // End break
    const updatedBreak = await BreakRequestRepository.endBreak(breakRequest.id);

    // Update session: add break duration to total
    const session = await AgentSessionRepository.findById(breakRequest.sessionId);
    const newTotalBreakMinutes = (session.totalBreakMinutes || 0) + updatedBreak.actualDuration;

    await AgentSessionRepository.update(breakRequest.sessionId, {
      status: 'active',
      totalBreakMinutes: newTotalBreakMinutes
    });

    // Update agent status
    await AgentRepository.update(agentId, {
      currentStatus: 'active'
    });

    // Log activity
    await ActivityLogRepository.logActivity(
      agentId,
      'break_end',
      `Ended ${breakRequest.type} break (${updatedBreak.actualDuration} minutes)`,
      JSON.stringify({ 
        breakId: breakRequest.id, 
        type: breakRequest.type,
        actualDuration: updatedBreak.actualDuration 
      }),
      { 
        breakId: breakRequest.id, 
        type: breakRequest.type,
        actualDuration: updatedBreak.actualDuration 
      },
      breakRequest.sessionId
    );

    return {
      breakRequest: updatedBreak,
      actualDuration: updatedBreak.actualDuration,
      message: 'shift.breakEnded'
    };
  }

  /**
   * Get pending break requests (for admin approval)
   */
  async getPendingRequests(filters = {}) {
    return await BreakRequestRepository.findPendingRequests(filters);
  }

  /**
   * Approve break request (by admin/supervisor)
   */
  async approveBreakRequest(breakRequestId, reviewerId, notes = null) {
    const breakRequest = await BreakRequestRepository.findById(breakRequestId);
    if (!breakRequest) {
      throw ErrorHandlers.notFound('shift.breakRequestNotFound');
    }

    if (breakRequest.status !== 'pending') {
      throw ErrorHandlers.badRequest('shift.breakNotPending');
    }

    // Approve
    const approved = await BreakRequestRepository.approve(breakRequestId, reviewerId, notes);

    // Log activity
    await ActivityLogRepository.logActivity(
      breakRequest.agentId,
      'break_approved',
      `Break request approved by admin`,
      JSON.stringify({ breakId: breakRequestId, reviewerId }),
      { breakId: breakRequestId, reviewerId },
      breakRequest.sessionId
    );

    // Auto-start break
    return await this.startBreak(breakRequestId);
  }

  /**
   * Reject break request (by admin/supervisor)
   */
  async rejectBreakRequest(breakRequestId, reviewerId, reason) {
    const breakRequest = await BreakRequestRepository.findById(breakRequestId);
    if (!breakRequest) {
      throw ErrorHandlers.notFound('shift.breakRequestNotFound');
    }

    if (breakRequest.status !== 'pending') {
      throw ErrorHandlers.badRequest('shift.breakNotPending');
    }

    // Reject
    const rejected = await BreakRequestRepository.reject(breakRequestId, reviewerId, reason);

    // Log activity
    await ActivityLogRepository.logActivity(
      breakRequest.agentId,
      'break_rejected',
      `Break request rejected by admin: ${reason}`,
      JSON.stringify({ breakId: breakRequestId, reviewerId, reason }),
      { breakId: breakRequestId, reviewerId, reason },
      breakRequest.sessionId
    );

    return {
      breakRequest: rejected,
      message: 'shift.breakRequestRejected'
    };
  }

  /**
   * Get agent's today breaks
   */
  async getTodayBreaks(agentId) {
    return await BreakRequestRepository.findTodayBreaks(agentId);
  }

  // Validation helper

  /**
   * Validate break request against policy
   */
  async _validateBreakRequest(agentId, sessionId, type, duration, policy) {
    const violations = [];
    const warnings = [];

    // 1. Check duration limits
    if (duration < policy.minDuration) {
      violations.push({
        rule: 'min_duration',
        message: `Minimum break duration is ${policy.minDuration} minutes`
      });
      return {
        valid: false,
        errorKey: 'shift.breakTooShort',
        data: { minDuration: policy.minDuration, requested: duration }
      };
    }

    if (duration > policy.maxDuration) {
      violations.push({
        rule: 'max_duration',
        message: `Maximum break duration is ${policy.maxDuration} minutes`
      });
      return {
        valid: false,
        errorKey: 'shift.breakTooLong',
        data: { maxDuration: policy.maxDuration, requested: duration }
      };
    }

    // 2. Check max breaks per day
    const todayBreaksCount = await BreakRequestRepository.countTodayBreaks(agentId);
    if (todayBreaksCount >= policy.maxBreaksPerDay) {
      violations.push({
        rule: 'max_breaks',
        message: `Maximum ${policy.maxBreaksPerDay} breaks per day`
      });
      return {
        valid: false,
        errorKey: 'shift.maxBreaksReached',
        data: { maxBreaks: policy.maxBreaksPerDay }
      };
    }

    // 3. Check cooldown period
    const lastBreak = await BreakRequestRepository.findLastBreak(agentId);
    if (lastBreak && lastBreak.endTime) {
      const lastBreakEnd = new Date(lastBreak.endTime);
      const now = new Date();
      const minutesSinceLastBreak = Math.floor((now - lastBreakEnd) / 60000);

      if (minutesSinceLastBreak < policy.cooldownMinutes) {
        const remainingCooldown = policy.cooldownMinutes - minutesSinceLastBreak;
        violations.push({
          rule: 'cooldown',
          message: `Must wait ${policy.cooldownMinutes} minutes between breaks`
        });
        return {
          valid: false,
          errorKey: 'shift.breakCooldownActive',
          data: { 
            cooldownMinutes: policy.cooldownMinutes, 
            remainingMinutes: remainingCooldown 
          }
        };
      }
    }

    // 4. Check break type allowed
    if (!policy.allowedBreakTypes || !policy.allowedBreakTypes.includes(type)) {
      violations.push({
        rule: 'break_type',
        message: `Break type ${type} not allowed`
      });
      return {
        valid: false,
        errorKey: 'shift.breakTypeNotAllowed',
        data: { type, allowedTypes: policy.allowedBreakTypes }
      };
    }

    // All validations passed
    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : null
    };
  }
}

module.exports = new BreakRequestService();

