CREATE DATABASE IF NOT EXISTS era_creatio;
USE era_creatio;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  source VARCHAR(50) DEFAULT 'website',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contact_inquiries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(30) NOT NULL,
  interest VARCHAR(100) NULL,
  message TEXT NULL,
  source VARCHAR(50) DEFAULT 'website',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(120) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  admin_user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
  INDEX idx_admin_sessions_expires_at (expires_at),
  INDEX idx_admin_sessions_admin_user_id (admin_user_id)
);

CREATE TABLE IF NOT EXISTS blogs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(180) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT NOT NULL,
  content LONGTEXT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  category VARCHAR(80) NOT NULL,
  author VARCHAR(120) NOT NULL DEFAULT 'Era Creatio Editorial',
  is_published TINYINT(1) NOT NULL DEFAULT 1,
  published_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_blogs_published_at (published_at),
  INDEX idx_blogs_is_published (is_published)
);

CREATE TABLE IF NOT EXISTS gallery_entries (
  id INT PRIMARY KEY AUTO_INCREMENT,
  gallery_type ENUM('independent', 'commercial') NOT NULL,
  category ENUM('ongoing', 'completed') NOT NULL,
  place_name VARCHAR(160) NOT NULL,
  image_1_url VARCHAR(500) NOT NULL,
  image_2_url VARCHAR(500) NOT NULL,
  image_3_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_gallery_type_category (gallery_type, category),
  INDEX idx_gallery_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS commercial_projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  slug VARCHAR(180) NOT NULL UNIQUE,
  name VARCHAR(180) NOT NULL,
  location VARCHAR(180) NOT NULL,
  category ENUM('ongoing', 'completed') NOT NULL DEFAULT 'ongoing',
  land_area VARCHAR(80) NOT NULL,
  units VARCHAR(80) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  summary TEXT NULL,
  details LONGTEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_commercial_projects_category (category),
  INDEX idx_commercial_projects_updated_at (updated_at)
);

INSERT INTO admin_users (username, password_hash)
VALUES (
  'admin@123',
  'eraadmin2026salt:e6156163c1fe3abcebe76d89c3d87388635d17a527c7880a0da840b29e1ad9282a2dfd5d738773acc9237a50e98929c713691c45e4d59eace472f550476fed7c'
)
ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash);
