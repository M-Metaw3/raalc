const AgentSessionRepository = require('@repositories/AgentSessionRepository');
const BreakRequestRepository = require('@repositories/BreakRequestRepository');
const ShiftRepository = require('@repositories/ShiftRepository');
const ActivityLogRepository = require('@repositories/ActivityLogRepository');
const AgentRepository = require('@repositories/AgentRepository');
const { ErrorHandlers } = require('@utils/ErrorHandler');

/**
 * AgentSession Service
 * 
 * Handles agent check-in, check-out, and session management
 */
class AgentSessionService {
  /**
   * Check-in agent (start work session)
   */
  async checkIn(agentId, ipAddress = null, location = null) {
    // Get agent with shift
    const agent = await AgentRepository.findById(agentId);
    if (!agent) {
      throw ErrorHandlers.notFound('shift.agentNotFound');
    }

    if (!agent.shiftId) {
      throw ErrorHandlers.badRequest('shift.noShiftAssigned');
    }

    // Check if already checked in today
    const existingSession = await AgentSessionRepository.findTodaySession(agentId);
    if (existingSession) {
      throw ErrorHandlers.conflict('shift.alreadyCheckedIn');
    }

    // Get shift details
    const shift = await ShiftRepository.findWithPolicy(agent.shiftId);
    if (!shift) {
      throw ErrorHandlers.notFound('shift.shiftNotFound');
    }

    // Validate check-in time
    const now = new Date();
    const currentTime = now.toTimeString().substring(0, 8); // HH:MM:SS
    const shiftStart = shift.startTime;
    const shiftEnd = shift.endTime;

    // Check if within shift window (with grace period)
    const checkInTime = this._parseTime(currentTime);
    const shiftStartTime = this._parseTime(shiftStart);
    const shiftEndTime = this._parseTime(shiftEnd);

    // Convert grace period to milliseconds
    const graceMs = (shift.gracePeriod || 0) * 60 * 1000;
    const gracePeriodEnd = new Date(shiftStartTime.getTime() + graceMs);

    let checkInStatus = 'on_time';
    let lateMinutes = 0;

    if (checkInTime < shiftStartTime) {
      // Early check-in
      checkInStatus = 'early';
    } else if (checkInTime > gracePeriodEnd) {
      // Late (beyond grace period)
      checkInStatus = 'late';
      lateMinutes = Math.floor((checkInTime - gracePeriodEnd) / 60000);
    } else if (checkInTime > shiftStartTime) {
      // Within grace period
      checkInStatus = 'on_time';
      lateMinutes = Math.floor((checkInTime - shiftStartTime) / 60000);
    }

    // Validate if check-in is allowed (not too late)
    const maxLateMinutes = (shift.gracePeriod || 0) + 60; // Grace + 1 hour max
    if (lateMinutes > maxLateMinutes) {
      throw ErrorHandlers.badRequest('shift.tooLateToCheckIn', {
        lateMinutes,
        maxAllowed: maxLateMinutes
      });
    }

    // Create session
    const today = now.toISOString().split('T')[0];
    const session = await AgentSessionRepository.create({
      agentId,
      shiftId: shift.id,
      date: today,
      checkIn: now,
      checkInStatus,
      lateMinutes,
      status: 'active',
      checkInIp: ipAddress,
      checkInLocation: location
    });

    // Update agent status
    await AgentRepository.update(agentId, {
      currentStatus: lateMinutes > 0 ? 'late' : 'active',
      currentSessionId: session.id
    });

    // Log activity
    await ActivityLogRepository.logActivity(
      agentId,
      'check_in',
      `Agent checked in at ${currentTime}${lateMinutes > 0 ? ` (${lateMinutes} minutes late)` : ''}`,
      JSON.stringify({ checkInStatus, lateMinutes, shiftName: shift.name }),
      { shiftId: shift.id, checkInStatus, lateMinutes },
      session.id
    );

    return {
      session,
      shift,
      status: checkInStatus,
      lateMinutes,
      message: lateMinutes > 0 
        ? `shift.checkedInLate` 
        : 'shift.checkedInSuccess'
    };
  }

