const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    res.send('Minimal server is running!');
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
