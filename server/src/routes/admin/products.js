const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../../config/database');
const { authenticateAdmin, isAdmin, isModerator, logActivity } = require('../../middleware/adminAuth');
const { sanitizeBody } = require('../../middleware/sanitize');

// Apply auth to all routes
router.use(authenticateAdmin);

// Get all products (paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const category = req.query.category || '';
    const status = req.query.status || ''; // 'active', 'inactive', 'flagged', 'all'
    const sort = req.query.sort || 'created_at';
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

    let whereClause = '1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (p.title LIKE ? OR p.description LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      whereClause += ' AND p.category = ?';
      params.push(category);
    }

    if (status === 'active') {
      whereClause += ' AND p.is_active = TRUE';
    } else if (status === 'inactive') {
      whereClause += ' AND p.is_active = FALSE';
    } else if (status === 'flagged') {
      whereClause += ' AND p.is_flagged = TRUE';
    }

    // Get products
    const [products] = await db.query(`
      SELECT
        p.id,
        p.title,
        p.description,
        p.price,
        p.category,
        p.condition,
        p.negotiable,
        p.images,
        p.college,
        p.is_active,
        p.is_flagged,
        p.flag_reason,
        p.view_count,
        p.created_at,
        p.updated_at,
        p.user_id,
        pr.full_name as seller_name,
        pr.avatar_url as seller_avatar,
        u.email as seller_email,
        u.is_suspended as seller_suspended
      FROM products p
      LEFT JOIN profiles pr ON p.user_id = pr.user_id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE ${whereClause}
      ORDER BY ${sort === 'views' ? 'p.view_count' : sort === 'price' ? 'p.price' : 'p.' + sort} ${order}
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const [[{ total }]] = await db.query(`
      SELECT COUNT(*) as total FROM products p WHERE ${whereClause}
    `, params);

    res.json({
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await db.query(`
      SELECT
        p.*,
        pr.full_name as seller_name,
        pr.avatar_url as seller_avatar,
        pr.college as seller_college,
        pr.phone as seller_phone,
        u.email as seller_email,
        u.is_suspended as seller_suspended,
        u.created_at as seller_joined
      FROM products p
      LEFT JOIN profiles pr ON p.user_id = pr.user_id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Get wishlist count
    const [[{ wishlist_count }]] = await db.query(
      'SELECT COUNT(*) as wishlist_count FROM wishlist WHERE product_id = ?',
      [id]
    );

    res.json({
      ...products[0],
      wishlist_count
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Update product
router.put('/:id', isAdmin, sanitizeBody, [
  body('title').optional().trim().notEmpty(),
  body('description').optional().trim(),
  body('price').optional().isInt({ min: 0 }),
  body('category').optional().trim(),
  body('condition').optional().isIn(['like-new', 'good', 'well-used']),
  body('negotiable').optional().isBoolean(),
  body('is_active').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { title, description, price, category, condition, negotiable, is_active } = req.body;

    // Check product exists
    const [products] = await db.query('SELECT id FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updates = [];
    const params = [];

    if (title !== undefined) { updates.push('title = ?'); params.push(title); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (price !== undefined) { updates.push('price = ?'); params.push(price); }
    if (category !== undefined) { updates.push('category = ?'); params.push(category); }
    if (condition !== undefined) { updates.push('`condition` = ?'); params.push(condition); }
    if (negotiable !== undefined) { updates.push('negotiable = ?'); params.push(negotiable); }
    if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

    if (updates.length > 0) {
      updates.push('updated_at = NOW()');
      params.push(id);

      await db.query(
        `UPDATE products SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(req.admin.id, 'update_product', 'product', id, { updates: req.body }, ip);

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Toggle product active status
router.patch('/:id/toggle', isModerator, async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await db.query('SELECT id, is_active, title FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const newStatus = !products[0].is_active;

    await db.query(
      'UPDATE products SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(
      req.admin.id,
      newStatus ? 'show_product' : 'hide_product',
      'product',
      id,
      { title: products[0].title },
      ip
    );

    res.json({
      message: `Product ${newStatus ? 'shown' : 'hidden'} successfully`,
      is_active: newStatus
    });
  } catch (error) {
    console.error('Toggle product error:', error);
    res.status(500).json({ error: 'Failed to toggle product' });
  }
});

// Flag product
router.post('/:id/flag', isModerator, sanitizeBody, [
  body('reason').trim().notEmpty().withMessage('Flag reason is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const [products] = await db.query('SELECT id, is_flagged, title FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await db.query(
      'UPDATE products SET is_flagged = TRUE, flagged_at = NOW(), flag_reason = ? WHERE id = ?',
      [reason, id]
    );

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(req.admin.id, 'flag_product', 'product', id, { reason, title: products[0].title }, ip);

    res.json({ message: 'Product flagged successfully' });
  } catch (error) {
    console.error('Flag product error:', error);
    res.status(500).json({ error: 'Failed to flag product' });
  }
});

// Unflag product
router.post('/:id/unflag', isModerator, async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await db.query('SELECT id, is_flagged, title FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!products[0].is_flagged) {
      return res.status(400).json({ error: 'Product is not flagged' });
    }

    await db.query(
      'UPDATE products SET is_flagged = FALSE, flagged_at = NULL, flag_reason = NULL WHERE id = ?',
      [id]
    );

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(req.admin.id, 'unflag_product', 'product', id, { title: products[0].title }, ip);

    res.json({ message: 'Product unflagged successfully' });
  } catch (error) {
    console.error('Unflag product error:', error);
    res.status(500).json({ error: 'Failed to unflag product' });
  }
});

// Delete product
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await db.query('SELECT id, title, user_id FROM products WHERE id = ?', [id]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete wishlist entries first
    await db.query('DELETE FROM wishlist WHERE product_id = ?', [id]);
    // Delete product
    await db.query('DELETE FROM products WHERE id = ?', [id]);

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(req.admin.id, 'delete_product', 'product', id, {
      title: products[0].title,
      user_id: products[0].user_id
    }, ip);

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// Get categories list (for filters)
router.get('/meta/categories', async (req, res) => {
  try {
    const [categories] = await db.query(`
      SELECT DISTINCT category, COUNT(*) as count
      FROM products
      WHERE category IS NOT NULL AND category != ''
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

module.exports = router;
