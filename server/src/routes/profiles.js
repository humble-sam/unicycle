const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { upload, processUploadedImage } = require('../middleware/upload');
const { sanitizeBody } = require('../middleware/sanitize');
const fs = require('fs');
const path = require('path');

// Validation rules
const profileValidation = [
  body('full_name').optional().trim().isLength({ max: 255 }),
  body('college').optional().trim().isLength({ max: 255 }),
  body('phone').optional().trim().isLength({ max: 20 })
];

// GET /api/profiles/:userId - Get profile by user ID
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [profiles] = await db.query(`
      SELECT p.*, u.email, u.created_at as user_created_at
      FROM profiles p
      JOIN users u ON p.user_id = u.id
      WHERE p.user_id = ?
    `, [userId]);

    if (profiles.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.json(profiles[0]);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/profiles - Update current user's profile
router.put('/', authenticateToken, sanitizeBody, profileValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { full_name, college, phone } = req.body;

    await db.query(`
      UPDATE profiles SET
        full_name = COALESCE(?, full_name),
        college = COALESCE(?, college),
        phone = COALESCE(?, phone)
      WHERE user_id = ?
    `, [full_name, college, phone, req.user.id]);

    const [profiles] = await db.query('SELECT * FROM profiles WHERE user_id = ?', [req.user.id]);

    res.json(profiles[0]);
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/profiles/avatar - Upload avatar
router.post('/avatar', authenticateToken, upload.single('avatar'), processUploadedImage, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get old avatar to delete
    const [profiles] = await db.query('SELECT avatar_url FROM profiles WHERE user_id = ?', [req.user.id]);

    if (profiles[0]?.avatar_url) {
      const oldFilename = profiles[0].avatar_url.split('/').pop();
      const oldPath = path.join(process.cwd(), 'uploads/avatars', oldFilename);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const avatarUrl = `${baseUrl}/uploads/avatars/${req.file.filename}`;

    await db.query('UPDATE profiles SET avatar_url = ? WHERE user_id = ?', [avatarUrl, req.user.id]);

    res.json({ avatar_url: avatarUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// DELETE /api/profiles/avatar - Delete avatar
router.delete('/avatar', authenticateToken, async (req, res) => {
  try {
    const [profiles] = await db.query('SELECT avatar_url FROM profiles WHERE user_id = ?', [req.user.id]);

    if (profiles[0]?.avatar_url) {
      const filename = profiles[0].avatar_url.split('/').pop();
      const filepath = path.join(process.cwd(), 'uploads/avatars', filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    await db.query('UPDATE profiles SET avatar_url = NULL WHERE user_id = ?', [req.user.id]);

    res.json({ message: 'Avatar deleted successfully' });
  } catch (err) {
    console.error('Delete avatar error:', err);
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
});

module.exports = router;
