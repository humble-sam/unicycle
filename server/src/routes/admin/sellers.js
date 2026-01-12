const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { authenticateAdmin } = require('../../middleware/adminAuth');

// Apply auth to all routes
router.use(authenticateAdmin);

// Get all sellers (users with products)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const college = req.query.college || '';
    const sort = req.query.sort || 'products_count';
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';

    let whereClause = '1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (u.email LIKE ? OR pr.full_name LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (college) {
      whereClause += ' AND pr.college = ?';
      params.push(college);
    }

    // Get sellers with product counts
    const [sellers] = await db.query(`
      SELECT
        u.id,
        u.email,
        u.created_at as joined_at,
        u.last_sign_in,
        u.is_suspended,
        pr.full_name,
        pr.college,
        pr.avatar_url,
        COUNT(p.id) as products_count,
        SUM(CASE WHEN p.is_active = TRUE THEN 1 ELSE 0 END) as active_products,
        COALESCE(SUM(p.view_count), 0) as total_views,
        COALESCE(SUM(p.price), 0) as total_listing_value,
        MIN(p.created_at) as first_listing,
        MAX(p.created_at) as last_listing
      FROM users u
      INNER JOIN products p ON u.id = p.user_id
      LEFT JOIN profiles pr ON u.id = pr.user_id
      WHERE ${whereClause}
      GROUP BY u.id, u.email, u.created_at, u.last_sign_in, u.is_suspended,
               pr.full_name, pr.college, pr.avatar_url
      ORDER BY ${sort} ${order}
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count of sellers
    const [[{ total }]] = await db.query(`
      SELECT COUNT(DISTINCT p.user_id) as total
      FROM products p
      LEFT JOIN users u ON p.user_id = u.id
      LEFT JOIN profiles pr ON u.id = pr.user_id
      WHERE ${whereClause}
    `, params);

    res.json({
      sellers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get sellers error:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

// Get single seller details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get seller info
    const [sellers] = await db.query(`
      SELECT
        u.id,
        u.email,
        u.created_at as joined_at,
        u.last_sign_in,
        u.is_suspended,
        u.suspension_reason,
        pr.full_name,
        pr.college,
        pr.phone,
        pr.avatar_url
      FROM users u
      LEFT JOIN profiles pr ON u.id = pr.user_id
      WHERE u.id = ?
    `, [id]);

    if (sellers.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    // Check if user has products (is actually a seller)
    const [[{ products_count }]] = await db.query(
      'SELECT COUNT(*) as products_count FROM products WHERE user_id = ?',
      [id]
    );

    if (products_count === 0) {
      return res.status(404).json({ error: 'User is not a seller' });
    }

    // Get detailed stats
    const [[stats]] = await db.query(`
      SELECT
        COUNT(*) as total_products,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_products,
        SUM(CASE WHEN is_flagged = TRUE THEN 1 ELSE 0 END) as flagged_products,
        COALESCE(SUM(view_count), 0) as total_views,
        COALESCE(AVG(view_count), 0) as avg_views,
        COALESCE(SUM(price), 0) as total_listing_value,
        COALESCE(AVG(price), 0) as avg_price
      FROM products
      WHERE user_id = ?
    `, [id]);

    // Get category breakdown
    const [categories] = await db.query(`
      SELECT category, COUNT(*) as count
      FROM products
      WHERE user_id = ?
      GROUP BY category
      ORDER BY count DESC
    `, [id]);

    // Get wishlist count for seller's products
    const [[{ wishlist_count }]] = await db.query(`
      SELECT COUNT(*) as wishlist_count
      FROM wishlist w
      INNER JOIN products p ON w.product_id = p.id
      WHERE p.user_id = ?
    `, [id]);

    res.json({
      ...sellers[0],
      stats: {
        ...stats,
        avg_views: parseFloat(stats.avg_views) || 0,
        avg_price: parseFloat(stats.avg_price) || 0,
        wishlist_count
      },
      categories
    });
  } catch (error) {
    console.error('Get seller error:', error);
    res.status(500).json({ error: 'Failed to fetch seller' });
  }
});

// Get seller's products
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const status = req.query.status || ''; // 'active', 'inactive', 'flagged'

    let whereClause = 'user_id = ?';
    const params = [id];

    if (status === 'active') {
      whereClause += ' AND is_active = TRUE';
    } else if (status === 'inactive') {
      whereClause += ' AND is_active = FALSE';
    } else if (status === 'flagged') {
      whereClause += ' AND is_flagged = TRUE';
    }

    const [products] = await db.query(`
      SELECT
        id, title, description, price, category, condition,
        negotiable, images, college, is_active, is_flagged,
        flag_reason, view_count, created_at, updated_at
      FROM products
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    const [[{ total }]] = await db.query(`
      SELECT COUNT(*) as total FROM products WHERE ${whereClause}
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
    console.error('Get seller products error:', error);
    res.status(500).json({ error: 'Failed to fetch seller products' });
  }
});

// Get seller performance metrics over time
router.get('/:id/metrics', async (req, res) => {
  try {
    const { id } = req.params;
    const period = parseInt(req.query.period) || 30;

    // Products created over time
    const [productsTimeline] = await db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM products
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [id, period]);

    // Get top performing products
    const [topProducts] = await db.query(`
      SELECT id, title, view_count, price, is_active
      FROM products
      WHERE user_id = ?
      ORDER BY view_count DESC
      LIMIT 5
    `, [id]);

    // Calculate activity score (simple metric)
    const [[{ recent_products }]] = await db.query(`
      SELECT COUNT(*) as recent_products
      FROM products
      WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    `, [id]);

    const [[{ total_views }]] = await db.query(`
      SELECT COALESCE(SUM(view_count), 0) as total_views
      FROM products WHERE user_id = ?
    `, [id]);

    res.json({
      productsTimeline,
      topProducts,
      activityScore: {
        recentProducts: recent_products,
        totalViews: total_views,
        // Simple score: products * 10 + views
        score: (recent_products * 10) + Math.floor(total_views / 10)
      }
    });
  } catch (error) {
    console.error('Get seller metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch seller metrics' });
  }
});

module.exports = router;
