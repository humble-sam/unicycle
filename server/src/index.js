const path = require('path');
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// GLOBAL ERROR STATE
const startupErrors = [];

// Helper to safely require modules
const safeRequire = (name, optional = false) => {
  try {
    return require(name);
  } catch (e) {
    const msg = `Failed to load module: ${name} - ${e.message}`;
    console.error(msg);
    if (!optional) startupErrors.push(msg);
    return null;
  }
};

// 1. Load dotenv (Safe)
try {
  const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
  require('dotenv').config({ path: path.join(__dirname, '..', envFile) });
} catch (e) {
  startupErrors.push(`Dotenv load error: ${e.message}`);
}

// 2. Load Middleware (Safe)
const helmet = safeRequire('helmet');
const cors = safeRequire('cors');
const rateLimit = safeRequire('express-rate-limit');
const fs = safeRequire('fs');

// 3. Initialize Global Handlers
process.on('uncaughtException', (err) => {
  console.error('CRITICAL ERROR: Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('CRITICAL ERROR: Unhandled Rejection at:', promise, 'reason:', reason);
});

// 4. Configure App (Safe)
try {
  if (helmet) app.use(helmet());
  if (cors) app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  if (rateLimit) {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 1000, // 1000 requests per 15 min per IP
      message: { error: 'Too many requests, please try again later' },
      standardHeaders: true,
      legacyHeaders: false
    });
    app.use('/api', limiter);
  }
} catch (e) {
  startupErrors.push(`Middleware config error: ${e.message}`);
}

// 5. Health Check (CRITICAL: Must work even if everything else fails)
app.get('/health', (req, res) => {
  res.json({
    status: startupErrors.length > 0 ? 'degraded' : 'ok',
    timestamp: new Date().toISOString(),
    startupErrors,
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    }
  });
});

// 5.5. Debug endpoint for upload path diagnosis
app.get('/debug/upload-path', (req, res) => {
  const path = require('path');
  const fs = require('fs');

  // Simulate the path calculation from upload.js middleware
  const middlewareDirname = path.resolve(__dirname, 'middleware');
  const uploadsBase = path.resolve(middlewareDirname, '..', '..', '..', 'uploads');
  const productsPath = path.join(uploadsBase, 'products');

  let productsContents = [];
  try {
    productsContents = fs.readdirSync(productsPath);
  } catch (e) {
    productsContents = [`Error reading: ${e.message}`];
  }

  res.json({
    cwd: process.cwd(),
    __dirname: __dirname,
    middlewareDirname,
    uploadsBase,
    uploadsBaseExists: fs.existsSync(uploadsBase),
    productsPath,
    productsPathExists: fs.existsSync(productsPath),
    productsContents,
    fileCount: productsContents.length
  });
});

// 6. Safe Route Loading Helper
const loadRoute = (pathStr) => {
  try {
    return require(pathStr);
  } catch (e) {
    startupErrors.push(`Route load failed: ${pathStr} - ${e.message}`);
    return express.Router().all('*', (req, res) => res.status(500).json({ error: 'Route failed to load', details: e.message }));
  }
};

// 7. Load Routes (Wrapped)
try {
  app.use('/api/auth', loadRoute('./routes/auth'));
  app.use('/api/products', loadRoute('./routes/products'));
  app.use('/api/profiles', loadRoute('./routes/profiles'));
  app.use('/api/wishlist', loadRoute('./routes/wishlist'));
  app.use('/api/analytics', loadRoute('./routes/analytics'));
  app.use('/api/reports', loadRoute('./routes/reports'));
  app.use('/api/ambassadors', loadRoute('./routes/ambassadors'));
  app.use('/api/admin', loadRoute('./routes/admin'));

  // Settings middleware
  try {
    const { checkMaintenanceMode, checkAPIEnabled } = require('./middleware/settings');
    app.use('/api', checkAPIEnabled);
    app.use('/api', checkMaintenanceMode);
  } catch (e) {
    startupErrors.push(`Settings middleware error: ${e.message}`);
  }

} catch (e) {
  startupErrors.push(`Routing setup error: ${e.message}`);
}

// 8. Static Files (Safe)
try {
  const possiblePaths = [
    path.join(process.cwd(), 'dist'),
    path.join(__dirname, '../../dist'),
    process.cwd()
  ];

  let buildPath = possiblePaths[0];
  let found = false;

  if (fs) {
    for (const p of possiblePaths) {
      if (fs.existsSync(p) && fs.existsSync(path.join(p, 'index.html'))) {
        buildPath = p;
        found = true;
        break;
      }
    }

    // Serve static assets (JS, CSS) with cache
    app.use(express.static(buildPath, {
      dotfiles: 'ignore',
      maxAge: '1d',
      setHeaders: (res, filePath) => {
        // Never cache HTML files
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.setHeader('Pragma', 'no-cache');
          res.setHeader('Expires', '0');
        }
      }
    }));

    app.get('*', (req, res) => {
      if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Endpoint not found' });

      const indexPath = path.join(buildPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        // Set no-cache headers for HTML
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.sendFile(indexPath);
      } else {
        res.status(500).send(`
          <h1>Frontend Build Not Found</h1>
          <p>Server is running, but UI build is missing.</p>
          <pre>${JSON.stringify(startupErrors, null, 2)}</pre>
        `);
      }
    });
  }
} catch (e) {
  startupErrors.push(`Static file setup error: ${e.message}`);
}

// 9. Start Server
app.listen(PORT, () => {
  console.log(`Ultra-Safe API Server running on port ${PORT}`);
  if (startupErrors.length > 0) {
    console.error('STARTUP ERRORS DETECTED:', startupErrors);
  } else {
    console.log('Startup successful with no immediate errors');
  }
});

module.exports = app;
