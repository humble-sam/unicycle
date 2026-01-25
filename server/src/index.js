const path = require('path');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// SAFE STARTUP WRAPPER
// This ensures the server starts even if dependencies fail

// Load env vars safely
try {
  const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
  require('dotenv').config({ path: path.join(__dirname, '..', envFile) });
} catch (e) {
  console.error('Failed to load dotenv:', e);
}

const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Crash handlers
process.on('uncaughtException', (err) => {
  console.error('CRITICAL ERROR: Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL ERROR: Unhandled Rejection at:', promise, 'reason:', reason);
});

let dbConnectionStatus = 'Not initialized';
let dbError = null;

// Initialize app components safely
try {
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
  });
  app.use('/api', limiter);

  // Try to load DB config but don't crash if it fails
  // We lazily require the routes to prevent them from crashing the server on load if DB is down
  // Note: Standard require would execute the file immediately.
  // We will load routes normally but catch errors if they bubble up from DB pool creation.
} catch (e) {
  console.error('Middleware init error:', e);
}

// Health Check (Always available)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    dbStatus: dbConnectionStatus,
    dbError: dbError ? dbError.message : null,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    }
  });
});

// Import Routes Safely
const safeRequire = (modulePath) => {
  try {
    return require(modulePath);
  } catch (e) {
    console.error(`Failed to load ${modulePath}:`, e);
    return express.Router().all('*', (req, res) => res.status(500).json({ error: `Module ${modulePath} failed to load`, details: e.message }));
  }
};

// Routes
app.use('/api/auth', safeRequire('./routes/auth'));
app.use('/api/products', safeRequire('./routes/products'));
app.use('/api/profiles', safeRequire('./routes/profiles'));
app.use('/api/wishlist', safeRequire('./routes/wishlist'));
app.use('/api/analytics', safeRequire('./routes/analytics'));
app.use('/api/reports', safeRequire('./routes/reports'));
app.use('/api/ambassadors', safeRequire('./routes/ambassadors'));
app.use('/api/admin', safeRequire('./routes/admin'));

// Middleware settings
try {
  const { checkMaintenanceMode, checkAPIEnabled } = require('./middleware/settings');
  app.use('/api', checkAPIEnabled);
  app.use('/api', checkMaintenanceMode);
} catch (e) {
  console.log('Settings middleware skipped');
}

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Serve static files
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
    break;
  }
}

const fs = require('fs');
app.use(express.static(buildPath, {
  dotfiles: 'ignore',
  maxAge: '1d',
  etag: true
}));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  const indexPath = path.join(buildPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('Frontend build not found. Server is running.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`UseCycle API running on port ${PORT}`);

  // Test DB connection after server start to not block it
  try {
    const db = require('./config/database');
    db.getConnection()
      .then(conn => {
        dbConnectionStatus = 'Connected';
        console.log('DB Connected successfully');
        conn.release();
      })
      .catch(err => {
        dbConnectionStatus = 'Failed';
        dbError = err;
        console.error('DB Connection Failed:', err.message);
      });
  } catch (e) {
    dbConnectionStatus = 'Config Error';
    dbError = e;
    console.error('DB Config Error:', e.message);
  }
});

module.exports = app;
