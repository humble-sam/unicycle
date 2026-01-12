const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { authenticateAdmin } = require('../../middleware/adminAuth');

// Apply auth to all routes
router.use(authenticateAdmin);

// Get dashboard overview
router.get('/overview', async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 30;

    // Get total counts
    const [[{ total_users }]] = await db.query('SELECT COUNT(*) as total_users FROM users');
    const [[{ total_products }]] = await db.query('SELECT COUNT(*) as total_products FROM products');
    const [[{ active_products }]] = await db.query('SELECT COUNT(*) as active_products FROM products WHERE is_active = TRUE');
    const [[{ total_sellers }]] = await db.query('SELECT COUNT(DISTINCT user_id) as total_sellers FROM products');
    const [[{ total_views }]] = await db.query('SELECT COALESCE(SUM(view_count), 0) as total_views FROM products');
    const [[{ total_wishlist }]] = await db.query('SELECT COUNT(*) as total_wishlist FROM wishlist');
    const [[{ revenue_potential }]] = await db.query('SELECT COALESCE(SUM(price), 0) as revenue_potential FROM products WHERE is_active = TRUE');

    // Get previous period counts for comparison
    const [[{ prev_users }]] = await db.query(
      'SELECT COUNT(*) as prev_users FROM users WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [period]
    );
    const [[{ new_users }]] = await db.query(
      'SELECT COUNT(*) as new_users FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
      [period]
    );
    const [[{ prev_products }]] = await db.query(
      'SELECT COUNT(*) as prev_products FROM products WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [period]
    );
    const [[{ new_products }]] = await db.query(
      'SELECT COUNT(*) as new_products FROM products WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
      [period]
    );

    // Calculate growth percentages
    const usersGrowth = prev_users > 0 ? ((new_users / prev_users) * 100).toFixed(1) : 100;
    const productsGrowth = prev_products > 0 ? ((new_products / prev_products) * 100).toFixed(1) : 100;

    // Get suspended users count
    const [[{ suspended_users }]] = await db.query(
      'SELECT COUNT(*) as suspended_users FROM users WHERE is_suspended = TRUE'
    );

    // Get flagged products count
    const [[{ flagged_products }]] = await db.query(
      'SELECT COUNT(*) as flagged_products FROM products WHERE is_flagged = TRUE'
    );

    res.json({
      summary: {
        totalUsers: total_users,
        totalProducts: total_products,
        activeProducts: active_products,
        totalSellers: total_sellers,
        totalViews: total_views,
        totalWishlist: total_wishlist,
        revenuePotential: revenue_potential,
        suspendedUsers: suspended_users,
        flaggedProducts: flagged_products
      },
      growth: {
        usersChange: parseFloat(usersGrowth),
        productsChange: parseFloat(productsGrowth),
        newUsers: new_users,
        newProducts: new_products
      },
      periodDays: period
    });
  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard overview' });
  }
});

// Get user growth chart data
router.get('/charts/users', async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 30;

    const [data] = await db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM users
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [period]);

    res.json(data);
  } catch (error) {
    console.error('User chart error:', error);
    res.status(500).json({ error: 'Failed to fetch user chart data' });
  }
});

// Get products chart data
router.get('/charts/products', async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 30;

    const [data] = await db.query(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as count
      FROM products
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `, [period]);

    res.json(data);
  } catch (error) {
    console.error('Products chart error:', error);
    res.status(500).json({ error: 'Failed to fetch products chart data' });
  }
});

// Get category breakdown
router.get('/charts/categories', async (req, res) => {
  try {
    const [data] = await db.query(`
      SELECT
        category,
        COUNT(*) as count,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_count
      FROM products
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json(data);
  } catch (error) {
    console.error('Category chart error:', error);
    res.status(500).json({ error: 'Failed to fetch category data' });
  }
});

// Get college distribution
router.get('/charts/colleges', async (req, res) => {
  try {
    const [data] = await db.query(`
      SELECT
        COALESCE(p.college, 'Unknown') as college,
        COUNT(DISTINCT p.user_id) as users_count,
        COUNT(*) as products_count
      FROM profiles p
      LEFT JOIN products pr ON p.user_id = pr.user_id
      GROUP BY p.college
      ORDER BY users_count DESC
      LIMIT 20
    `);

    res.json(data);
  } catch (error) {
    console.error('College chart error:', error);
    res.status(500).json({ error: 'Failed to fetch college data' });
  }
});

