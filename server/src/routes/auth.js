const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { checkRegistrationEnabled, checkLoginEnabled } = require('../middleware/settings');

// Validation rules
const signupValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('college').trim().notEmpty().withMessage('College is required')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
];

// Generate tokens
const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  return { accessToken };
};

// POST /api/auth/signup
router.post('/signup', checkRegistrationEnabled, signupValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password, fullName, college, phone } = req.body;

    // Check if user exists
    const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUsers.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);
    const userId = uuidv4();
    const profileId = uuidv4();

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Create user
      await connection.query(
        'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?)',
        [userId, email, passwordHash]
      );

      // Create profile
      await connection.query(
        'INSERT INTO profiles (id, user_id, full_name, college, phone) VALUES (?, ?, ?, ?, ?)',
        [profileId, userId, fullName, college, phone || null]
      );

      await connection.commit();
      connection.release();

      // Generate tokens
      const { accessToken } = generateTokens(userId);

      // Get profile
      const [profiles] = await db.query(
        'SELECT * FROM profiles WHERE user_id = ?',
        [userId]
      );

      res.status(201).json({
        message: 'Account created successfully',
        user: {
          id: userId,
          email,
          profile: profiles[0]
        },
        accessToken
      });
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/login
router.post('/login', checkLoginEnabled, loginValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const { email, password } = req.body;

    // Get user
    const [users] = await db.query(
      'SELECT u.*, u.is_suspended, u.suspension_reason, p.id as profile_id, p.full_name, p.college, p.phone, p.avatar_url FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];

    // Check if user is suspended
    if (user.is_suspended) {
      return res.status(403).json({ 
        error: 'Your account has been suspended',
        reason: user.suspension_reason || 'Contact administrator for more information'
      });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last sign in
    await db.query('UPDATE users SET last_sign_in = NOW() WHERE id = ?', [user.id]);

    // Generate tokens
    const { accessToken } = generateTokens(user.id);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        profile: {
          id: user.profile_id,
          user_id: user.id,
          full_name: user.full_name,
          college: user.college,
          phone: user.phone,
          avatar_url: user.avatar_url
        }
      },
      accessToken
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me - Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT u.id, u.email, p.id as profile_id, p.full_name, p.college, p.phone, p.avatar_url, p.created_at FROM users u LEFT JOIN profiles p ON u.id = p.user_id WHERE u.id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = users[0];

    res.json({
      id: user.id,
      email: user.email,
      profile: {
        id: user.profile_id,
        user_id: user.id,
        full_name: user.full_name,
        college: user.college,
        phone: user.phone,
        avatar_url: user.avatar_url,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (req, res) => {
  // With JWT, logout is handled client-side by removing the token
  // Server can optionally blacklist the token or remove refresh tokens
  res.json({ message: 'Logged out successfully' });
});

module.exports = router;
