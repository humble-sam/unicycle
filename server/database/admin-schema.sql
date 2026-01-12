-- Admin Dashboard Schema
-- Run this after the main schema.sql

-- =====================================================
-- ADMINS TABLE (Separate from regular users)
-- =====================================================
CREATE TABLE IF NOT EXISTS admins (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_email (email),
    INDEX idx_admin_role (role),
    INDEX idx_admin_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- ADMIN ACTIVITY LOGS (Audit Trail)
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_activity_logs (
    id CHAR(36) PRIMARY KEY,
    admin_id CHAR(36) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id CHAR(36),
    details JSON,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE CASCADE,
    INDEX idx_log_admin (admin_id),
    INDEX idx_log_action (action),
    INDEX idx_log_entity (entity_type, entity_id),
    INDEX idx_log_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- MODIFY USERS TABLE (Add suspension support)
-- =====================================================
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS suspension_reason TEXT NULL;

-- =====================================================
-- MODIFY PRODUCTS TABLE (Add moderation support)
-- =====================================================
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMP NULL,
    ADD COLUMN IF NOT EXISTS flag_reason TEXT NULL;

-- =====================================================
-- CREATE DEFAULT SUPER ADMIN
-- Password: admin123 (CHANGE THIS IMMEDIATELY)
-- Hash generated with bcrypt, 12 rounds
-- =====================================================
INSERT INTO admins (id, email, password_hash, full_name, role, is_active)
VALUES (
    UUID(),
    'admin@unicycle.digital',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qdNMGKCjEJqKAu',
    'Super Admin',
    'super_admin',
    TRUE
) ON DUPLICATE KEY UPDATE email = email;

-- Note: The default password is 'admin123'
-- IMPORTANT: Change this password immediately after first login!
