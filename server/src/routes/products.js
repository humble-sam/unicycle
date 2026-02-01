const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { body, query, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, optionalAuth } = require('../middleware/auth');
const { checkProductCreationEnabled, checkProductEditingEnabled } = require('../middleware/settings');
const { upload, processUploadedImages } = require('../middleware/upload');
const { sanitizeBody } = require('../middleware/sanitize');
const fs = require('fs');
const path = require('path');

// Validation rules
const productValidation = [
  body('title').trim().notEmpty().isLength({ max: 255 }),
  body('description').optional().trim(),
  body('price').isInt({ min: 0 }),
  body('category').trim().notEmpty(),
  body('condition').isIn(['like-new', 'good', 'well-used']),
  body('negotiable').optional().isBoolean(),
  body('college').optional().trim()
];

// Keyword to category mapping for better search
const searchKeywordMappings = {
  // Electronics logic refined - removed specific brands to prevent keyword poisoning
  'laptop': 'electronics',
  'laptops': 'electronics',
  'computer': 'electronics',
  'pc': 'electronics',
  'macbook': 'electronics',
  'phone': 'electronics',
  'mobile': 'electronics',
  // Removed brands (dell, hp, etc) to ensure search is irrelevant unless searching for "electronics" explicitly

  // Books & Stationary
  'book': 'books-stationary',
  'books': 'books-stationary',
  'textbook': 'books-stationary',
  'textbooks': 'books-stationary',
  'notebook': 'books-stationary',
  'notes': 'books-stationary',
  'pen': 'books-stationary',
  'pencil': 'books-stationary',
  'stationary': 'books-stationary',
  'stationery': 'books-stationary',
  'paper': 'books-stationary',
  'novel': 'books-stationary',
  'fiction': 'books-stationary',
  'study': 'books-stationary',
  'material': 'books-stationary',

  // Furniture
  'furniture': 'furniture',
  'chair': 'furniture',
  'desk': 'furniture',
  'table': 'furniture',
  'bed': 'furniture',
  'mattress': 'furniture',
  'shelf': 'furniture',
  'shelves': 'furniture',
  'cupboard': 'furniture',
  'wardrobe': 'furniture',
  'lamp': 'furniture',
  'fan': 'furniture',
  'mirror': 'furniture',

  // Kitchen Items
  'kitchen': 'kitchen-items',
  'utensil': 'kitchen-items',
  'utensils': 'kitchen-items',
  'cookware': 'kitchen-items',
  'pot': 'kitchen-items',
  'pan': 'kitchen-items',
  'plate': 'kitchen-items',
  'dishes': 'kitchen-items',
  'spoon': 'kitchen-items',
  'fork': 'kitchen-items',
  'knife': 'kitchen-items',
  'blender': 'kitchen-items',
  'mixer': 'kitchen-items',
  'microwave': 'kitchen-items',
  'kettle': 'kitchen-items',
  'induction': 'kitchen-items',
  'cooker': 'kitchen-items',
  'bottle': 'kitchen-items',

  // Vehicles
  'vehicle': 'vehicles',
  'vehicles': 'vehicles',
  'cycle': 'vehicles',
  'bicycle': 'vehicles',
  'bike': 'vehicles',
  'scooter': 'vehicles',
  'scooty': 'vehicles',
  'motorcycle': 'vehicles',
  'activa': 'vehicles',
  'honda': 'vehicles',
  'hero': 'vehicles',
  'tvs': 'vehicles',
  'car': 'vehicles',

  // Giveaways
  'free': 'giveaways',
  'giveaway': 'giveaways',
  'donate': 'giveaways',
  'donation': 'giveaways',

  // High-level categories
  'electronics': 'electronics',
  'gadget': 'electronics',
  'books': 'books-stationary',
  'study': 'books-stationary',
  'furniture': 'furniture',
  'room': 'furniture',
  'kitchen': 'kitchen-items',
  'cooking': 'kitchen-items',
  'vehicle': 'vehicles',
  'cycle': 'vehicles'
};

