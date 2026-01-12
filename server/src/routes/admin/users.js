const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../../config/database');
const { authenticateAdmin, isAdmin, logActivity } = require('../../middleware/adminAuth');
const { sanitizeBody } = require('../../middleware/sanitize');

// Apply auth to all routes
router.use(authenticateAdmin);

// Get all users (paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const college = req.query.college || '';
    const status = req.query.status || ''; // 'active', 'suspended', 'all'
    const sort = req.query.sort || 'created_at';
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

    let whereClause = '1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (u.email LIKE ? OR p.full_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (college) {
      whereClause += ' AND p.college = ?';
      params.push(college);
    }

    if (status === 'active') {
      whereClause += ' AND (u.is_suspended = FALSE OR u.is_suspended IS NULL)';
    } else if (status === 'suspended') {
      whereClause += ' AND u.is_suspended = TRUE';
    }

    // Get users
    const [users] = await db.query(`
      SELECT
        u.id,
        u.email,
        u.email_verified,
        u.created_at,
        u.last_sign_in,
        u.is_suspended,
        u.suspension_reason,
        p.full_name,
        p.college,
        p.phone,
        p.avatar_url,
        (SELECT COUNT(*) FROM products WHERE user_id = u.id) as products_count,
        (SELECT COUNT(*) FROM wishlist WHERE user_id = u.id) as wishlist_count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE ${whereClause}
      ORDER BY ${sort === 'name' ? 'p.full_name' : sort === 'products' ? 'products_count' : 'u.' + sort} ${order}
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const [[{ total }]] = await db.query(`
      SELECT COUNT(*) as total
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE ${whereClause}
    `, params);

    res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [users] = await db.query(`
      SELECT
        u.id,
        u.email,
        u.email_verified,
        u.created_at,
        u.updated_at,
        u.last_sign_in,
        u.is_suspended,
        u.suspended_at,
        u.suspension_reason,
        p.full_name,
        p.college,
        p.phone,
        p.avatar_url,
        p.created_at as profile_created_at
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = ?
    `, [id]);

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user stats
    const [[{ products_count }]] = await db.query(
      'SELECT COUNT(*) as products_count FROM products WHERE user_id = ?',
      [id]
    );
    const [[{ active_products }]] = await db.query(
      'SELECT COUNT(*) as active_products FROM products WHERE user_id = ? AND is_active = TRUE',
      [id]
    );
    const [[{ total_views }]] = await db.query(
      'SELECT COALESCE(SUM(view_count), 0) as total_views FROM products WHERE user_id = ?',
      [id]
    );
    const [[{ wishlist_count }]] = await db.query(
      'SELECT COUNT(*) as wishlist_count FROM wishlist WHERE user_id = ?',
      [id]
    );

    res.json({
      ...users[0],
      stats: {
        productsCount: products_count,
        activeProducts: active_products,
        totalViews: total_views,
        wishlistCount: wishlist_count
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get user's products
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const [products] = await db.query(`
      SELECT
        id, title, description, price, category, condition,
        negotiable, images, college, is_active, is_flagged,
        flag_reason, view_count, created_at, updated_at
      FROM products
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [id, limit, offset]);

    const [[{ total }]] = await db.query(
      'SELECT COUNT(*) as total FROM products WHERE user_id = ?',
      [id]
    );

    res.json({
      products,
      pagination: { total, limit, offset }
    });
  } catch (error) {
    console.error('Get user products error:', error);
    res.status(500).json({ error: 'Failed to fetch user products' });
  }
});

// Update user profile
router.put('/:id', isAdmin, sanitizeBody, [
  body('full_name').optional().trim().notEmpty(),
  body('college').optional().trim(),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { full_name, college, phone } = req.body;

    // Check user exists
    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update profile
    const updates = [];
    const params = [];

    if (full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(full_name);
    }
    if (college !== undefined) {
      updates.push('college = ?');
      params.push(college);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      params.push(phone);
    }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      params.push(id);

      await db.query(
        `UPDATE profiles SET ${updates.join(', ')} WHERE user_id = ?`,
        params
      );
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(req.admin.id, 'update_user', 'user', id, { updates: req.body }, ip);

    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Suspend user
router.post('/:id/suspend', isAdmin, sanitizeBody, [
  body('reason').optional().trim()
], async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Check user exists
    const [users] = await db.query('SELECT id, is_suspended FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (users[0].is_suspended) {
      return res.status(400).json({ error: 'User is already suspended' });
    }

    await db.query(
      'UPDATE users SET is_suspended = TRUE, suspended_at = NOW(), suspension_reason = ? WHERE id = ?',
      [reason || null, id]
    );

    // Deactivate all user's products
    await db.query(
      'UPDATE products SET is_active = FALSE WHERE user_id = ?',
      [id]
    );

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(req.admin.id, 'suspend_user', 'user', id, { reason }, ip);

    res.json({ message: 'User suspended successfully' });
  } catch (error) {
    console.error('Suspend user error:', error);
    res.status(500).json({ error: 'Failed to suspend user' });
  }
});

// Reactivate user
router.post('/:id/activate', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check user exists
    const [users] = await db.query('SELECT id, is_suspended FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!users[0].is_suspended) {
      return res.status(400).json({ error: 'User is not suspended' });
    }

    await db.query(
      'UPDATE users SET is_suspended = FALSE, suspended_at = NULL, suspension_reason = NULL WHERE id = ?',
      [id]
    );

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(req.admin.id, 'activate_user', 'user', id, null, ip);

    res.json({ message: 'User activated successfully' });
  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({ error: 'Failed to activate user' });
  }
});

// Delete user
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check user exists
    const [users] = await db.query('SELECT id, email FROM users WHERE id = ?', [id]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete in order: wishlist, products, profile, user
    await db.query('DELETE FROM wishlist WHERE user_id = ?', [id]);
    await db.query('DELETE FROM products WHERE user_id = ?', [id]);
    await db.query('DELETE FROM profiles WHERE user_id = ?', [id]);
    await db.query('DELETE FROM users WHERE id = ?', [id]);

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(req.admin.id, 'delete_user', 'user', id, { email: users[0].email }, ip);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get colleges list (for filters)
router.get('/meta/colleges', async (req, res) => {
  try {
    const [colleges] = await db.query(`
      SELECT DISTINCT college, COUNT(*) as count
      FROM profiles
      WHERE college IS NOT NULL AND college != ''
      GROUP BY college
      ORDER BY count DESC
    `);

    res.json(colleges);
  } catch (error) {
    console.error('Get colleges error:', error);
    res.status(500).json({ error: 'Failed to fetch colleges' });
  }
});

module.exports = router;
