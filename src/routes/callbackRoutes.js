const express = require('express');
const router = express.Router();
const callbackController = require('@controllers/callbackController');
const basicAuth = require('@middleware/basicAuth');

/**
 * Callback Routes
 * 
 * Routes for receiving callbacks from external integrations (e.g., Nazeer)
 * All routes require Basic Authentication
 */

/**
 * @route   POST /api/callback
 * @desc    Receive callback from Nazeer integration
 * @access  Basic Auth
 */
router.post('/', basicAuth, callbackController.receiveCallback);

/**
 * @route   GET /api/callback/test
 * @desc    Test Basic Auth configuration
 * @access  Basic Auth
 */
router.get('/test', basicAuth, callbackController.testCallback);

module.exports = router;