// PATCH /api/products/:id/contact - Handle contact event (for analytics only, no auto-delist)
router.patch('/:id/contact', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if product exists
    const [products] = await db.query('SELECT user_id, is_active FROM products WHERE id = ?', [id]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Log the contact event for analytics (but don't delist - seller must confirm sale)
    await db.query(
      'INSERT INTO analytics_events (id, event_type, user_id, product_id, ip_address) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), 'product_contacted', req.user?.id || null, id, req.ip]
    );

    res.json({ success: true, message: 'Contact request logged' });
  } catch (err) {
    console.error('Contact product error:', err);
    res.status(500).json({ error: 'Failed to process contact request' });
  }
});

// GET /api/products - List products with filters
router.get('/', optionalAuth, async (req, res) => {
  try {
    const {
      category,
      college,
      search,
      sort = 'recent',
      limit = 20,
      offset = 0,
      userId
    } = req.query;

    let whereConditions = [];
    let params = [];

    // If user is fetching their own products, show all (including inactive)
    // Otherwise, only show active products
    if (userId && req.user && userId === req.user.id) {
      // User fetching their own products - show all
      whereConditions.push('p.user_id = ?');
      params.push(userId);
    } else {
      // Public listing - only show active products
      whereConditions.push('p.is_active = TRUE');

      if (userId) {
        whereConditions.push('p.user_id = ?');
        params.push(userId);
      }
    }

    if (category) {
      whereConditions.push('p.category = ?');
      params.push(category);
    }

    if (college) {
      whereConditions.push('p.college = ?');
      params.push(college);
    }

    if (search) {
      const lowerSearch = search.trim().toLowerCase();
      const searchTerm = `%${search.trim()}%`;
      const fuzzySearchTerm = `%${search.trim().replace(/\s+/g, '')}%`;

      // Search matches:
      // 1. Title or Description matches normally
      // 2. Title matches ignoring spaces (fuzzy search for 'hpvictus')
      let searchClause = '(p.title LIKE ? OR p.description LIKE ? OR REPLACE(p.title, " ", "") LIKE ?';
      const searchParams = [searchTerm, searchTerm, fuzzySearchTerm];

      // Check if the search term maps to a specific category
      // This helps when users search for "laptop" but the title is "HP Victus" (category: electronics)
      if (searchKeywordMappings[lowerSearch]) {
        searchClause += ' OR p.category = ?';
        searchParams.push(searchKeywordMappings[lowerSearch]);
      }

      searchClause += ')';
      whereConditions.push(searchClause);
      params.push(...searchParams);
    }

    let orderBy = 'p.created_at DESC';
    if (sort === 'price-low') orderBy = 'p.price ASC';
    if (sort === 'price-high') orderBy = 'p.price DESC';
    if (sort === 'popular') orderBy = 'p.view_count DESC';

    const sql = `
      SELECT
        p.*,
        pr.full_name as seller_name,
        pr.avatar_url as seller_avatar,
        pr.college as seller_college
      FROM products p
      LEFT JOIN profiles pr ON p.user_id = pr.user_id
      WHERE ${whereConditions.length > 0 ? whereConditions.join(' AND ') : '1=1'}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;

    // Add pagination params for the main query
    const mainQueryParams = [...params, parseInt(limit), parseInt(offset)];

    const [products] = await db.query(sql, mainQueryParams);

    // Get total count (using the same where conditions, but without limit/offset)
    const countSql = `
      SELECT COUNT(*) as total
      FROM products p
      WHERE ${whereConditions.length > 0 ? whereConditions.join(' AND ') : '1=1'}
    `;
    // Use the original params (without limit/offset) for the count query
    const [countResult] = await db.query(countSql, params);

    res.json({
      products: products.map(p => ({
        ...p,
        images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images
      })),
      total: countResult[0].total,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('Get products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await db.query(`
      SELECT
        p.*,
        pr.full_name as seller_name,
        pr.avatar_url as seller_avatar,
        pr.college as seller_college,
        pr.phone as seller_phone,
        u.email as seller_email
      FROM products p
      LEFT JOIN profiles pr ON p.user_id = pr.user_id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [id]);

    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = products[0];

    // Increment view count (don't count owner's views)
    if (!req.user || req.user.id !== product.user_id) {
      await db.query('UPDATE products SET view_count = view_count + 1 WHERE id = ?', [id]);

      // Track analytics event
      await db.query(
        'INSERT INTO analytics_events (id, event_type, user_id, product_id, ip_address) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), 'product_view', req.user?.id || null, id, req.ip]
      );
    }

    // Open seller contact info ONLY to authenticated users
    const responseData = {
      ...product,
      images: typeof product.images === 'string' ? JSON.parse(product.images) : product.images,
      // Privacy Protection: Hide contact info if user is not logged in
      seller_phone: req.user ? product.seller_phone : null,
      seller_email: req.user ? product.seller_email : null
    };

    res.json(responseData);
  } catch (err) {
    console.error('Get product error:', err);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Create product
router.post('/', authenticateToken, checkProductCreationEnabled, sanitizeBody, productValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { title, description, price, category, condition, negotiable, images, college } = req.body;
    const productId = uuidv4();

    await db.query(`
      INSERT INTO products (id, user_id, title, description, price, category, \`condition\`, negotiable, images, college)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      productId,
      req.user.id,
      title,
      description || null,
      price,
      category,
      condition,
      negotiable || false,
      JSON.stringify(images || []),
      college || null
    ]);

    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [productId]);

    res.status(201).json({
      ...products[0],
      images: typeof products[0].images === 'string' ? JSON.parse(products[0].images) : products[0].images
    });
  } catch (err) {
    console.error('Create product error:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id - Update product
router.put('/:id', authenticateToken, checkProductEditingEnabled, sanitizeBody, productValidation, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const [existing] = await db.query('SELECT user_id FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (existing[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }

    const { title, description, price, category, condition, negotiable, images, college, is_active } = req.body;

    await db.query(`
      UPDATE products SET
        title = ?,
        description = ?,
        price = ?,
        category = ?,
        \`condition\` = ?,
        negotiable = ?,
        images = ?,
        college = ?,
        is_active = ?
      WHERE id = ?
    `, [
      title,
      description || null,
      price,
      category,
      condition,
      negotiable || false,
      JSON.stringify(images || []),
      college || null,
      is_active !== undefined ? is_active : true,
      id
    ]);

    const [products] = await db.query('SELECT * FROM products WHERE id = ?', [id]);

    res.json({
      ...products[0],
      images: typeof products[0].images === 'string' ? JSON.parse(products[0].images) : products[0].images
    });
  } catch (err) {
    console.error('Update product error:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// PATCH /api/products/:id/toggle - Toggle product active status
router.patch('/:id/toggle', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const [existing] = await db.query('SELECT user_id, is_active FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (existing[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const newStatus = !existing[0].is_active;
    await db.query('UPDATE products SET is_active = ? WHERE id = ?', [newStatus, id]);

    res.json({ is_active: newStatus });
  } catch (err) {
    console.error('Toggle product error:', err);
    res.status(500).json({ error: 'Failed to toggle product status' });
  }
});

// DELETE /api/products/:id - Delete product
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check ownership
    const [existing] = await db.query('SELECT user_id, images FROM products WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    if (existing[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }

    // Delete associated images
    const images = typeof existing[0].images === 'string'
      ? JSON.parse(existing[0].images)
      : existing[0].images;

    images.forEach(imageUrl => {
      const filename = imageUrl.split('/').pop();
      const filepath = path.join(process.cwd(), 'uploads/products', filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    });

    await db.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST /api/products/upload - Upload product images
router.post('/upload', authenticateToken, upload.array('images', 5), processUploadedImages, async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Use relative URLs for better portability across environments
    const urls = req.files.map(file => `/uploads/products/${file.filename}`);

    res.json({ urls });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

module.exports = router;
