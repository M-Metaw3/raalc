const { validationResult } = require('express-validator');

/**
 * Middleware to handle express-validator validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: req.t(err.msg, { field: err.path || err.param }),
      value: err.value
    }));
    
    return res.status(422).json({
      ok: false,
      message: req.t('errors.validationFailed'),
      messageKey: 'errors.validationFailed',
      errors: formattedErrors
    });
  }
  
  next();
};

module.exports = { validate };

