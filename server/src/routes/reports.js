const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { sanitizeBody } = require('../middleware/sanitize');
const { v4: uuidv4 } = require('uuid');

// Validation rules
const reportValidation = [
  body('reason').isIn(['spam', 'inappropriate', 'fraud', 'duplicate', 'other']).withMessage('Invalid report reason'),
  body('description').optional().trim().isLength({ max: 1000 })
];

// POST /api/reports - Report a product
router.post('/', authenticateToken, sanitizeBody, reportValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { productId, reason, description } = req.body;

    // Check if product exists
    const [products] = await db.query('SELECT id, user_id FROM products WHERE id = ?', [productId]);
    if (products.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if user already reported this product
    const [existingReports] = await db.query(
      'SELECT id FROM product_reports WHERE product_id = ? AND reporter_id = ? AND status = "pending"',
      [productId, req.user.id]
    );

    if (existingReports.length > 0) {
      return res.status(400).json({ error: 'You have already reported this product' });
    }

    // Create report
    const reportId = uuidv4();
    await db.query(
      'INSERT INTO product_reports (id, product_id, reporter_id, reason, description) VALUES (?, ?, ?, ?, ?)',
      [reportId, productId, req.user.id, reason, description || null]
    );

    res.status(201).json({ message: 'Product reported successfully', id: reportId });
  } catch (err) {
    console.error('Report product error:', err);
    res.status(500).json({ error: 'Failed to report product' });
  }
});

// GET /api/reports - Get user's reports (for users to see their own reports)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const [reports] = await db.query(
      `SELECT 
        r.*,
        p.title as product_title,
        p.images as product_images
      FROM product_reports r
      JOIN products p ON r.product_id = p.id
      WHERE r.reporter_id = ?
      ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    res.json({ reports });
  } catch (err) {
    console.error('Get reports error:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

module.exports = router;
