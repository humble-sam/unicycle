const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verify user still exists and is not suspended
    const [users] = await db.query('SELECT id, email, is_suspended FROM users WHERE id = ?', [decoded.userId]);

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (users[0].is_suspended) {
      return res.status(403).json({ error: 'Your account has been suspended' });
    }

    req.user = {
      id: decoded.userId,
      email: users[0].email
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Optional auth - doesn't fail if no token, just doesn't set req.user
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await db.query('SELECT id, email FROM users WHERE id = ?', [decoded.userId]);

    if (users.length > 0) {
      req.user = {
        id: decoded.userId,
        email: users[0].email
      };
    }
  } catch (err) {
    // Token invalid but continue anyway
  }

  next();
};

module.exports = { authenticateToken, optionalAuth };
