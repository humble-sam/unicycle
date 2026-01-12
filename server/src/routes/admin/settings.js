const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/database');
const { authenticateAdmin, logActivity } = require('../../middleware/adminAuth');
const { getSettingValue, clearCache } = require('../../middleware/settings');

// Public endpoint to check maintenance mode and feature flags (for frontend)
router.get('/public/status', async (req, res) => {
  try {
    const maintenanceMode = await getSettingValue('maintenance_mode', false);
    const maintenanceMessage = await getSettingValue('maintenance_message', 'We are currently performing maintenance. Please check back soon.');
    const registrationEnabled = await getSettingValue('registration_enabled', true);
    const loginEnabled = await getSettingValue('login_enabled', true);
    const productCreationEnabled = await getSettingValue('product_creation_enabled', true);
    const productEditingEnabled = await getSettingValue('product_editing_enabled', true);
    const wishlistEnabled = await getSettingValue('wishlist_enabled', true);
    const apiEnabled = await getSettingValue('api_enabled', true);

    res.json({
      maintenance_mode: maintenanceMode,
      maintenance_message: maintenanceMessage,
      registration_enabled: registrationEnabled,
      login_enabled: loginEnabled,
      product_creation_enabled: productCreationEnabled,
      product_editing_enabled: productEditingEnabled,
      wishlist_enabled: wishlistEnabled,
      api_enabled: apiEnabled
    });
  } catch (error) {
    console.error('Public status check error:', error);
    // Return defaults on error (fail open)
    res.json({
      maintenance_mode: false,
      maintenance_message: 'We are currently performing maintenance. Please check back soon.',
      registration_enabled: true,
      login_enabled: true,
      product_creation_enabled: true,
      product_editing_enabled: true,
      wishlist_enabled: true,
      api_enabled: true
    });
  }
});

// Apply auth to all other routes
router.use(authenticateAdmin);

// GET /api/admin/settings - Get all settings
router.get('/', async (req, res) => {
  try {
    const [settings] = await db.query(
      'SELECT * FROM system_settings ORDER BY category, setting_key'
    );
    
    // Group by category
    const grouped = {};
    settings.forEach(setting => {
      const category = setting.category || 'general';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      
      // Convert value based on type
      let value = setting.setting_value;
      if (setting.setting_type === 'boolean') {
        value = value === 'true' || value === '1';
      } else if (setting.setting_type === 'number') {
        value = parseFloat(value) || parseInt(value) || 0;
      } else if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch {
          // Keep as string if parse fails
        }
      }
      
      grouped[category].push({
        id: setting.id,
        key: setting.setting_key,
        value: value,
        type: setting.setting_type,
        description: setting.description,
        category: setting.category,
        updatedAt: setting.updated_at,
        updatedBy: setting.updated_by
      });
    });
    
    res.json({ settings: grouped });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// GET /api/admin/settings/:key - Get specific setting
router.get('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const [settings] = await db.query(
      'SELECT * FROM system_settings WHERE setting_key = ?',
      [key]
    );
    
    if (settings.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    const setting = settings[0];
    let value = setting.setting_value;
    
    // Convert based on type
    if (setting.setting_type === 'boolean') {
      value = value === 'true' || value === '1';
    } else if (setting.setting_type === 'number') {
      value = parseFloat(value) || parseInt(value) || 0;
    } else if (setting.setting_type === 'json') {
      try {
        value = JSON.parse(value);
      } catch {
        // Keep as string if parse fails
      }
    }
    
    res.json({
      id: setting.id,
      key: setting.setting_key,
      value: value,
      type: setting.setting_type,
      description: setting.description,
      category: setting.category,
      updatedAt: setting.updated_at,
      updatedBy: setting.updated_by
    });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Failed to fetch setting' });
  }
});

