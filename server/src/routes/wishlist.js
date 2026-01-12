const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// GET /api/wishlist - Get user's wishlist
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT
        w.id,
        w.created_at as added_at,
        p.*,
        pr.full_name as seller_name,
        pr.avatar_url as seller_avatar
      FROM wishlist w
      JOIN products p ON w.product_id = p.id
      LEFT JOIN profiles pr ON p.user_id = pr.user_id
      WHERE w.user_id = ? AND p.is_active = TRUE
      ORDER BY w.created_at DESC
    `, [req.user.id]);

    res.json(items.map(item => ({
      ...item,
      images: typeof item.images === 'string' ? JSON.parse(item.images) : item.images
    })));
  } catch (err) {
    console.error('Get wishlist error:', err);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// GET /api/wishlist/check/:productId - Check if product is in wishlist
router.get('/check/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    const [items] = await db.query(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );

    res.json({ inWishlist: items.length > 0 });
  } catch (err) {
    console.error('Check wishlist error:', err);
    res.status(500).json({ error: 'Failed to check wishlist' });
  }
});

// POST /api/wishlist/:productId - Add to wishlist
router.post('/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    // Check if product exists
    const [products] = await db.query('SELECT id FROM products WHERE id = ? AND is_active = TRUE', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if already in wishlist
    const [existing] = await db.query(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'Product already in wishlist' });
    }

    const wishlistId = uuidv4();
    await db.query(
      'INSERT INTO wishlist (id, user_id, product_id) VALUES (?, ?, ?)',
      [wishlistId, req.user.id, productId]
    );

    // Track analytics
    await db.query(
      'INSERT INTO analytics_events (id, event_type, user_id, product_id) VALUES (?, ?, ?, ?)',
      [uuidv4(), 'wishlist_add', req.user.id, productId]
    );

    res.status(201).json({ id: wishlistId, message: 'Added to wishlist' });
  } catch (err) {
    console.error('Add to wishlist error:', err);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// DELETE /api/wishlist/:productId - Remove from wishlist
router.delete('/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await db.query(
      'DELETE FROM wishlist WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );

    res.json({ message: 'Removed from wishlist' });
  } catch (err) {
    console.error('Remove from wishlist error:', err);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

module.exports = router;
