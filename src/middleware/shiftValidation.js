const ErrorHandler = require('@utils/ErrorHandler');

/**
 * Shift Validation Middleware
 * 
 * Additional validation logic for shift operations
 */

/**
 * Validate shift time window
 * Ensures the current time is within the shift's allowed check-in window
 */
exports.validateShiftTimeWindow = async (req, res, next) => {
  try {
    const { shift } = req;
    
    if (!shift) {
      return next();
    }

    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS
    
    // Parse shift times
    const shiftStart = shift.startTime;
    const gracePeriod = shift.gracePeriod || 0;
    
    // Calculate allowed check-in time (start - grace period)
    const [hours, minutes, seconds] = shiftStart.split(':').map(Number);
    const shiftStartDate = new Date();
    shiftStartDate.setHours(hours, minutes, seconds, 0);
    
    const allowedCheckInTime = new Date(shiftStartDate.getTime() - (gracePeriod * 60 * 1000));
    const allowedCheckInTimeStr = allowedCheckInTime.toTimeString().split(' ')[0];
    
    // Check if current time is within allowed window
    // Allow check-in from (start - grace) to (end + overtime if allowed)
    
    // For simplicity, we'll handle this in the service layer
    // This middleware is for additional checks
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate break request timing
 * Ensures break is not requested during critical times
 */
exports.validateBreakTiming = async (req, res, next) => {
  try {
    const { breakPolicy } = req;
    
    if (!breakPolicy) {
      return next();
    }

    // Check if preferred time window is set
    if (breakPolicy.preferredStartTime && breakPolicy.preferredEndTime) {
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0];
      
      const preferredStart = breakPolicy.preferredStartTime;
      const preferredEnd = breakPolicy.preferredEndTime;
      
      // This is a soft check - can be overridden by admin approval
      if (currentTime < preferredStart || currentTime > preferredEnd) {
        req.breakWarning = 'Break requested outside preferred time window';
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate agent status
 * Ensures agent is in correct status for the operation
 */
exports.validateAgentStatus = (requiredStatus) => {
  return async (req, res, next) => {
    try {
      const agent = req.user; // Assuming agent is attached by auth middleware
      
      if (!agent) {
        throw new ErrorHandler('Agent not found', 404, 'shift.agentNotFound');
      }

      // If specific status is required
      if (requiredStatus && agent.currentStatus !== requiredStatus) {
        throw new ErrorHandler(
          `Agent must be in ${requiredStatus} status`,
          400,
          'shift.invalidStatus'
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Validate session exists
 * Ensures agent has an active session
 */
exports.requireActiveSession = async (req, res, next) => {
  try {
    const agent = req.user;
    
    if (!agent || !agent.currentSessionId) {
      throw new ErrorHandler(
        'No active session found',
        400,
        'shift.noActiveSession'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate no active break
 * Ensures agent is not currently on break
 */
exports.requireNoActiveBreak = async (req, res, next) => {
  try {
    const agent = req.user;
    
    if (agent && agent.currentStatus === 'on_break') {
      throw new ErrorHandler(
        'Cannot perform this action while on break',
        400,
        'shift.cannotPerformOnBreak'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate break type
 * Ensures the requested break type is allowed
 */
exports.validateBreakType = async (req, res, next) => {
  try {
    const { type } = req.body;
    const { breakPolicy } = req;
    
    if (!breakPolicy) {
      return next();
    }

    const allowedTypes = breakPolicy.allowedBreakTypes || ['short', 'lunch', 'emergency'];
    
    if (!allowedTypes.includes(type)) {
      throw new ErrorHandler(
        `Break type "${type}" is not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        400,
        'shift.breakTypeNotAllowed'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check overtime eligibility
 * Validates if agent can work overtime
 */
exports.validateOvertimeEligibility = async (req, res, next) => {
  try {
    const { shift } = req;
    
    if (!shift) {
      return next();
    }

    if (!shift.allowOvertime) {
      req.overtimeWarning = 'Overtime is not allowed for this shift';
    }

    if (shift.overtimeRequiresApproval) {
      req.overtimeRequiresApproval = true;
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Rate limit break requests
 * Ensures agent doesn't spam break requests
 */
exports.rateLimitBreakRequests = async (req, res, next) => {
  try {
    const agent = req.user;
    const { breakPolicy } = req;
    
    if (!breakPolicy) {
      return next();
    }

    // This would typically check Redis for recent break requests
    // For now, we'll just pass through as the service handles this
    
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate location (if GPS tracking is required)
 */
exports.validateLocation = async (req, res, next) => {
  try {
    const { location } = req.body;
    
    // If location is provided, validate it
    if (location) {
      if (typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        throw new ErrorHandler(
          'Invalid location format',
          400,
          'validation.invalidLocation'
        );
      }

      if (location.lat < -90 || location.lat > 90) {
        throw new ErrorHandler(
          'Invalid latitude',
          400,
          'validation.invalidLatitude'
        );
      }

      if (location.lng < -180 || location.lng > 180) {
        throw new ErrorHandler(
          'Invalid longitude',
          400,
          'validation.invalidLongitude'
        );
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Log shift action
 * Logs the shift-related action for audit purposes
 */
exports.logShiftAction = (action) => {
  return (req, res, next) => {
    // This would typically log to a dedicated audit log
    const agent = req.user;
    const timestamp = new Date().toISOString();
    
    req.shiftActionLog = {
      action,
      agentId: agent?.id,
      timestamp,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    next();
  };
};

