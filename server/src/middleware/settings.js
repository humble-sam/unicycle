const db = require('../config/database');

// Cache settings for performance (refresh every 30 seconds)
let settingsCache = {};
let cacheTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds

// Get setting value with caching
const getSettingValue = async (key, defaultValue = null) => {
  const now = Date.now();
  
  // Refresh cache if expired
  if (now - cacheTimestamp > CACHE_TTL) {
    try {
      const [settings] = await db.query(
        'SELECT setting_key, setting_value, setting_type FROM system_settings'
      );
      
      settingsCache = {};
      settings.forEach(setting => {
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
        
        settingsCache[setting.setting_key] = value;
      });
      
      cacheTimestamp = now;
    } catch (error) {
      console.error('Error refreshing settings cache:', error);
      // Use cached values if available, otherwise return default
      if (Object.keys(settingsCache).length === 0) {
        return defaultValue;
      }
    }
  }
  
  return settingsCache[key] !== undefined ? settingsCache[key] : defaultValue;
};

// Clear cache (call after settings update)
const clearCache = () => {
  cacheTimestamp = 0;
  settingsCache = {};
};

// Check if maintenance mode is enabled
const checkMaintenanceMode = async (req, res, next) => {
  try {
    // Allow admin routes to bypass maintenance mode
    if (req.path.startsWith('/api/admin')) {
      return next();
    }
    
    const maintenanceMode = await getSettingValue('maintenance_mode', false);
    
    if (maintenanceMode) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: await getSettingValue('maintenance_message', 'We are currently performing maintenance. Please check back soon.'),
        maintenance: true
      });
    }
    
    next();
  } catch (error) {
    console.error('Maintenance mode check error:', error);
    // On error, allow request to proceed (fail open)
    next();
  }
};

// Check if API is enabled (emergency shutdown)
const checkAPIEnabled = async (req, res, next) => {
  try {
    // Allow admin routes to bypass API check
    if (req.path.startsWith('/api/admin')) {
      return next();
    }
    
    const apiEnabled = await getSettingValue('api_enabled', true);
    
    if (!apiEnabled) {
      return res.status(503).json({
        error: 'Service unavailable',
        message: 'The service is temporarily unavailable. Please try again later.',
        maintenance: true
      });
    }
    
    next();
  } catch (error) {
    console.error('API enabled check error:', error);
    // On error, allow request to proceed (fail open)
    next();
  }
};

// Check if a specific feature is enabled
const checkFeatureEnabled = (featureKey) => {
  return async (req, res, next) => {
    try {
      const enabled = await getSettingValue(featureKey, true);
      
      if (!enabled) {
        return res.status(403).json({
          error: 'Feature disabled',
          message: 'This feature is currently disabled.',
          feature: featureKey
        });
      }
      
      next();
    } catch (error) {
      console.error(`Feature check error for ${featureKey}:`, error);
      // On error, allow request to proceed (fail open)
      next();
    }
  };
};

// Convenience middleware for specific features
const checkRegistrationEnabled = checkFeatureEnabled('registration_enabled');
const checkLoginEnabled = checkFeatureEnabled('login_enabled');
const checkProductCreationEnabled = checkFeatureEnabled('product_creation_enabled');
const checkProductEditingEnabled = checkFeatureEnabled('product_editing_enabled');
const checkWishlistEnabled = checkFeatureEnabled('wishlist_enabled');

module.exports = {
  getSettingValue,
  clearCache,
  checkMaintenanceMode,
  checkAPIEnabled,
  checkFeatureEnabled,
  checkRegistrationEnabled,
  checkLoginEnabled,
  checkProductCreationEnabled,
  checkProductEditingEnabled,
  checkWishlistEnabled
};



