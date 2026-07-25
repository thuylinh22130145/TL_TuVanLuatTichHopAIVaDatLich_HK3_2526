DROP DATABASE IF EXISTS law_firm_db;
CREATE DATABASE law_firm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE law_firm_db;

CREATE TABLE users (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    role ENUM('ADMIN', 'LAWYER', 'USER') NOT NULL DEFAULT 'USER',
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    email_verified_at DATETIME NULL,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE staffs (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE email_otps (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    purpose ENUM('REGISTER') NOT NULL DEFAULT 'REGISTER',
    code_hash VARCHAR(64) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INT UNSIGNED NOT NULL DEFAULT 0,
    consumed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email_otps_user (user_id, purpose, created_at),
    INDEX idx_email_otps_expiry (expires_at),
    CONSTRAINT fk_email_otps_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE legal_categories (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT,
    status ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE lawyers (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    title VARCHAR(120) NOT NULL DEFAULT 'Luật sư',
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    specialization VARCHAR(255) NOT NULL,
    experience_years INT UNSIGNED NOT NULL DEFAULT 0,
    bio TEXT,
    availability_status ENUM('AVAILABLE', 'BUSY', 'OFFLINE') NOT NULL DEFAULT 'AVAILABLE',
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_lawyers_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE lawyer_specializations (
    lawyer_id INT UNSIGNED NOT NULL,
    category_id INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lawyer_id, category_id),
    CONSTRAINT fk_lawyer_specs_lawyer FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE,
    CONSTRAINT fk_lawyer_specs_category FOREIGN KEY (category_id) REFERENCES legal_categories(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE lawyer_schedules (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    lawyer_id INT UNSIGNED NOT NULL,
    day_of_week TINYINT UNSIGNED NOT NULL COMMENT '0=Sunday, 6=Saturday',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_lawyer_schedule (lawyer_id, day_of_week, start_time, end_time),
    CONSTRAINT chk_schedule_day CHECK (day_of_week BETWEEN 0 AND 6),
    CONSTRAINT chk_schedule_time CHECK (start_time < end_time),
    CONSTRAINT fk_schedules_lawyer FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE lawyer_applications (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(120) NOT NULL,
    phone VARCHAR(20),
    license_number VARCHAR(100),
    specialization VARCHAR(255) NOT NULL,
    experience_years INT UNSIGNED NOT NULL DEFAULT 0,
    message TEXT,
    status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    review_note TEXT,
    reviewed_by INT UNSIGNED NULL,
    reviewed_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_applications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_applications_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE bookings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_code VARCHAR(20) NOT NULL UNIQUE,
    user_id INT UNSIGNED NULL,
    lawyer_id INT UNSIGNED NOT NULL,
    customer_name VARCHAR(120) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(120) NOT NULL,
    appointment_date DATETIME NOT NULL,
    duration_minutes SMALLINT UNSIGNED NOT NULL DEFAULT 60,
    summary_issue TEXT NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bookings_customer (user_id, appointment_date),
    INDEX idx_bookings_lawyer (lawyer_id, appointment_date),
    INDEX idx_bookings_status (status),
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_bookings_lawyer FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE lawyer_reviews (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    booking_id INT UNSIGNED NOT NULL UNIQUE,
    user_id INT UNSIGNED NOT NULL,
    lawyer_id INT UNSIGNED NOT NULL,
    rating TINYINT UNSIGNED NOT NULL,
    comment TEXT,
    status ENUM('VISIBLE', 'HIDDEN') NOT NULL DEFAULT 'VISIBLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT fk_reviews_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_lawyer FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE law_documents (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    category_id INT UNSIGNED NULL,
    title VARCHAR(255) NOT NULL,
    document_number VARCHAR(100),
    issuing_authority VARCHAR(255),
    effective_date DATE NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(1000) NOT NULL,
    mime_type VARCHAR(100),
    checksum VARCHAR(64),
    processing_status ENUM('PENDING', 'PROCESSING', 'READY', 'FAILED') NOT NULL DEFAULT 'PENDING',
    uploaded_by INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_documents_category FOREIGN KEY (category_id) REFERENCES legal_categories(id) ON DELETE SET NULL,
    CONSTRAINT fk_documents_uploader FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE document_chunks (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    document_id INT UNSIGNED NOT NULL,
    chunk_index INT UNSIGNED NOT NULL,
    content LONGTEXT NOT NULL,
    token_count INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_document_chunk (document_id, chunk_index),
    CONSTRAINT fk_chunks_document FOREIGN KEY (document_id) REFERENCES law_documents(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE law_embeddings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    chunk_id BIGINT UNSIGNED NOT NULL UNIQUE,
    model_name VARCHAR(120) NOT NULL,
    dimensions INT UNSIGNED NOT NULL,
    embedding JSON NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_embeddings_chunk FOREIGN KEY (chunk_id) REFERENCES document_chunks(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE chat_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NULL,
    title VARCHAR(255),
    detected_category_id INT UNSIGNED NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_chat_sessions_category FOREIGN KEY (detected_category_id) REFERENCES legal_categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE chat_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    role ENUM('USER', 'ASSISTANT', 'SYSTEM') NOT NULL,
    content LONGTEXT NOT NULL,
    source_type ENUM('INTERNAL_RAG', 'WEB_FALLBACK', 'NONE') NOT NULL DEFAULT 'NONE',
    citations JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_chat_messages_session (session_id, created_at),
    CONSTRAINT fk_chat_messages_session FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE notifications (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    type VARCHAR(80) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    read_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_notifications_user (user_id, read_at, created_at),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO legal_categories (name, slug) VALUES
('Hình sự', 'hinh-su'),
('Dân sự', 'dan-su'),
('Đất đai', 'dat-dai'),
('Hôn nhân và Gia đình', 'hon-nhan-gia-dinh'),
('Doanh nghiệp', 'doanh-nghiep'),
('Lao động', 'lao-dong'),
('Hành chính', 'hanh-chinh'),
('Thuế', 'thue');
