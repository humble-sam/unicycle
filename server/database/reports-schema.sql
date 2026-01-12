-- Product Reports Schema
-- Run this after the main schema.sql

-- =====================================================
-- PRODUCT REPORTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_reports (
    id CHAR(36) PRIMARY KEY,
    product_id CHAR(36) NOT NULL,
    reporter_id CHAR(36) NOT NULL,
    reason ENUM('spam', 'inappropriate', 'fraud', 'duplicate', 'other') NOT NULL,
    description TEXT,
    status ENUM('pending', 'reviewed', 'resolved', 'dismissed') DEFAULT 'pending',
    reviewed_by CHAR(36) NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewed_by) REFERENCES admins(id) ON DELETE SET NULL,
    INDEX idx_product_id (product_id),
    INDEX idx_reporter_id (reporter_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
