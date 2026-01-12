const express = require('express');
const router = express.Router();

// Import admin routes
const authRoutes = require('./auth');
const dashboardRoutes = require('./dashboard');
const usersRoutes = require('./users');
const productsRoutes = require('./products');
const sellersRoutes = require('./sellers');
const databaseRoutes = require('./database');
const settingsRoutes = require('./settings');
const reportsRoutes = require('./reports');
const adminsRoutes = require('./admins');

// Mount routes
router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/products', productsRoutes);
router.use('/sellers', sellersRoutes);
router.use('/database', databaseRoutes);
router.use('/settings', settingsRoutes);
router.use('/reports', reportsRoutes);
router.use('/admins', adminsRoutes);

// Health check for admin API
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'admin-api' });
});

module.exports = router;
