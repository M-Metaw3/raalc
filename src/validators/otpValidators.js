const { body } = require('express-validator');
const { validate } = require('@middleware/validation');

/**
 * OTP Validators
 * 
 * Validation rules for OTP-related requests
 */

/**
 * Verify OTP validation
 */
const verifyOTP = [
  body('registerToken')
    .trim()
    .notEmpty()
    .withMessage('validation.tokenRequired'),
  
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('validation.otpRequired')
    .isLength({ min: 6, max: 6 })
    .withMessage('validation.invalidOtpLength')
    .isNumeric()
    .withMessage('validation.invalidOtpFormat'),
  
  validate
];

/**
 * Resend OTP validation
 */
const resendOTP = [
  body('registerToken')
    .trim()
    .notEmpty()
    .withMessage('validation.tokenRequired'),
  
  validate
];

/**
 * Verify login OTP validation
 */
const verifyLoginOTP = [
  body('loginToken')
    .trim()
    .notEmpty()
    .withMessage('validation.tokenRequired'),
  
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('validation.otpRequired')
    .isLength({ min: 6, max: 6 })
    .withMessage('validation.invalidOtpLength')
    .isNumeric()
    .withMessage('validation.invalidOtpFormat'),
  
  body('deviceId')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('validation.invalidDeviceId'),
  
  body('fcmToken')
    .optional()
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('validation.invalidFcmToken'),
  
  validate
];

/**
 * Forgot password validation
 */
const forgotPassword = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('validation.emailRequired')
    .isEmail()
    .withMessage('validation.invalidEmail')
    .normalizeEmail(),
  
  validate
];

/**
 * Reset password validation
 */
const resetPassword = [
  body('resetToken')
    .trim()
    .notEmpty()
    .withMessage('validation.tokenRequired'),
  
  body('otp')
    .trim()
    .notEmpty()
    .withMessage('validation.otpRequired')
    .isLength({ min: 6, max: 6 })
    .withMessage('validation.invalidOtpLength')
    .isNumeric()
    .withMessage('validation.invalidOtpFormat'),
  
  body('newPassword')
    .trim()
    .notEmpty()
    .withMessage('validation.passwordRequired')
    .isLength({ min: 8 })
    .withMessage('validation.passwordMinLength')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('validation.passwordStrength'),
  
  validate
];

module.exports = {
  verifyOTP,
  resendOTP,
  verifyLoginOTP,
  forgotPassword,
  resetPassword
};

