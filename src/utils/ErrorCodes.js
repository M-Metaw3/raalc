/**
 * Error Codes Enum
 * 
 * Centralized error codes for consistent error handling
 * Used with ErrorHandler class and translation system
 */

/**
 * HTTP Status Codes
 */
const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,

  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

/**
 * General Error Codes
 */
const GENERAL_ERRORS = {
  INTERNAL: 'errors.internal',
  INVALID_JSON: 'errors.invalidJson',
  BAD_REQUEST: 'errors.badRequest',
  UNAUTHORIZED: 'errors.unauthorized',
  FORBIDDEN: 'errors.forbidden',
  NOT_FOUND: 'errors.notFound',
  CONFLICT: 'errors.conflict',
  UNPROCESSABLE: 'errors.unprocessable',
  TOO_MANY_REQUESTS: 'errors.tooManyRequests',
  TOO_MANY_ATTEMPTS: 'errors.tooManyAttempts',
  SERVICE_UNAVAILABLE: 'errors.serviceUnavailable',
  VALIDATION_FAILED: 'errors.validationFailed',
  DATABASE_ERROR: 'errors.databaseError'
};

/**
 * Authentication & Authorization Error Codes
 */
const AUTH_ERRORS = {
  TOKEN_REQUIRED: 'auth.tokenRequired',
  INVALID_TOKEN: 'auth.invalidToken',
  TOKEN_EXPIRED: 'auth.tokenExpired',
  NOT_AUTHENTICATED: 'auth.notAuthenticated',
  INSUFFICIENT_PERMISSIONS: 'auth.insufficientPermissions',
  INVALID_CREDENTIALS: 'auth.invalidCredentials',
  EMAIL_ALREADY_EXISTS: 'auth.emailAlreadyExists',
  ACCOUNT_DISABLED: 'auth.accountDisabled',
  ACCOUNT_INACTIVE: 'auth.accountInactive',
  ACCOUNT_PENDING_APPROVAL: 'auth.accountPendingApproval',
  ACCOUNT_NOT_VERIFIED: 'auth.accountNotVerified',
  INVALID_CURRENT_PASSWORD: 'auth.invalidCurrentPassword',
  CANNOT_DELETE_SELF: 'auth.cannotDeleteSelf',
  ADMIN_NOT_FOUND: 'auth.adminNotFound',
  ACCESS_DENIED: 'auth.accessDenied',
  INSUFFICIENT_ROLE: 'auth.insufficientRole'
};

/**
 * User Error Codes
 */
const USER_ERRORS = {
  USER_NOT_FOUND: 'errors.userNotFound',
  MISSING_USER_IDENTIFIER: 'errors.missingUserIdentifier',
  NO_PHONE_NUMBER: 'errors.noPhoneNumber',
  INVALID_PHONE_NUMBER: 'errors.invalidPhoneNumber'
};

/**
 * File Upload Error Codes
 */
const UPLOAD_ERRORS = {
  FILE_REQUIRED: 'errors.fileRequired',
  FILE_TOO_LARGE: 'errors.fileTooLarge',
  UPLOAD_ERROR: 'errors.uploadError',
  TOO_MANY_UPLOADS: 'errors.tooManyUploads',
  INVALID_FILE_TYPE: 'errors.invalidFileType',
  INVALID_DOCUMENT_TYPE: 'errors.invalidDocumentType',
  TOO_MANY_FILES: 'errors.tooManyFiles',
  UNEXPECTED_FIELD: 'errors.unexpectedField',
  UPLOAD_LIMIT_EXCEEDED: 'errors.uploadLimitExceeded',
  NO_FILES_UPLOADED: 'errors.noFilesUploaded'
};

/**
 * Document Error Codes
 */
const DOCUMENT_ERRORS = {
  MIN_DOCUMENTS_REQUIRED: 'errors.minDocumentsRequired',
  MAX_DOCUMENTS_EXCEEDED: 'errors.maxDocumentsExceeded',
  DOCUMENT_NOT_FOUND: 'errors.documentNotFound',
  NO_DOCUMENTS_FOUND: 'errors.noDocumentsFound',
  DOCUMENT_UPLOAD_FAILED: 'errors.documentUploadFailed',
  DOCUMENT_RETRIEVAL_FAILED: 'errors.documentRetrievalFailed',
  DOCUMENT_DELETION_FAILED: 'errors.documentDeletionFailed'
};