// PUT /api/admin/settings/:key - Update setting
router.put('/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    // Get existing setting to check type
    const [existing] = await db.query(
      'SELECT * FROM system_settings WHERE setting_key = ?',
      [key]
    );
    
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Setting not found' });
    }
    
    const setting = existing[0];
    let stringValue = String(value);
    
    // Validate and convert based on type
    if (setting.setting_type === 'boolean') {
      stringValue = (value === true || value === 'true' || value === '1' || value === 1) ? 'true' : 'false';
    } else if (setting.setting_type === 'number') {
      const num = parseFloat(value) || parseInt(value);
      if (isNaN(num)) {
        return res.status(400).json({ error: 'Invalid number value' });
      }
      stringValue = String(num);
    } else if (setting.setting_type === 'json') {
      stringValue = typeof value === 'string' ? value : JSON.stringify(value);
    }
    
    // Update setting
    await db.query(
      'UPDATE system_settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
      [stringValue, req.admin.id, key]
    );
    
    // Clear cache to ensure changes take effect immediately
    clearCache();
    
    // Log activity
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(
      req.admin.id,
      'setting_update',
      'system_setting',
      setting.id,
      { key, oldValue: setting.setting_value, newValue: stringValue },
      ip
    );
    
    res.json({
      key,
      value: setting.setting_type === 'boolean' ? (stringValue === 'true') :
             setting.setting_type === 'number' ? parseFloat(stringValue) :
             setting.setting_type === 'json' ? JSON.parse(stringValue) : stringValue,
      message: 'Setting updated successfully'
    });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// PUT /api/admin/settings/bulk - Update multiple settings
router.put('/bulk', async (req, res) => {
  try {
    const { settings } = req.body;
    
    if (!Array.isArray(settings) || settings.length === 0) {
      return res.status(400).json({ error: 'Settings array required' });
    }
    
    const updates = [];
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    
    for (const { key, value } of settings) {
      // Get existing setting
      const [existing] = await db.query(
        'SELECT * FROM system_settings WHERE setting_key = ?',
        [key]
      );
      
      if (existing.length === 0) {
        continue; // Skip unknown settings
      }
      
      const setting = existing[0];
      let stringValue = String(value);
      
      // Convert based on type
      if (setting.setting_type === 'boolean') {
        stringValue = (value === true || value === 'true' || value === '1' || value === 1) ? 'true' : 'false';
      } else if (setting.setting_type === 'number') {
        const num = parseFloat(value) || parseInt(value);
        if (isNaN(num)) {
          continue; // Skip invalid numbers
        }
        stringValue = String(num);
      } else if (setting.setting_type === 'json') {
        stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      }
      
      // Update setting
      await db.query(
        'UPDATE system_settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
        [stringValue, req.admin.id, key]
      );
      
      // Log activity
      await logActivity(
        req.admin.id,
        'setting_update',
        'system_setting',
        setting.id,
        { key, oldValue: setting.setting_value, newValue: stringValue },
        ip
      );
      
      updates.push({ key, value: stringValue });
    }
    
    // Clear cache after bulk update
    clearCache();
    
    res.json({
      message: `Updated ${updates.length} settings`,
      updates
    });
  } catch (error) {
    console.error('Bulk update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// POST /api/admin/settings/maintenance/toggle - Quick toggle maintenance mode
router.post('/maintenance/toggle', async (req, res) => {
  try {
    const currentValue = await getSettingValue('maintenance_mode', false);
    const newValue = !currentValue;
    
    await db.query(
      'UPDATE system_settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
      [newValue ? 'true' : 'false', req.admin.id, 'maintenance_mode']
    );
    
    // Clear cache
    clearCache();
    
    // Log activity
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(
      req.admin.id,
      'maintenance_toggle',
      'system_setting',
      null,
      { enabled: newValue },
      ip
    );
    
    res.json({
      maintenance_mode: newValue,
      message: `Maintenance mode ${newValue ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    console.error('Toggle maintenance mode error:', error);
    res.status(500).json({ error: 'Failed to toggle maintenance mode' });
  }
});

// POST /api/admin/settings/emergency/shutdown - Emergency shutdown (disable all APIs)
router.post('/emergency/shutdown', async (req, res) => {
  try {
    await db.query(
      'UPDATE system_settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
      ['false', req.admin.id, 'api_enabled']
    );
    
    // Also enable maintenance mode
    await db.query(
      'UPDATE system_settings SET setting_value = ?, updated_by = ?, updated_at = NOW() WHERE setting_key = ?',
      ['true', req.admin.id, 'maintenance_mode']
    );
    
    // Clear cache
    clearCache();
    
    // Log activity
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    await logActivity(
      req.admin.id,
      'emergency_shutdown',
      'system_setting',
      null,
      { action: 'Emergency shutdown activated' },
      ip
    );
    
    res.json({
      api_enabled: false,
      maintenance_mode: true,
      message: 'Emergency shutdown activated. All APIs disabled and maintenance mode enabled.'
    });
  } catch (error) {
    console.error('Emergency shutdown error:', error);
    res.status(500).json({ error: 'Failed to activate emergency shutdown' });
  }
});

module.exports = router;
module.exports.getSettingValue = getSettingValue;

