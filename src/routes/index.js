const express = require('express');
const router = express.Router();

// Import route modules for three separate user types
const adminRoutes = require('./adminRoutes');
const userRoutes = require('./userRoutes');
const agentRoutes = require('./agentRoutes');
const rbacRoutes = require('./rbacRoutes');

// Register routes
router.use('/admins', adminRoutes);
router.use('/users', userRoutes);
router.use('/agents', agentRoutes);
router.use('/rbac', rbacRoutes);

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