/**
 * OTP Error Codes
 */
const OTP_ERRORS = {
  OTP_EXPIRED: 'errors.otpExpired',
  OTP_INVALID: 'errors.otpInvalid',
  OTP_MAX_ATTEMPTS_EXCEEDED: 'errors.otpMaxAttemptsExceeded',
  OTP_GENERATION_FAILED: 'errors.otpGenerationFailed',
  OTP_VERIFICATION_FAILED: 'errors.otpVerificationFailed',
  OTP_RESEND_LIMIT_EXCEEDED: 'errors.otpResendLimitExceeded',
  INVALID_OTP_TOKEN: 'errors.invalidOtpToken',
  OTP_TOKEN_EXPIRED: 'errors.otpTokenExpired'
};

/**
 * Rate Limiting Error Codes
 */
const RATE_LIMIT_ERRORS = {
  RATE_LIMIT_EXCEEDED: 'errors.rateLimitExceeded',
  VERIFY_RATE_LIMIT_EXCEEDED: 'errors.verifyRateLimitExceeded',
  FORGOT_PASSWORD_RATE_LIMIT: 'errors.forgotPasswordRateLimit'
};

/**
 * SMS Error Codes
 */
const SMS_ERRORS = {
  SMS_SEND_FAILED: 'errors.smsSendFailed'
};

/**
 * Token Error Codes
 */
const TOKEN_ERRORS = {
  INVALID_TOKEN_TYPE: 'errors.invalidTokenType',
  TOKEN_GENERATION_FAILED: 'errors.tokenGenerationFailed'
};

/**
 * Agent Error Codes
 */
const AGENT_ERRORS = {
  AGENT_NOT_FOUND: 'agent.notFound',
  NO_AVATAR: 'agent.noAvatar'
};

/**
 * Shift & Session Error Codes
 */
const SHIFT_ERRORS = {
  AGENT_NOT_FOUND: 'shift.agentNotFound',
  NO_SHIFT_ASSIGNED: 'shift.noShiftAssigned',
  ALREADY_CHECKED_IN: 'shift.alreadyCheckedIn',
  SHIFT_NOT_FOUND: 'shift.shiftNotFound',
  TOO_LATE_TO_CHECK_IN: 'shift.tooLateToCheckIn',
  NO_ACTIVE_SESSION: 'shift.noActiveSession',
  CANNOT_CHECK_OUT_ON_BREAK: 'shift.cannotCheckOutOnBreak',
  ALREADY_CHECKED_OUT: 'shift.alreadyCheckedOut',
  SESSION_NOT_FOUND: 'shift.sessionNotFound',
  NOT_YOUR_SESSION: 'shift.notYourSession'
};

/**
 * Break Error Codes
 */
const BREAK_ERRORS = {
  ALREADY_ON_BREAK: 'shift.alreadyOnBreak',
  BREAK_POLICY_NOT_FOUND: 'shift.breakPolicyNotFound',
  BREAK_TOO_SHORT: 'shift.breakTooShort',
  BREAK_TOO_LONG: 'shift.breakTooLong',
  MAX_BREAKS_REACHED: 'shift.maxBreaksReached',
  BREAK_COOLDOWN_ACTIVE: 'shift.breakCooldownActive',
  BREAK_TYPE_NOT_ALLOWED: 'shift.breakTypeNotAllowed',
  BREAK_REQUEST_NOT_FOUND: 'shift.breakRequestNotFound',
  BREAK_REQUEST_REJECTED: 'shift.breakRequestRejected',
  BREAK_ALREADY_ACTIVE: 'shift.breakAlreadyActive',
  BREAK_NOT_APPROVED: 'shift.breakNotApproved',
  NO_ACTIVE_BREAK: 'shift.noActiveBreak',
  BREAK_NOT_PENDING: 'shift.breakNotPending',
  REJECTION_REASON_REQUIRED: 'shift.rejectionReasonRequired'
};

/**
 * Success Message Codes
 */
