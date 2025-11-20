const logger = require('@utils/logger');

/**
 * Basic Authentication Middleware
 * 
 * For external integrations (e.g., Nazeer)
 * Validates Basic Auth credentials from environment variables
 */
function basicAuth(req, res, next) {
  const header = req.headers['authorization'];

  if (!header || !header.startsWith('Basic ')) {
    logger.warn('Missing Authorization Header', {
      ip: req.ip,
      path: req.path
    });
    
    return res.status(401).json({ 
      message: 'Missing Authorization Header',
      receivedStatusCode: 0,
      receivedStatusDescription: 'Unauthorized - Missing credentials'
    });
  }

  try {
    const encoded = header.split(' ')[1];
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    const [user, pass] = decoded.split(':');

    if (
      user !== process.env.CALLBACK_USERNAME ||
      pass !== process.env.CALLBACK_PASSWORD
    ) {
      logger.warn('Invalid Credentials', {
        ip: req.ip,
        path: req.path,
        username: user
      });
      
      return res.status(401).json({ 
        message: 'Invalid Credentials',
        receivedStatusCode: 0,
        receivedStatusDescription: 'Unauthorized - Invalid credentials'
      });
    }

    logger.info('Basic Auth successful', {
      username: user,
      path: req.path
    });

    next();
  } catch (error) {
    logger.error('Basic Auth error', {
      error: error.message,
      ip: req.ip
    });
    
    return res.status(401).json({ 
      message: 'Invalid Authorization Header',
      receivedStatusCode: 0,
      receivedStatusDescription: 'Unauthorized - Malformed credentials'
    });
  }
}

module.exports = basicAuth;

