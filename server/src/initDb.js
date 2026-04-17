require('dotenv').config();
const { getPool } = require('./db');
const { createPasswordHash } = require('./auth');

// Extracting from process.env as per your .env file
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

/**
 * Seeds the initial admin user ONLY if they do not exist.
 * Logic: Check -> Hash (Expensive) -> Insert.
 */
async function seedAdminUser(pool) {
  if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
    console.warn("⚠️ Seeding skipped: ADMIN_USERNAME or ADMIN_PASSWORD missing in .env");
    return;
  }

  try {
    // 1. Check if the admin already exists
    const [existing] = await pool.execute(
      'SELECT id FROM admin_users WHERE username = ? LIMIT 1',
      [ADMIN_USERNAME]
    );

    if (existing.length > 0) {
      console.log("ℹ️ Admin user already exists. Skipping seed.");
      return;
    }

    // 2. Only hash and insert if the user is missing
    console.log("⏳ Admin user not found. Generating hash and seeding...");
    const adminPasswordHash = await createPasswordHash(ADMIN_PASSWORD);

    await pool.execute(
      `INSERT INTO admin_users (username, password_hash) VALUES (?, ?)`,
      [ADMIN_USERNAME, adminPasswordHash]
    );

    console.log("✅ Admin user seeded successfully.");
  } catch (error) {
    console.error("❌ Error during admin seeding:", error.message);
  }
}

/**
 * Initializes the database schema and performs initial seeding.
 */
async function initDb() {
  try {
    const pool = await getPool();

    // Array of table creation queries
    // Order matters here due to Foreign Key dependencies
    const tables = [
      // 1. Newsletter Subscribers
      `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) NOT NULL UNIQUE,
        source VARCHAR(50) DEFAULT 'website',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 2. Contact Inquiries
      `CREATE TABLE IF NOT EXISTS contact_inquiries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(120) NOT NULL,
        email VARCHAR(255) NULL,
        phone VARCHAR(30) NOT NULL,
        interest VARCHAR(100) NULL,
        message TEXT NULL,
        source VARCHAR(50) DEFAULT 'website',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 3. Admin Users (Required by admin_sessions)
      `CREATE TABLE IF NOT EXISTS admin_users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(120) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      // 4. Admin Sessions (Depends on admin_users)
      `CREATE TABLE IF NOT EXISTS admin_sessions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        admin_user_id INT NOT NULL,
        token_hash CHAR(64) NOT NULL UNIQUE,
        expires_at DATETIME NOT NULL,
        last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT fk_admin_user FOREIGN KEY (admin_user_id) 
          REFERENCES admin_users(id) ON DELETE CASCADE,
        INDEX idx_admin_sessions_expires_at (expires_at),
        INDEX idx_admin_sessions_admin_user_id (admin_user_id)
      )`,

      // 5. Media Assets
      `CREATE TABLE IF NOT EXISTS media_assets (
        id INT PRIMARY KEY AUTO_INCREMENT,
        file_name VARCHAR(255) NOT NULL,
        mime_type VARCHAR(120) NOT NULL,
        file_size INT UNSIGNED NOT NULL,
        data LONGBLOB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_media_assets_created_at (created_at)
      )`,

      // 6. Blogs
      `CREATE TABLE IF NOT EXISTS blogs (
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
      )`,

      // 7. Gallery Entries
      `CREATE TABLE IF NOT EXISTS gallery_entries (
        id INT PRIMARY KEY AUTO_INCREMENT,
        gallery_type ENUM('independent', 'commercial') NOT NULL,
        category ENUM('ongoing', 'completed') NOT NULL,
        place_name VARCHAR(160) NOT NULL,
        image_1_url VARCHAR(500) NOT NULL,
        image_2_url VARCHAR(500) NOT NULL,
        image_3_url VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_gallery_type_category (gallery_type, category)
      )`,

      // 8. Commercial Projects
      `CREATE TABLE IF NOT EXISTS commercial_projects (
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
        INDEX idx_commercial_projects_category (category)
      )`,

      // 9. Villas
      `CREATE TABLE IF NOT EXISTS villas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        slug VARCHAR(180) NOT NULL UNIQUE,
        name VARCHAR(180) NOT NULL,
        location VARCHAR(180) NOT NULL,
        acres VARCHAR(80) NULL,
        total_villas VARCHAR(80) NULL,
        banner_image_url VARCHAR(500) NULL,
        project_logo_url VARCHAR(500) NULL,
        status ENUM('draft', 'ongoing', 'completed') NOT NULL DEFAULT 'draft',
        brochure_pdf_url VARCHAR(500) NULL,
        description LONGTEXT NULL,
        overview_title VARCHAR(255) NULL,
        overview_description LONGTEXT NULL,
        overview_total_land VARCHAR(80) NULL,
        overview_total_units VARCHAR(80) NULL,
        configuration VARCHAR(120) NULL,
        starting_price VARCHAR(120) NULL,
        rera_number VARCHAR(120) NULL,
        walkthrough_video_url VARCHAR(500) NULL,
        exterior_images LONGTEXT NULL,
        interior_images LONGTEXT NULL,
        project_highlights LONGTEXT NULL,
        project_details LONGTEXT NULL,
        amenities LONGTEXT NULL,
        availability_chart_pdf_url VARCHAR(500) NULL,
        map_location_url VARCHAR(500) NULL,
        location_advantages LONGTEXT NULL,
        other_charges LONGTEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_villas_status (status),
        INDEX idx_villas_updated_at (updated_at)
      )`,
    ];

    // Execute each table creation sequentially
    for (const sql of tables) {
      await pool.query(sql);
    }

    await pool.query(
      `ALTER TABLE villas
       MODIFY status ENUM('draft', 'ongoing', 'upcoming', 'completed') NOT NULL DEFAULT 'draft'`,
    );

    const [projectLogoColumns] = await pool.query(
      `SHOW COLUMNS FROM villas LIKE 'project_logo_url'`
    );

    if (projectLogoColumns.length === 0) {
      await pool.query(
        `ALTER TABLE villas
         ADD COLUMN project_logo_url VARCHAR(500) NULL AFTER banner_image_url`
      );
    }

    console.log("🚀 Database schema verified/initialized.");
    
    // Seed the admin user
    await seedAdminUser(pool);

  } catch (error) {
    console.error("🛑 Critical: Database Initialization Failed!");
    console.error(error);
    process.exit(1); // Stop the server if DB isn't ready
  }
}

module.exports = initDb;