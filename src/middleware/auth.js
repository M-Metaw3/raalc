const jwt = require('jsonwebtoken');
const { ErrorHandlers } = require('../utils/ErrorHandler');

/**
 * Authentication middleware - verifies JWT token
 */
const authenticate = (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw ErrorHandlers.unauthorized('auth.tokenRequired');
    }
    
    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(ErrorHandlers.unauthorized('auth.invalidToken'));
    }
    if (error.name === 'TokenExpiredError') {
      return next(ErrorHandlers.unauthorized('auth.tokenExpired'));
    }
    next(error);
  }
};

/**
 * Authorization middleware - checks user types
 * @param {...string} allowedUserTypes - User types that are allowed to access the route (ADMIN, USER, AGENT)
 */
const authorize = (...allowedUserTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ErrorHandlers.unauthorized('auth.notAuthenticated'));
    }
    
    if (!allowedUserTypes.includes(req.user.userType)) {
      return next(ErrorHandlers.forbidden('auth.insufficientPermissions'));
    }
    
    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }
  } catch (error) {
    // Ignore errors for optional auth
  }
  
  next();
};

module.exports = { authenticate, authorize, optionalAuth };

