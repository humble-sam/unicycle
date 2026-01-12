const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Middleware to check if user is admin (you can customize this)
const isAdmin = async (req, res, next) => {
  // For now, allow any authenticated user to view analytics
  // You can add admin role checking here later
  // const [admins] = await db.query('SELECT * FROM admins WHERE user_id = ?', [req.user.id]);
  // if (admins.length === 0) return res.status(403).json({ error: 'Admin access required' });
  next();
};

// GET /api/analytics/dashboard - Main dashboard stats
router.get('/dashboard', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days
    const periodDays = parseInt(period);

    // Get total stats
    const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users');
    const [totalProducts] = await db.query('SELECT COUNT(*) as count FROM products');
    const [activeProducts] = await db.query('SELECT COUNT(*) as count FROM products WHERE is_active = TRUE');
    const [totalWishlist] = await db.query('SELECT COUNT(*) as count FROM wishlist');

    // Get period stats
    const [newUsers] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
      [periodDays]
    );
    const [newProducts] = await db.query(
      'SELECT COUNT(*) as count FROM products WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
      [periodDays]
    );

    // Get views in period
    const [totalViews] = await db.query(
      `SELECT COUNT(*) as count FROM analytics_events
       WHERE event_type = 'product_view'
       AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [periodDays]
    );

    // Category breakdown
    const [categoryStats] = await db.query(`
      SELECT category, COUNT(*) as count, SUM(price) as total_value
      FROM products
      WHERE is_active = TRUE
      GROUP BY category
      ORDER BY count DESC
    `);

    // Top viewed products
    const [topProducts] = await db.query(`
      SELECT p.id, p.title, p.price, p.view_count, p.category,
             pr.full_name as seller_name
      FROM products p
      LEFT JOIN profiles pr ON p.user_id = pr.user_id
      WHERE p.is_active = TRUE
      ORDER BY p.view_count DESC
      LIMIT 10
    `);

    // Recent signups
    const [recentUsers] = await db.query(`
      SELECT u.id, u.email, u.created_at, p.full_name, p.college
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY u.created_at DESC
      LIMIT 10
    `);

    // College distribution
    const [collegeStats] = await db.query(`
      SELECT college, COUNT(*) as user_count
      FROM profiles
      WHERE college IS NOT NULL
      GROUP BY college
      ORDER BY user_count DESC
      LIMIT 15
    `);

    res.json({
      summary: {
        total_users: totalUsers[0].count,
        total_products: totalProducts[0].count,
        active_products: activeProducts[0].count,
        total_wishlist_items: totalWishlist[0].count,
        new_users_period: newUsers[0].count,
        new_products_period: newProducts[0].count,
        total_views_period: totalViews[0].count,
        period_days: periodDays
      },
      category_breakdown: categoryStats,
      top_products: topProducts,
      recent_users: recentUsers,
      college_distribution: collegeStats
    });
  } catch (err) {
    console.error('Dashboard analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/chart/users - User registration over time
router.get('/chart/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query;

    const [data] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [parseInt(period)]);

    res.json(data);
  } catch (err) {
    console.error('User chart error:', err);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// GET /api/analytics/chart/products - Product listings over time
router.get('/chart/products', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query;

    const [data] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM products
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [parseInt(period)]);

    res.json(data);
  } catch (err) {
    console.error('Products chart error:', err);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// GET /api/analytics/chart/views - Product views over time
router.get('/chart/views', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { period = '30' } = req.query;

    const [data] = await db.query(`
      SELECT DATE(created_at) as date, COUNT(*) as count
      FROM analytics_events
      WHERE event_type = 'product_view'
      AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [parseInt(period)]);

    res.json(data);
  } catch (err) {
    console.error('Views chart error:', err);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// POST /api/analytics/track - Track an event
router.post('/track', async (req, res) => {
  try {
    const { event_type, product_id, metadata } = req.body;

    if (!event_type) {
      return res.status(400).json({ error: 'Event type required' });
    }

    await db.query(
      `INSERT INTO analytics_events (id, event_type, product_id, metadata, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        event_type,
        product_id || null,
        metadata ? JSON.stringify(metadata) : null,
        req.ip,
        req.get('user-agent') || null
      ]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Track event error:', err);
    res.status(500).json({ error: 'Failed to track event' });
  }
});

module.exports = router;
