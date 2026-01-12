const express = require('express');
const router = express.Router();
const mysql = require('mysql2');
const db = require('../../config/database');
const { authenticateAdmin, isSuperAdmin } = require('../../middleware/adminAuth');

// Apply auth to all routes - only super_admin can access database viewer
router.use(authenticateAdmin);
router.use(isSuperAdmin);

// Allowed tables for security (prevent access to sensitive tables)
const ALLOWED_TABLES = [
  'users',
  'profiles',
  'products',
  'wishlist',
  'analytics_events',
  'analytics_daily',
  'admins',
  'admin_activity_logs'
];

// Get list of tables
router.get('/tables', async (req, res) => {
  try {
    const [tables] = await db.query(`
      SELECT
        TABLE_NAME as name,
        TABLE_ROWS as row_count,
        DATA_LENGTH as data_size,
        CREATE_TIME as created_at,
        UPDATE_TIME as updated_at
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN (?)
      ORDER BY TABLE_NAME
    `, [ALLOWED_TABLES]);

    res.json(tables);
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({ error: 'Failed to fetch tables' });
  }
});

// Get table schema
router.get('/tables/:name/schema', async (req, res) => {
  try {
    const { name } = req.params;

    if (!ALLOWED_TABLES.includes(name)) {
      return res.status(403).json({ error: 'Access to this table is not allowed' });
    }

    const [columns] = await db.query(`
      SELECT
        COLUMN_NAME as name,
        DATA_TYPE as type,
        COLUMN_TYPE as full_type,
        IS_NULLABLE as nullable,
        COLUMN_KEY as key_type,
        COLUMN_DEFAULT as default_value,
        EXTRA as extra
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [name]);

    // Get indexes
    const [indexes] = await db.query(`
      SELECT
        INDEX_NAME as name,
        COLUMN_NAME as column_name,
        NON_UNIQUE as non_unique
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
    `, [name]);

    res.json({ columns, indexes });
  } catch (error) {
    console.error('Get table schema error:', error);
    res.status(500).json({ error: 'Failed to fetch table schema' });
  }
});

// Get table data
router.get('/tables/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 rows
    const offset = (page - 1) * limit;
    const sort = req.query.sort || '';
    const order = req.query.order === 'asc' ? 'ASC' : 'DESC';
    const search = req.query.search || '';

    if (!ALLOWED_TABLES.includes(name)) {
      return res.status(403).json({ error: 'Access to this table is not allowed' });
    }

    // Get columns for this table
    const [columns] = await db.query(`
      SELECT COLUMN_NAME as name
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [name]);

    const columnNames = columns.map(c => c.name);

    // Build query - table name is already validated against ALLOWED_TABLES whitelist
    // Escape table name to prevent SQL injection (though whitelist already protects us)
    const escapedTableName = mysql.escapeId(name);
    let query = `SELECT * FROM ${escapedTableName}`;
    const params = [];

    // Add search if provided (searches in text columns)
    if (search) {
      const textColumns = await getTextColumns(name);
      if (textColumns.length > 0) {
        // Validate column names are in the actual table columns to prevent SQL injection
        const validTextColumns = textColumns.filter(col => columnNames.includes(col));
        if (validTextColumns.length > 0) {
          const searchConditions = validTextColumns.map(col => {
            const escapedCol = mysql.escapeId(col);
            return `${escapedCol} LIKE ?`;
          }).join(' OR ');
          query += ` WHERE (${searchConditions})`;
          validTextColumns.forEach(() => params.push(`%${search}%`));
        }
      }
    }

    // Add sorting - validate sort column is in whitelist of actual columns
    if (sort && columnNames.includes(sort)) {
      query += ` ORDER BY ${mysql.escapeId(sort)} ${order}`;
    } else if (columnNames.includes('created_at')) {
      query += ` ORDER BY ${mysql.escapeId('created_at')} DESC`;
    } else if (columnNames.includes('id')) {
      query += ` ORDER BY ${mysql.escapeId('id')} DESC`;
    }

    // Add pagination
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // Execute query (hide password_hash columns)
    let [rows] = await db.query(query, params);

    // Mask sensitive data
    rows = rows.map(row => {
      const maskedRow = { ...row };
      if (maskedRow.password_hash) maskedRow.password_hash = '********';
      if (maskedRow.token_hash) maskedRow.token_hash = '********';
      return maskedRow;
    });

    // Get total count - escape table name
    const escapedTableNameForCount = mysql.escapeId(name);
    let countQuery = `SELECT COUNT(*) as total FROM ${escapedTableNameForCount}`;
    const countParams = [];

    if (search) {
      const textColumns = await getTextColumns(name);
      if (textColumns.length > 0) {
        // Validate column names are in actual table columns
        const validTextColumns = textColumns.filter(col => columnNames.includes(col));
        if (validTextColumns.length > 0) {
          const searchConditions = validTextColumns.map(col => {
            const escapedCol = mysql.escapeId(col);
            return `${escapedCol} LIKE ?`;
          }).join(' OR ');
          countQuery += ` WHERE (${searchConditions})`;
          validTextColumns.forEach(() => countParams.push(`%${search}%`));
        }
      }
    }

    const [[{ total }]] = await db.query(countQuery, countParams);

    res.json({
      columns: columnNames,
      rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get table data error:', error);
    res.status(500).json({ error: 'Failed to fetch table data' });
  }
});

// Helper function to get text columns for a table
async function getTextColumns(tableName) {
  const [columns] = await db.query(`
    SELECT COLUMN_NAME as name
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = ?
    AND DATA_TYPE IN ('varchar', 'text', 'char', 'longtext', 'mediumtext', 'tinytext')
  `, [tableName]);

  return columns.map(c => c.name);
}

// Get database stats
router.get('/stats', async (req, res) => {
  try {
    // Get overall database stats
    const [[dbStats]] = await db.query(`
      SELECT
        SUM(TABLE_ROWS) as total_rows,
        SUM(DATA_LENGTH + INDEX_LENGTH) as total_size
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
    `);

    // Get per-table stats
    const [tableStats] = await db.query(`
      SELECT
        TABLE_NAME as name,
        TABLE_ROWS as rows,
        DATA_LENGTH as data_size,
        INDEX_LENGTH as index_size
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME IN (?)
      ORDER BY TABLE_ROWS DESC
    `, [ALLOWED_TABLES]);

    res.json({
      database: {
        totalRows: dbStats.total_rows || 0,
        totalSize: dbStats.total_size || 0,
        totalSizeMB: ((dbStats.total_size || 0) / 1024 / 1024).toFixed(2)
      },
      tables: tableStats
    });
  } catch (error) {
    console.error('Get database stats error:', error);
    res.status(500).json({ error: 'Failed to fetch database stats' });
  }
});

module.exports = router;
