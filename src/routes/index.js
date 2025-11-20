const express = require('express');
const router = express.Router();

// Import route modules for three separate user types
const adminRoutes = require('./adminRoutes');
const userRoutes = require('./userRoutes');
const agentRoutes = require('./agentRoutes');
const rbacRoutes = require('./rbacRoutes');
const departmentRoutes = require('./departmentRoutes');
const serviceRoutes = require('./serviceRoutes');
const applicationTypeRoutes = require('./applicationTypeRoutes');
const additionalServiceRoutes = require('./additionalServiceRoutes');
const serviceRequestRoutes = require('./serviceRequestRoutes');
// const chatRoutes = require('./chatRoutes');
const callbackRoutes = require('./callbackRoutes');

// Register routes
router.use('/admins', adminRoutes);
router.use('/users', userRoutes);
router.use('/agents', agentRoutes);
router.use('/rbac', rbacRoutes);
router.use('/departments', departmentRoutes);
router.use('/services', serviceRoutes);
router.use('/application-types', applicationTypeRoutes);
router.use('/additional-services', additionalServiceRoutes);
router.use('/service-requests', serviceRequestRoutes);
// router.use('/chats', chatRoutes);
router.use('/callback', callbackRoutes);

// API version info
router.get('/', (req, res) => {
  res.json({
    ok: true,
    message: 'RAALC API is running',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;

