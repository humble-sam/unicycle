const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { authenticateAdmin, isSuperAdmin, logActivity } = require('../../middleware/adminAuth');
const { sanitizeBody } = require('../../middleware/sanitize');

// Apply auth to all routes - only super_admin can manage admins
router.use(authenticateAdmin);
router.use(isSuperAdmin);

// Validation rules
const adminValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('full_name').trim().notEmpty().withMessage('Full name is required'),
  body('role').isIn(['super_admin', 'admin', 'moderator']).withMessage('Invalid role')
];

// Get all admins
router.get('/', async (req, res) => {
  try {
    const [admins] = await db.query(
      'SELECT id, email, full_name, role, is_active, last_login, created_at FROM admins ORDER BY created_at DESC'
    );

    res.json({ admins });
  } catch (error) {
    console.error('Get admins error:', error);
    res.status(500).json({ error: 'Failed to fetch admins' });
  }
});

// Get single admin
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [admins] = await db.query(
      'SELECT id, email, full_name, role, is_active, last_login, created_at FROM admins WHERE id = ?',
      [id]
    );

    if (admins.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    res.json(admins[0]);
  } catch (error) {
    console.error('Get admin error:', error);
    res.status(500).json({ error: 'Failed to fetch admin' });
  }
});

// Create admin
router.post('/', sanitizeBody, adminValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password, full_name, role } = req.body;

    // Check if admin exists
    const [existing] = await db.query('SELECT id FROM admins WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const adminId = uuidv4();

    await db.query(
      'INSERT INTO admins (id, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [adminId, email, passwordHash, full_name, role || 'admin']
    );

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(req.admin.id, 'create_admin', 'admin', adminId, { email, role }, ip);

    res.status(201).json({ message: 'Admin created successfully', id: adminId });
  } catch (error) {
    console.error('Create admin error:', error);
    res.status(500).json({ error: 'Failed to create admin' });
  }
});

// Update admin
router.put('/:id', sanitizeBody, [
  body('full_name').optional().trim().notEmpty(),
  body('role').optional().isIn(['super_admin', 'admin', 'moderator']),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { full_name, role, is_active } = req.body;

    // Check admin exists
    const [admins] = await db.query('SELECT id FROM admins WHERE id = ?', [id]);
    if (admins.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Prevent deactivating yourself
    if (id === req.admin.id && is_active === false) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }

    const updates = [];
    const params = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (role !== undefined) {
      updates.push('role = ?');
      params.push(role);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      params.push(is_active);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      params.push(id);

      await db.query(
        `UPDATE admins SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(req.admin.id, 'update_admin', 'admin', id, { updates: req.body }, ip);

    res.json({ message: 'Admin updated successfully' });
  } catch (error) {
    console.error('Update admin error:', error);
    res.status(500).json({ error: 'Failed to update admin' });
  }
});

// Change admin password
router.post('/:id/password', [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { password } = req.body;

    // Check admin exists
    const [admins] = await db.query('SELECT id FROM admins WHERE id = ?', [id]);
    if (admins.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12);

    await db.query('UPDATE admins SET password_hash = ? WHERE id = ?', [passwordHash, id]);

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(req.admin.id, 'change_admin_password', 'admin', id, null, ip);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change admin password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Delete admin
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check admin exists
    const [admins] = await db.query('SELECT id, email FROM admins WHERE id = ?', [id]);
    if (admins.length === 0) {
      return res.status(404).json({ error: 'Admin not found' });
    }

    // Prevent deleting yourself
    if (id === req.admin.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await db.query('DELETE FROM admins WHERE id = ?', [id]);

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(req.admin.id, 'delete_admin', 'admin', id, { email: admins[0].email }, ip);

    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    res.status(500).json({ error: 'Failed to delete admin' });
  }
});

module.exports = router;