// Get top products by views
router.get('/top-products', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [products] = await db.query(`
      SELECT
        p.id,
        p.title,
        p.price,
        p.category,
        p.view_count,
        p.is_active,
        p.created_at,
        pr.full_name as seller_name
      FROM products p
      LEFT JOIN profiles pr ON p.user_id = pr.user_id
      ORDER BY p.view_count DESC
      LIMIT ?
    `, [limit]);

    res.json(products);
  } catch (error) {
    console.error('Top products error:', error);
    res.status(500).json({ error: 'Failed to fetch top products' });
  }
});

// Get recent users
router.get('/recent-users', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const [users] = await db.query(`
      SELECT
        u.id,
        u.email,
        u.created_at,
        u.last_sign_in,
        u.is_suspended,
        p.full_name,
        p.college,
        p.avatar_url,
        (SELECT COUNT(*) FROM products WHERE user_id = u.id) as products_count
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      ORDER BY u.created_at DESC
      LIMIT ?
    `, [limit]);

    res.json(users);
  } catch (error) {
    console.error('Recent users error:', error);
    res.status(500).json({ error: 'Failed to fetch recent users' });
  }
});

// Get engagement metrics
router.get('/engagement', async (req, res) => {
  try {
    const period = parseInt(req.query.period) || 30;

    // Average products per seller
    const [[{ avg_products_per_seller }]] = await db.query(`
      SELECT AVG(product_count) as avg_products_per_seller
      FROM (
        SELECT user_id, COUNT(*) as product_count
        FROM products
        GROUP BY user_id
      ) as seller_products
    `);

    // Average views per product
    const [[{ avg_views_per_product }]] = await db.query(`
      SELECT AVG(view_count) as avg_views_per_product FROM products
    `);

    // Wishlist rate (products with wishlists / total products)
    const [[{ products_with_wishlist }]] = await db.query(`
      SELECT COUNT(DISTINCT product_id) as products_with_wishlist FROM wishlist
    `);
    const [[{ total_products }]] = await db.query(`
      SELECT COUNT(*) as total_products FROM products
    `);

    // Active users (users who logged in recently)
    const [[{ active_users }]] = await db.query(`
      SELECT COUNT(*) as active_users
      FROM users
      WHERE last_sign_in >= DATE_SUB(NOW(), INTERVAL ? DAY)
    `, [period]);

    // Conversion rate (users who became sellers)
    const [[{ total_users }]] = await db.query('SELECT COUNT(*) as total_users FROM users');
    const [[{ total_sellers }]] = await db.query('SELECT COUNT(DISTINCT user_id) as total_sellers FROM products');

    res.json({
      avgProductsPerSeller: parseFloat(avg_products_per_seller) || 0,
      avgViewsPerProduct: parseFloat(avg_views_per_product) || 0,
      wishlistRate: total_products > 0 ? ((products_with_wishlist / total_products) * 100).toFixed(1) : 0,
      activeUsers: active_users,
      totalUsers: total_users,
      activeUserRate: total_users > 0 ? ((active_users / total_users) * 100).toFixed(1) : 0,
      conversionRate: total_users > 0 ? ((total_sellers / total_users) * 100).toFixed(1) : 0
    });
  } catch (error) {
    console.error('Engagement metrics error:', error);
    res.status(500).json({ error: 'Failed to fetch engagement metrics' });
  }
});

// Get activity logs
router.get('/activity-logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const [logs] = await db.query(`
      SELECT
        l.*,
        a.email as admin_email,
        a.full_name as admin_name
      FROM admin_activity_logs l
      LEFT JOIN admins a ON l.admin_id = a.id
      ORDER BY l.created_at DESC
      LIMIT ? OFFSET ?
    `, [limit, offset]);

    const [[{ total }]] = await db.query('SELECT COUNT(*) as total FROM admin_activity_logs');

    res.json({
      logs,
      pagination: {
        total,
        limit,
        offset,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Activity logs error:', error);
    res.status(500).json({ error: 'Failed to fetch activity logs' });
  }
});

module.exports = router;
