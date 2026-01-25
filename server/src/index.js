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

// #region agent log - H1/H5: Track all incoming requests to see what's being requested
const requestLog = [];
app.use((req, res, next) => {
  const entry = { time: Date.now(), method: req.method, path: req.path, url: req.url };
  requestLog.push(entry);
  if (requestLog.length > 50) requestLog.shift(); // Keep last 50
  console.log(`[REQ] ${req.method} ${req.path}`);
  next();
});
// #endregion

// #region agent log - Debug endpoint to see recent requests
app.get('/api/debug-requests', (req, res) => {
  res.json({
    recentRequests: requestLog.slice(-20),
    total: requestLog.length,
    hypothesisId: 'H1-H5'
  });
});
// #endregion

// #region agent log - H2/H3: Directly serve JS asset with explicit headers to test MIME type
app.get('/api/serve-js-asset', (req, res) => {
  const fs = require('fs');
  const assetPath = path.join(process.cwd(), 'dist', 'assets', 'index-DmTW-UjC.js');

  if (fs.existsSync(assetPath)) {
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('X-Debug', 'direct-serve');
    const content = fs.readFileSync(assetPath);
    res.send(content);
  } else {
    res.status(404).json({ error: 'Asset not found', path: assetPath });
  }
});
// #endregion

// Security middleware
// Temporarily disable CSP to debug blank page issue
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false, // Disabled for debugging - will re-enable after fixing blank page
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

// DEBUG: Test if we can access an asset file directly
app.get('/api/test-asset', (req, res) => {
  const fs = require('fs');
  const buildPath = path.join(process.cwd(), 'dist');
  const assetPath = path.join(buildPath, 'assets', 'index-DmTW-UjC.js');

  try {
    if (fs.existsSync(assetPath)) {
      const stats = fs.statSync(assetPath);
      res.json({
        success: true,
        path: assetPath,
        exists: true,
        size: stats.size,
        message: 'Asset file exists and is readable'
      });
    } else {
      res.json({
        success: false,
        path: assetPath,
        exists: false,
        message: 'Asset file not found'
      });
    }
  } catch (e) {
    res.json({
      success: false,
      error: e.message,
      path: assetPath
    });
  }
});

// #region agent log - H4: Check if React app would crash - serve a test HTML with inline script
app.get('/api/debug-test-react', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
    <!DOCTYPE html>
    <html>
    <head><title>React Load Test</title></head>
    <body>
      <div id="test">Loading...</div>
      <script type="module">
        document.getElementById('test').textContent = 'Module scripts work!';
        // Try to load the actual React bundle
        import('/assets/index-DmTW-UjC.js')
          .then(() => { document.getElementById('test').textContent += ' React bundle loaded!'; })
          .catch(e => { document.getElementById('test').textContent += ' ERROR: ' + e.message; });
      </script>
    </body>
    </html>
  `);
});
// #endregion

// #region agent log - H2/H3: Full diagnostic of asset serving
app.get('/api/debug-full', async (req, res) => {
  const fs = require('fs');
  const buildPath = path.join(process.cwd(), 'dist');
  const jsPath = path.join(buildPath, 'assets', 'index-DmTW-UjC.js');
  const cssPath = path.join(buildPath, 'assets', 'index-rWHT4jOk.css');

  const results = {
    hypotheses: {
      H1: 'Static middleware route order',
      H2: 'Asset path resolution failure',
      H3: 'MIME type issue',
      H4: 'React app crashes',
      H5: 'Request blocked by middleware'
    },
    buildPath,
    jsExists: fs.existsSync(jsPath),
    cssExists: fs.existsSync(cssPath),
    jsSize: fs.existsSync(jsPath) ? fs.statSync(jsPath).size : 0,
    cssSize: fs.existsSync(cssPath) ? fs.statSync(cssPath).size : 0,
    recentRequests: requestLog.slice(-10),
    nodeEnv: process.env.NODE_ENV,
    testUrls: {
      directJs: '/api/serve-js-asset',
      testReact: '/api/debug-test-react',
      assetJs: '/assets/index-DmTW-UjC.js',
      assetCss: '/assets/index-rWHT4jOk.css'
    }
  };

  res.json(results);
});
// #endregion

// DEBUG: Test static file serving
app.get('/api/debug-static', (req, res) => {
  const fs = require('fs');
  const buildPath = path.join(process.cwd(), 'dist');
  const indexPath = path.join(buildPath, 'index.html');
  const assetsPath = path.join(buildPath, 'assets');

  let indexContent = '';
  let assetsFiles = [];

  try {
    if (fs.existsSync(indexPath)) {
      indexContent = fs.readFileSync(indexPath, 'utf8');
      // Extract script and link tags
      const scriptMatch = indexContent.match(/<script[^>]*src="([^"]+)"/);
      const linkMatch = indexContent.match(/<link[^>]*href="([^"]+)"/);
      indexContent = {
        hasScript: !!scriptMatch,
        scriptSrc: scriptMatch ? scriptMatch[1] : null,
        hasLink: !!linkMatch,
        linkHref: linkMatch ? linkMatch[1] : null,
        fullHtml: indexContent.substring(0, 500) // First 500 chars
      };
    }

    if (fs.existsSync(assetsPath)) {
      assetsFiles = fs.readdirSync(assetsPath);
    }
  } catch (e) {
    indexContent = { error: e.message };
  }

  res.json({
    buildPath,
    indexPath,
    assetsPath,
    indexExists: fs.existsSync(indexPath),
    assetsExists: fs.existsSync(assetsPath),
    indexContent,
    assetsFiles
  });
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
      const hasAssets = exists && fs.existsSync(path.join(p, 'assets'));
      results[p] = { exists, hasIndex, hasAssets, files };
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

  // Check what the server is actually using
  if (process.env.NODE_ENV === 'production') {
    let buildPath = possiblePaths[0];
    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
        buildPath = p;
        break;
      }
    }
    results['server_using'] = buildPath;
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

// Serve static files from React build
// Look for dist folder regardless of NODE_ENV for robustness
const possiblePaths = [
  path.join(process.cwd(), 'dist'),           // root/dist
  path.join(__dirname, '../../dist'),         // server/../../dist
  process.cwd()                               // root (fallback)
];

let buildPath = possiblePaths[0];
let found = false;
for (const p of possiblePaths) {
  if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
    buildPath = p;
    found = true;
    console.log('✓ Serving frontend from:', buildPath);
    break;
  }
}

if (!found) {
  console.log('! Frontend build not found in common paths, will attempt to serve current directory if index.html exists');
}

// Log when static middleware processes a request (helpful for debug)
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    // Basic request logging
  }
  next();
});

// Serve static assets (JS, CSS, images, etc.)
app.use(express.static(buildPath, {
  dotfiles: 'ignore',
  maxAge: '1d',
  etag: true,
  lastModified: true
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', buildPath, found, timestamp: new Date().toISOString() });
});

// Handle React Router - serve index.html for all non-API routes
app.get('*', (req, res) => {
  // Don't serve index.html for API routes
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }

  const indexPath = path.join(buildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    console.error('✗ ERROR: No index file found in:', buildPath);
    res.status(500).send('Frontend build not found. Please check server logs or run npm run build.');
  }
});

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
