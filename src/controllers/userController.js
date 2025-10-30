const UserService = require('@services/UserService');

/**
 * User Controller
 * 
 * Handles all user-related HTTP requests
 */
class UserController {
  /**
   * Register a new user
   * POST /api/users/register
   * 
   * @access Public
   */
  async register(req, res, next) {
    try {
      const { fullName, email, password, phone } = req.body;
      const returnOTP = process.env.NODE_ENV !== 'production'; // Auto in dev mode

      const result = await UserService.register({
        fullName,
        email,
        password,
        phone
      }, returnOTP);

      res.status(201).json({
        ok: true,
        message: req.t('auth.registerSuccess'),
        messageKey: 'auth.registerSuccess',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * User login (with device verification)
   * Supports login with email or phone number
   * POST /api/users/login
   * 
   * @access Public
   */
  async login(req, res, next) {
    try {
      const { identifier, password, deviceId, fcmToken } = req.body; // identifier can be email or phone
      const ip = req.headers['x-forwarded-for'] || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress;
      const returnOTP = process.env.NODE_ENV !== 'production'; // Auto in dev mode

      const result = await UserService.login(identifier, password, ip, deviceId, fcmToken, returnOTP);

      // If OTP required for new device
      if (result.requiresOTP) {
        return res.status(200).json({
          ok: true,
          message: req.t('auth.otpRequired'),
          messageKey: 'auth.otpRequired',
          data: result
        });
      }

      // If documents required
      if (result.requiresDocuments) {
        return res.status(200).json({
          ok: true,
          message: req.t('document.documentsRequired'),
          messageKey: 'document.documentsRequired',
          data: result
        });
      }

      res.json({
        ok: true,
        message: req.t('auth.loginSuccess'),
        messageKey: 'auth.loginSuccess',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user profile
   * GET /api/users/me
   * 
   * @access Private - User only
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await UserService.getProfile(userId);

      res.json({
        ok: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change user password
   * POST /api/users/change-password
   * 
   * @access Private - User only
   */
  async changePassword(req, res, next) {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      const result = await UserService.changePassword(
        userId,
        currentPassword,
        newPassword
      );

      res.json({
        ok: true,
        message: req.t('auth.passwordChanged'),
        messageKey: 'auth.passwordChanged',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh user token
   * POST /api/users/refresh-token
   * 
   * @access Public
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await UserService.refreshToken(refreshToken);

      res.json({
        ok: true,
        message: req.t('auth.tokenRefreshed'),
        messageKey: 'auth.tokenRefreshed',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify OTP after registration
   * POST /api/users/verify-otp
   * 
   * @access Public
   */
  async verifyOTP(req, res, next) {
    try {
      const { registerToken, otp } = req.body;
      const result = await UserService.verifyRegistrationOTP(registerToken, otp);

      // If documents required
      if (result.requiresDocuments) {
        return res.status(200).json({
          ok: true,
          message: req.t('document.documentsRequired'),
          messageKey: 'document.documentsRequired',
          data: result
        });
      }

      res.json({
        ok: true,
        message: req.t('auth.otpVerified'),
        messageKey: 'auth.otpVerified',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Resend OTP
   * POST /api/users/resend-otp
   * 
   * @access Public
   */
  async resendOTP(req, res, next) {
    try {
      const { registerToken } = req.body;
      const returnOTP = process.env.NODE_ENV !== 'production'; // Auto in dev mode
      
      const result = await UserService.resendRegistrationOTP(registerToken, returnOTP);

      res.json({
        ok: true,
        message: req.t('auth.otpResent'),
        messageKey: 'auth.otpResent',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify login OTP (for new device)
   * POST /api/users/verify-login-otp
   * 
   * @access Public
   */
  async verifyLoginOTP(req, res, next) {
    try {
      const { loginToken, otp, deviceId, fcmToken } = req.body;
      const ip = req.headers['x-forwarded-for'] || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress;

      const result = await UserService.verifyLoginOTP(loginToken, otp, ip, deviceId, fcmToken);

      // If documents required
      if (result.requiresDocuments) {
        return res.status(200).json({
          ok: true,
          message: req.t('document.documentsRequired'),
          messageKey: 'document.documentsRequired',
          data: result
        });
      }

      res.json({
        ok: true,
        message: req.t('auth.loginSuccess'),
        messageKey: 'auth.loginSuccess',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Forgot password - send OTP
   * POST /api/users/forgot-password
   * 
   * @access Public
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      const returnOTP = process.env.NODE_ENV !== 'production'; // Auto in dev mode
      
      const result = await UserService.forgotPassword(email, returnOTP);

      res.json({
        ok: true,
        message: req.t('auth.otpSent'),
        messageKey: 'auth.otpSent',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reset password with OTP
   * POST /api/users/reset-password
   * 
   * @access Public
   */
  async resetPassword(req, res, next) {
    try {
      const { resetToken, otp, newPassword } = req.body;
      const result = await UserService.resetPassword(resetToken, otp, newPassword);

      res.json({
        ok: true,
        message: req.t('auth.passwordResetSuccess'),
        messageKey: 'auth.passwordResetSuccess',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all users (Admin only)
   * GET /api/users/list
   * 
   * @access Private - Admin only
   */
  async getAllUsers(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {
        isActive: req.query.isActive === 'true' ? true : 
                  req.query.isActive === 'false' ? false : undefined,
        search: req.query.search
      };

      const result = await UserService.getAllUsers(filters, page, limit);

      res.json({
        ok: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate user (Admin only)
   * POST /api/users/:userId/deactivate
   * 
   * @access Private - Admin only
   */
  async deactivateUser(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await UserService.deactivateUser(parseInt(userId));

      res.json({
        ok: true,
        message: req.t('auth.userDeactivated'),
        messageKey: 'auth.userDeactivated',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate user (Admin only)
   * POST /api/users/:userId/activate
   * 
   * @access Private - Admin only
   */
  async activateUser(req, res, next) {
    try {
      const { userId } = req.params;
      const result = await UserService.activateUser(parseInt(userId));

      res.json({
        ok: true,
        message: req.t('auth.userActivated'),
        messageKey: 'auth.userActivated',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload user avatar
   * PATCH /api/users/avatar
   * 
   * @access Private - User only
   */
  async uploadAvatar(req, res, next) {
    try {
      const userId = req.user.id;
      const UploadService = require('@services/UploadService');

      if (!req.file) {
        return res.status(400).json({
          ok: false,
          message: req.t('errors.fileRequired'),
          messageKey: 'errors.fileRequired',
          statusCode: 400
        });
      }

      // Get file URL
      const avatarUrl = UploadService.getFileUrl(req.file.path);

      // Update user avatar
      const result = await UserService.updateAvatar(userId, avatarUrl);

      res.json({
        ok: true,
        message: req.t('success.avatarUploaded'),
        messageKey: 'success.avatarUploaded',
        data: {
          user: result.user,
          file: {
            filename: req.file.filename,
            url: avatarUrl,
            size: req.file.size
          }
        }
      });
    } catch (error) {
      // Clean up file on error
      if (req.file) {
        const UploadService = require('@services/UploadService');
        UploadService.cleanupFiles(req.file);
      }
      next(error);
    }
  }

  /**
   * Delete user avatar
   * DELETE /api/users/avatar
   * 
   * @access Private - User only
   */
  async deleteAvatar(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await UserService.deleteAvatar(userId);

      res.json({
        ok: true,
        message: req.t('success.avatarDeleted'),
        messageKey: 'success.avatarDeleted',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload documents
   * POST /api/users/documents
   * 
   * @access Private - User only
   */
  async uploadDocuments(req, res, next) {
    try {
      const userId = req.user.id;
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({
          ok: false,
          message: req.t('errors.noFilesUploaded'),
          messageKey: 'errors.noFilesUploaded'
        });
      }

      const result = await UserService.uploadDocuments(userId, files);

      res.status(200).json({
        ok: true,
        message: req.t('document.uploadSuccess'),
        messageKey: 'document.uploadSuccess',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user documents
   * GET /api/users/documents
   * 
   * @access Private - User only
   */
  async getDocuments(req, res, next) {
    try {
      const userId = req.user.id;
      const result = await UserService.getDocuments(userId);

      res.json({
        ok: true,
        message: req.t('document.retrievalSuccess'),
        messageKey: 'document.retrievalSuccess',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a document
   * DELETE /api/users/documents/:documentId
   * 
   * @access Private - User only
   */
  async deleteDocument(req, res, next) {
    try {
      const userId = req.user.id;
      const { documentId } = req.params;

      const result = await UserService.deleteDocument(userId, documentId);

      res.json({
        ok: true,
        message: req.t('document.deleteSuccess'),
        messageKey: 'document.deleteSuccess',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();

