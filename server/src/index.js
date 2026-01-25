const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Minimal Test Server - Debugging Hostinger 503

app.get('/', (req, res) => {
  res.send(`
    <h1>Minimal Server Running!</h1>
    <p>Hostinger 503 Issue Debugging</p>
    <p>Port: ${PORT}</p>
    <p>Time: ${new Date().toISOString()}</p>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      PORT: process.env.PORT,
      NODE_ENV: process.env.NODE_ENV
    }
  });
});

app.listen(PORT, () => {
  console.log(`Minimal API Server running on port ${PORT}`);
});

module.exports = app;