const SUCCESS_MESSAGES = {
  // General
  CREATED: 'success.created',
  UPDATED: 'success.updated',
  DELETED: 'success.deleted',
  OPERATION_SUCCESS: 'success.operationSuccess',

  // Auth
  LOGIN_SUCCESS: 'auth.loginSuccess',
  LOGOUT_SUCCESS: 'auth.logoutSuccess',
  REGISTER_SUCCESS: 'auth.registerSuccess',
  PASSWORD_RESET_SENT: 'auth.passwordResetSent',
  PASSWORD_RESET_SUCCESS: 'auth.passwordResetSuccess',
  PASSWORD_CHANGED: 'auth.passwordChanged',
  EMAIL_VERIFIED: 'auth.emailVerified',
  OTP_VERIFIED: 'auth.otpVerified',
  OTP_RESENT: 'auth.otpResent',
  OTP_SENT: 'auth.otpSent',

  // Admin
  ADMIN_CREATED: 'auth.adminCreated',
  ADMIN_UPDATED: 'auth.adminUpdated',
  ADMIN_DELETED: 'auth.adminDeleted',
  ADMIN_ACTIVATED: 'auth.adminActivated',
  ADMIN_DEACTIVATED: 'auth.adminDeactivated',

  // Upload
  UPLOAD_SUCCESS: 'upload.success',
  AVATAR_UPLOADED: 'success.avatarUploaded',
  AVATAR_DELETED: 'success.avatarDeleted',
  AVATAR_UPDATED: 'upload.avatarUpdated',

  // Document
  DOCUMENT_UPLOAD_SUCCESS: 'document.uploadSuccess',
  DOCUMENT_DELETE_SUCCESS: 'document.deleteSuccess',

  // RBAC
  ROLES_ASSIGNED: 'rbac.rolesAssigned',
  PERMISSIONS_ASSIGNED: 'rbac.permissionsAssigned',
  ROLE_CREATED: 'rbac.roleCreated',
  ROLE_UPDATED: 'rbac.roleUpdated',
  ROLE_DELETED: 'rbac.roleDeleted',
  PERMISSION_CREATED: 'rbac.permissionCreated',
  PERMISSION_REMOVED: 'rbac.permissionRemoved',

  // Agent
  AGENT_APPROVED: 'auth.agentApproved',
  AGENT_REJECTED: 'auth.agentRejected',
  AGENT_CREATED: 'agent.createdSuccessfully',
  AGENT_FEATURED_UPDATED: 'agent.featuredUpdated',

  // User
  USER_ACTIVATED: 'auth.userActivated',
  USER_DEACTIVATED: 'auth.userDeactivated',

  // Shift
  CHECKED_IN_SUCCESS: 'shift.checkedInSuccess',
  CHECKED_IN_LATE: 'shift.checkedInLate',
  CHECKED_OUT_SUCCESS: 'shift.checkedOutSuccess',
  BREAK_REQUEST_PENDING: 'shift.breakRequestPending',
  BREAK_STARTED: 'shift.breakStarted',
  BREAK_ENDED: 'shift.breakEnded'
};

/**
 * Helper function to get all error codes
 */
function getAllErrorCodes() {
  return {
    ...GENERAL_ERRORS,
    ...AUTH_ERRORS,
    ...USER_ERRORS,
    ...UPLOAD_ERRORS,
    ...DOCUMENT_ERRORS,
    ...OTP_ERRORS,
    ...RATE_LIMIT_ERRORS,
    ...SMS_ERRORS,
    ...TOKEN_ERRORS,
    ...AGENT_ERRORS,
    ...SHIFT_ERRORS,
    ...BREAK_ERRORS
  };
}

/**
 * Helper function to get all success codes
 */
function getAllSuccessCodes() {
  return SUCCESS_MESSAGES;
}

module.exports = {
  HTTP_STATUS,
  GENERAL_ERRORS,
  AUTH_ERRORS,
  USER_ERRORS,
  UPLOAD_ERRORS,
  DOCUMENT_ERRORS,
  OTP_ERRORS,
  RATE_LIMIT_ERRORS,
  SMS_ERRORS,
  TOKEN_ERRORS,
  AGENT_ERRORS,
  SHIFT_ERRORS,
  BREAK_ERRORS,
  SUCCESS_MESSAGES,
  getAllErrorCodes,
  getAllSuccessCodes
};

