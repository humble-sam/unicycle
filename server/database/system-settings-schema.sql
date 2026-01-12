-- System Settings Schema
-- Run this after the main schema.sql and admin-schema.sql

-- =====================================================
-- SYSTEM SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS system_settings (
    id CHAR(36) PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    setting_type ENUM('boolean', 'string', 'number', 'json') DEFAULT 'string',
    description TEXT,
    category VARCHAR(50) DEFAULT 'general',
    updated_by CHAR(36),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_setting_key (setting_key),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default settings
INSERT INTO system_settings (id, setting_key, setting_value, setting_type, description, category) VALUES
(UUID(), 'maintenance_mode', 'false', 'boolean', 'Enable maintenance mode (disables all public access)', 'system'),
(UUID(), 'maintenance_message', 'We are currently performing maintenance. Please check back soon.', 'string', 'Message shown during maintenance', 'system'),
(UUID(), 'registration_enabled', 'true', 'boolean', 'Allow new user registrations', 'features'),
(UUID(), 'login_enabled', 'true', 'boolean', 'Allow user logins', 'features'),
(UUID(), 'product_creation_enabled', 'true', 'boolean', 'Allow users to create new product listings', 'features'),
(UUID(), 'product_editing_enabled', 'true', 'boolean', 'Allow users to edit their products', 'features'),
(UUID(), 'wishlist_enabled', 'true', 'boolean', 'Enable wishlist functionality', 'features'),
(UUID(), 'api_enabled', 'true', 'boolean', 'Enable all API endpoints (emergency shutdown)', 'system'),
(UUID(), 'site_name', 'UniCycle', 'string', 'Website name', 'general'),
(UUID(), 'site_description', 'Campus Marketplace', 'string', 'Website description', 'general'),
(UUID(), 'max_products_per_user', '50', 'number', 'Maximum products a user can list', 'limits'),
(UUID(), 'max_images_per_product', '5', 'number', 'Maximum images per product', 'limits'),
(UUID(), 'require_email_verification', 'false', 'boolean', 'Require email verification for new users', 'security')
ON DUPLICATE KEY UPDATE setting_key = setting_key;



