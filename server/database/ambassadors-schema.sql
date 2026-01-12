-- Campus Ambassadors Schema
-- Run this after the main schema.sql

-- Table for approved campus ambassadors
CREATE TABLE IF NOT EXISTS campus_ambassadors (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    college VARCHAR(255) NOT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    bio TEXT,
    social_instagram VARCHAR(255),
    social_linkedin VARCHAR(255),
    approved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved_by CHAR(36) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user (user_id),
    UNIQUE KEY unique_college (college),
    CONSTRAINT fk_ambassador_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ambassador_admin FOREIGN KEY (approved_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table for ambassador applications
CREATE TABLE IF NOT EXISTS ambassador_applications (
    id CHAR(36) NOT NULL PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    college VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    year_of_study VARCHAR(50),
    why_ambassador TEXT NOT NULL,
    social_instagram VARCHAR(255),
    social_linkedin VARCHAR(255),
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    reviewed_by CHAR(36) NULL,
    reviewed_at TIMESTAMP NULL,
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_application_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_application_admin FOREIGN KEY (reviewed_by) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index for faster lookups
CREATE INDEX idx_ambassadors_college ON campus_ambassadors(college);
CREATE INDEX idx_ambassadors_status ON campus_ambassadors(status);
CREATE INDEX idx_applications_status ON ambassador_applications(status);
CREATE INDEX idx_applications_college ON ambassador_applications(college);
