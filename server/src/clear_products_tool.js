const path = require('path');
const fs = require('fs');

// Load environment variables (mimicking index.js logic)
try {
    const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
    // Attempt to find env file in root (../../)
    const envPath = path.resolve(__dirname, '../../', envFile);

    if (fs.existsSync(envPath)) {
        console.log(`Loading env from ${envPath}`);
        require('dotenv').config({ path: envPath });
    } else {
        console.log('No .env file found via relative path, relying on system env.');
    }
} catch (e) {
    console.error("Env load error:", e.message);
}

const pool = require('./config/database');

async function clearProducts() {
    try {
        console.log("⚠️  Attempting to DELETE ALL data from 'products' table...");
        const [result] = await pool.query("DELETE FROM products");
        console.log(`✅ Success! Deleted ${result.affectedRows} products.`);
    } catch (error) {
        console.error("❌ Error deleting products:", error.message);
    } finally {
        process.exit();
    }
}

clearProducts();
