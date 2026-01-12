const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Get admin JWT secret (separate from user JWT)
const getAdminSecret = () => {
  return process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET + '_admin';
};

// Authenticate admin token
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Admin access token required' });
  }

  try {
    const decoded = jwt.verify(token, getAdminSecret());

    // Verify admin still exists and is active
    const [admins] = await db.query(
      'SELECT id, email, full_name, role, is_active FROM admins WHERE id = ?',
      [decoded.adminId]
    );

    if (admins.length === 0) {
      return res.status(401).json({ error: 'Admin not found' });
    }

    const admin = admins[0];

    if (!admin.is_active) {
      return res.status(403).json({ error: 'Admin account is deactivated' });
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      fullName: admin.full_name,
      role: admin.role
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Admin token expired' });
    }
    return res.status(403).json({ error: 'Invalid admin token' });
  }
};

// Role-based access control middleware
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.admin.role
      });
    }

    next();
  };
};

// Convenience middleware for specific roles
const isSuperAdmin = requireRole('super_admin');
const isAdmin = requireRole('super_admin', 'admin');
const isModerator = requireRole('super_admin', 'admin', 'moderator');

// Log admin activity
const logActivity = async (adminId, action, entityType = null, entityId = null, details = null, ipAddress = null) => {
  try {
    const { v4: uuidv4 } = require('uuid');
    await db.query(
      `INSERT INTO admin_activity_logs (id, admin_id, action, entity_type, entity_id, details, ip_address)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), adminId, action, entityType, entityId, JSON.stringify(details), ipAddress]
    );
  } catch (err) {
    console.error('Failed to log admin activity:', err);
  }
};

// Middleware to auto-log actions
const withActivityLog = (action, entityType = null) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = function(data) {
      // Log successful actions (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.admin) {
        const entityId = req.params.id || data?.id || null;
        const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        logActivity(req.admin.id, action, entityType, entityId, { method: req.method, path: req.path }, ip);
      }
      return originalJson(data);
    };

    next();
  };
};

module.exports = {
  authenticateAdmin,
  requireRole,
  isSuperAdmin,
  isAdmin,
  isModerator,
  logActivity,
  withActivityLog,
  getAdminSecret
};