  /**
   * Check-out agent (end work session)
   */
  async checkOut(agentId, ipAddress = null, location = null) {
    // Get today's session
    const session = await AgentSessionRepository.findTodaySession(agentId);
    if (!session) {
      throw ErrorHandlers.notFound('shift.noActiveSession');
    }

    if (session.status === 'on_break') {
      throw ErrorHandlers.badRequest('shift.cannotCheckOutOnBreak');
    }

    if (session.status === 'completed') {
      throw ErrorHandlers.conflict('shift.alreadyCheckedOut');
    }

    const now = new Date();
    const checkInTime = new Date(session.checkIn);
    
    // Calculate total time
    const totalMinutes = Math.floor((now - checkInTime) / 60000);
    const totalBreakMinutes = session.totalBreakMinutes || 0;
    const totalWorkMinutes = totalMinutes - totalBreakMinutes;

    // Calculate overtime (if applicable)
    const shift = await ShiftRepository.findById(session.shiftId);
    const shiftDurationMinutes = this._calculateShiftDuration(shift.startTime, shift.endTime);
    const overtimeMinutes = Math.max(0, totalWorkMinutes - shiftDurationMinutes);

    // Update session
    const updatedSession = await AgentSessionRepository.update(session.id, {
      checkOut: now,
      totalWorkMinutes,
      overtimeMinutes,
      status: 'completed',
      checkOutIp: ipAddress,
      checkOutLocation: location
    });

    // Update agent status
    await AgentRepository.update(agentId, {
      currentStatus: 'offline',
      currentSessionId: null
    });

    // Log activity
    await ActivityLogRepository.logActivity(
      agentId,
      'check_out',
      `Agent checked out. Total work: ${totalWorkMinutes} minutes${overtimeMinutes > 0 ? ` (Overtime: ${overtimeMinutes} minutes)` : ''}`,
      JSON.stringify({ totalWorkMinutes, totalBreakMinutes, overtimeMinutes }),
      { totalWorkMinutes, totalBreakMinutes, overtimeMinutes },
      session.id
    );

    return {
      session: updatedSession,
      summary: {
        totalMinutes,
        breakMinutes: totalBreakMinutes,
        workMinutes: totalWorkMinutes,
        overtimeMinutes,
        numberOfBreaks: await BreakRequestRepository.countTodayBreaks(agentId)
      },
      message: 'shift.checkedOutSuccess'
    };
  }

  /**
   * Get agent's current session status
   */
  async getStatus(agentId) {
    const session = await AgentSessionRepository.findActiveSession(agentId);
    if (!session) {
      return {
        hasActiveSession: false,
        status: 'offline',
        message: 'shift.noActiveSession'
      };
    }

    const agent = await AgentRepository.findById(agentId);
    const breaks = await BreakRequestRepository.findTodayBreaks(agentId);
    const activeBreak = await BreakRequestRepository.findActiveBreak(agentId);

    const now = new Date();
    const checkInTime = new Date(session.checkIn);
    const elapsedMinutes = Math.floor((now - checkInTime) / 60000);
    const workMinutes = elapsedMinutes - (session.totalBreakMinutes || 0);

    return {
      hasActiveSession: true,
      session: {
        id: session.id,
        checkIn: session.checkIn,
        status: session.status,
        lateMinutes: session.lateMinutes
      },
      shift: session.shift,
      currentStatus: agent.currentStatus,
      activeBreak: activeBreak ? {
        id: activeBreak.id,
        type: activeBreak.type,
        startTime: activeBreak.startTime,
        requestedDuration: activeBreak.requestedDuration
      } : null,
      todayStats: {
        elapsedMinutes,
        workMinutes,
        breakMinutes: session.totalBreakMinutes || 0,
        numberOfBreaks: breaks.length
      }
    };
  }

  /**
   * Get session details
   */
  async getSessionDetails(sessionId) {
    const session = await AgentSessionRepository.findById(sessionId);
    if (!session) {
      throw ErrorHandlers.notFound('shift.sessionNotFound');
    }

    const breaks = await BreakRequestRepository.findBySession(sessionId);
    const activities = await ActivityLogRepository.findBySession(sessionId);

    return {
      session,
      breaks,
      activities
    };
  }

  /**
   * Get agent's session history
   */
  async getHistory(agentId, startDate, endDate) {
    const sessions = await AgentSessionRepository.findByDateRange(startDate, endDate, { agentId });
    
    const summary = {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      totalWorkMinutes: sessions.reduce((sum, s) => sum + (s.totalWorkMinutes || 0), 0),
      totalBreakMinutes: sessions.reduce((sum, s) => sum + (s.totalBreakMinutes || 0), 0),
      totalLateMinutes: sessions.reduce((sum, s) => sum + (s.lateMinutes || 0), 0),
      totalOvertimeMinutes: sessions.reduce((sum, s) => sum + (s.overtimeMinutes || 0), 0)
    };

    return {
      sessions,
      summary
    };
  }

  // Helper methods

  /**
   * Parse time string to Date object (for comparison)
   */
  _parseTime(timeString) {
    const [hours, minutes, seconds] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, seconds || 0, 0);
    return date;
  }

  /**
   * Calculate shift duration in minutes
   */
  _calculateShiftDuration(startTime, endTime) {
    const start = this._parseTime(startTime);
    const end = this._parseTime(endTime);
    return Math.floor((end - start) / 60000);
  }
}

module.exports = new AgentSessionService();

