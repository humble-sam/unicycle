const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const db = require('../../config/database');
const { authenticateAdmin, logActivity, getAdminSecret } = require('../../middleware/adminAuth');

// Rate limiting for admin login (stricter than user login)
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: { error: 'Too many login attempts, please try again later' }
});

// Admin Login
router.post('/login', adminLoginLimiter, [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Find admin by email
    const [admins] = await db.query(
      'SELECT * FROM admins WHERE email = ?',
      [email]
    );

    if (admins.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const admin = admins[0];

    // Check if admin is active
    if (!admin.is_active) {
      return res.status(403).json({ error: 'Admin account is deactivated' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last login
    await db.query(
      'UPDATE admins SET last_login = NOW() WHERE id = ?',
      [admin.id]
    );

    // Generate JWT token (shorter expiry for admins - 8 hours)
    const token = jwt.sign(
      { adminId: admin.id, role: admin.role },
      getAdminSecret(),
      { expiresIn: process.env.JWT_ADMIN_EXPIRES_IN || '8h' }
    );

    // Log activity
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(admin.id, 'login', 'admin', admin.id, { email: admin.email }, ip);

    res.json({
      admin: {
        id: admin.id,
        email: admin.email,
        fullName: admin.full_name,
        role: admin.role
      },
      accessToken: token
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Get current admin
router.get('/me', authenticateAdmin, async (req, res) => {
  try {
    const [admins] = await db.query(
      'SELECT id, email, full_name, role, is_active, last_login, created_at FROM admins WHERE id = ?',
      [req.admin.id]
    );

    if (admins.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    const admin = admins[0];
    res.json({
      id: admin.id,
      email: admin.email,
      fullName: admin.full_name,
      role: admin.role,
      isActive: admin.is_active,
      lastLogin: admin.last_login,
      createdAt: admin.created_at
    });
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({ error: 'Failed to get admin info' });
  }
});

// Admin logout
router.post('/logout', authenticateAdmin, async (req, res) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(req.admin.id, 'logout', 'admin', req.admin.id, null, ip);
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Admin logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Change password
router.post('/change-password', authenticateAdmin, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Get current admin
    const [admins] = await db.query(
      'SELECT password_hash FROM admins WHERE id = ?',
      [req.admin.id]
    );

    if (admins.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, admins[0].password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.query(
      'UPDATE admins SET password_hash = ? WHERE id = ?',
      [newPasswordHash, req.admin.id]
    );

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(req.admin.id, 'password_change', 'admin', req.admin.id, null, ip);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
