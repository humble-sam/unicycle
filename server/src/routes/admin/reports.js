const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../../config/database');
const { authenticateAdmin, isModerator, logActivity } = require('../../middleware/adminAuth');

// Apply auth to all routes
router.use(authenticateAdmin);

// Get all reports (paginated)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 25;
    const offset = (page - 1) * limit;
    const status = req.query.status || ''; // 'pending', 'reviewed', 'resolved', 'dismissed', 'all'
    const reason = req.query.reason || '';

    let whereClause = '1=1';
    const params = [];

    if (status && status !== 'all') {
      whereClause += ' AND r.status = ?';
      params.push(status);
    }

    if (reason) {
      whereClause += ' AND r.reason = ?';
      params.push(reason);
    }

    // Get reports
    const [reports] = await db.query(`
      SELECT
        r.*,
        p.title as product_title,
        p.images as product_images,
        p.user_id as seller_id,
        pr.full_name as reporter_name,
        u.email as reporter_email,
        ps.full_name as seller_name,
        a.full_name as reviewer_name
      FROM product_reports r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.reporter_id = u.id
      LEFT JOIN profiles pr ON r.reporter_id = pr.user_id
      LEFT JOIN profiles ps ON p.user_id = ps.user_id
      LEFT JOIN admins a ON r.reviewed_by = a.id
      WHERE ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    // Get total count
    const [[{ total }]] = await db.query(`
      SELECT COUNT(*) as total
      FROM product_reports r
      WHERE ${whereClause}
    `, params);

    res.json({
      reports,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get single report
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [reports] = await db.query(`
      SELECT
        r.*,
        p.title as product_title,
        p.description as product_description,
        p.images as product_images,
        p.user_id as seller_id,
        pr.full_name as reporter_name,
        u.email as reporter_email,
        ps.full_name as seller_name,
        us.email as seller_email,
        a.full_name as reviewer_name
      FROM product_reports r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.reporter_id = u.id
      LEFT JOIN users us ON p.user_id = us.id
      LEFT JOIN profiles pr ON r.reporter_id = pr.user_id
      LEFT JOIN profiles ps ON p.user_id = ps.user_id
      LEFT JOIN admins a ON r.reviewed_by = a.id
      WHERE r.id = ?
    `, [id]);

    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(reports[0]);
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Update report status
router.patch('/:id/status', isModerator, [
  body('status').isIn(['pending', 'reviewed', 'resolved', 'dismissed'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { id } = req.params;
    const { status } = req.body;

    // Check report exists
    const [reports] = await db.query('SELECT id, product_id FROM product_reports WHERE id = ?', [id]);
    if (reports.length === 0) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Update status
    if (status === 'reviewed' || status === 'resolved' || status === 'dismissed') {
      await db.query(
        'UPDATE product_reports SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
        [status, req.admin.id, id]
      );
    } else {
      await db.query(
        'UPDATE product_reports SET status = ?, reviewed_by = NULL, reviewed_at = NULL WHERE id = ?',
        [status, id]
      );
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(req.admin.id, 'update_report', 'product_report', id, { status }, ip);

    res.json({ message: 'Report status updated successfully' });
  } catch (error) {
    console.error('Update report status error:', error);
    res.status(500).json({ error: 'Failed to update report status' });
  }
});

// Get report statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const [[{ pending }]] = await db.query(
      'SELECT COUNT(*) as pending FROM product_reports WHERE status = "pending"'
    );
    const [[{ reviewed }]] = await db.query(
      'SELECT COUNT(*) as reviewed FROM product_reports WHERE status = "reviewed"'
    );
    const [[{ resolved }]] = await db.query(
      'SELECT COUNT(*) as resolved FROM product_reports WHERE status = "resolved"'
    );
    const [[{ dismissed }]] = await db.query(
      'SELECT COUNT(*) as dismissed FROM product_reports WHERE status = "dismissed"'
    );

    // Get reports by reason
    const [reasons] = await db.query(`
      SELECT reason, COUNT(*) as count
      FROM product_reports
      GROUP BY reason
      ORDER BY count DESC
    `);

    res.json({
      summary: {
        pending,
        reviewed,
        resolved,
        dismissed,
        total: pending + reviewed + resolved + dismissed
      },
      byReason: reasons
    });
  } catch (error) {
    console.error('Get report stats error:', error);
    res.status(500).json({ error: 'Failed to fetch report statistics' });
  }
});

module.exports = router;
