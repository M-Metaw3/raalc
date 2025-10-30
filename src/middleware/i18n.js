const i18next = require('../config/i18n');

/**
 * i18n middleware to attach translation function to request
 */
const i18nMiddleware = (req, res, next) => {
  // Get language from header, query param, or default to 'en'
  const language = req.headers['accept-language']?.split(',')[0]?.split('-')[0] 
    || req.query.lang 
    || 'en';
  
  // Store language in request
  req.language = language;
  
  // Attach translation function
  req.t = (key, data = {}) => {
    return i18next.t(key, { lng: language, ...data });
  };
  
  next();
};

module.exports = i18nMiddleware;

