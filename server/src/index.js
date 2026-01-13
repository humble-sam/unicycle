const path = require('path');
// Load environment variables
// In production, use .env.production (committed to git for Hostinger)
// In development, use .env (gitignored)
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
require('dotenv').config({ path: path.join(__dirname, '..', envFile) });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Debug: Log environment variables (remove in production later)
console.log('ENV CHECK:', {
  DB_HOST: process.env.DB_HOST || 'NOT SET',
  DB_USER: process.env.DB_USER || 'NOT SET',
  DB_NAME: process.env.DB_NAME || 'NOT SET',
  NODE_ENV: process.env.NODE_ENV || 'NOT SET',
  PORT: process.env.PORT || 'NOT SET'
});

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const profileRoutes = require('./routes/profiles');
const wishlistRoutes = require('./routes/wishlist');
const analyticsRoutes = require('./routes/analytics');
const reportsRoutes = require('./routes/reports');
const ambassadorsRoutes = require('./routes/ambassadors');
const adminRoutes = require('./routes/admin');

// Import settings middleware
const { checkMaintenanceMode, checkAPIEnabled } = require('./middleware/settings');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: { error: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 attempts per hour
  message: { error: 'Too many login attempts, please try again later' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check (bypass maintenance mode)
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./config/database');
    await db.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (err) {
    res.json({ 
      status: 'ok', 
      database: 'disconnected',
      error: err.message,
      timestamp: new Date().toISOString() 
    });
  }
});

// DEBUG: Check file paths (REMOVE AFTER DEBUGGING)
app.get('/api/debug-paths', (req, res) => {
  const fs = require('fs');
  const possiblePaths = [
    path.join(__dirname, '../public'),
    path.join(__dirname, '../../dist'),
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'server/public'),
    path.join(process.cwd(), 'public'),
    process.cwd()
  ];
  
  const results = {};
  possiblePaths.forEach(p => {
    try {
      const exists = fs.existsSync(p);
      const hasIndex = exists && fs.existsSync(path.join(p, 'index.html'));
      const files = exists ? fs.readdirSync(p).slice(0, 10) : [];
      results[p] = { exists, hasIndex, files };
    } catch (e) {
      results[p] = { error: e.message };
    }
  });
  
  // Also check root directory contents
  try {
    results['cwd_contents'] = fs.readdirSync(process.cwd());
  } catch (e) {
    results['cwd_contents'] = { error: e.message };
  }
  
  res.json(results);
});

// DEBUG: Show all environment variables (REMOVE AFTER DEBUGGING)
app.get('/api/debug-env', (req, res) => {
  // Get all env var keys (not values for security)
  const envKeys = Object.keys(process.env);
  const dbRelated = envKeys.filter(k => k.includes('DB') || k.includes('JWT') || k.includes('NODE') || k.includes('PORT'));
  
  res.json({
    totalEnvVars: envKeys.length,
    dbRelatedKeys: dbRelated,
    values: {
      DB_HOST: process.env.DB_HOST || 'NOT SET',
      DB_USER: process.env.DB_USER || 'NOT SET',
      DB_NAME: process.env.DB_NAME || 'NOT SET',
      DB_PORT: process.env.DB_PORT || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV || 'NOT SET',
      PORT: process.env.PORT || 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET (hidden)' : 'NOT SET'
    },
    cwd: process.cwd(),
    dirname: __dirname
  });
});

// Apply settings middleware to all API routes (except health check and admin)
app.use('/api', checkAPIEnabled);
app.use('/api', checkMaintenanceMode);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/ambassadors', ambassadorsRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Serve static files from React build in production
if (process.env.NODE_ENV === 'production') {
  // Build outputs to root (cwd) on Hostinger
  const buildPath = process.cwd();
  console.log('Serving frontend from:', buildPath);
  
  // Serve static assets (JS, CSS, images, etc.)
  app.use(express.static(buildPath));
  
  // Handle React Router - serve index.html for all non-API routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'Endpoint not found' });
    }
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Too many files. Maximum is 5 files.' });
    }
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: 'Internal server error' });
});

// Start server - listen on all interfaces for Hostinger
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   UniCycle API Server                                 ║
║   Running on port ${PORT}                               ║
║                                                       ║
║   Endpoints:                                          ║
║   • Auth:      /api/auth                              ║
║   • Products:  /api/products                          ║
║   • Profiles:  /api/profiles                          ║
║   • Wishlist:  /api/wishlist                          ║
║   • Analytics: /api/analytics                         ║
║   • Admin:     /api/admin                             ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
