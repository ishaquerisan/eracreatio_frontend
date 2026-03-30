const { getPool } = require('./db');
const { createPasswordHash } = require('./auth');

const ADMIN_USERNAME = 'admin@123';
const ADMIN_PASSWORD = 'pass@123';

const SAMPLE_BLOGS = [
  {
    slug: 'top-vastu-tips-for-your-new-home',
    title: 'Top 10 Vastu Tips for Your New Home',
    excerpt:
      'Discover practical Vastu principles that help your new home feel balanced, bright, and welcoming from day one.',
    category: 'Design',
    author: 'Era Creatio Editorial',
    imageUrl: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600',
    publishedAt: '2026-02-20 10:00:00',
    content: `## Start with the Entrance
The main door is where energy enters the home. Keep this zone clean, well-lit, and uncluttered to create a positive first impression.

## Prioritize Natural Light
Morning sunlight is considered highly beneficial. Open windows early and design living areas to receive gentle daylight.

## Keep the Center Open
The center of the home should feel spacious. Avoid heavy storage or dark partitions in this zone.

### Practical Checklist
- Place mirrors where they reflect light, not clutter.
- Keep electrical distribution organized and hidden.
- Choose calming earth-tone accents for bedrooms.
- Add indoor plants near balconies for freshness.

> Vastu works best when combined with modern comfort, ventilation, and smart planning.

When you design with both aesthetics and energy flow in mind, your home becomes easier to live in and maintain over the long term.`,
  },
  {
    slug: 'why-gated-communities-are-the-future',
    title: 'Why Gated Communities Are the Future of Urban Living',
    excerpt:
      'From safety and social life to premium amenities, gated communities are redefining how families experience city living.',
    category: 'Lifestyle',
    author: 'Era Creatio Research Team',
    imageUrl: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600',
    publishedAt: '2026-02-15 09:30:00',
    content: `## Security and Peace of Mind
24/7 monitored entry, visitor management, and controlled movement add a layer of safety that independent units often lack.

## Everyday Convenience
Modern communities bring daily essentials closer to home: walking tracks, play zones, work corners, and leisure spaces.

## Better Social Ecosystem
Shared spaces naturally create stronger neighborhood interactions and community events.

### What Buyers Value Most
- Reliable security systems
- Power backup and water reliability
- Community maintenance standards
- Child-friendly common areas

For professionals and families, gated communities now offer a complete lifestyle package rather than just an address.`,
  },
  {
    slug: 'understanding-rera-your-rights-as-a-buyer',
    title: 'Understanding RERA: Your Rights as a Buyer',
    excerpt:
      'A simple guide to what RERA means for homebuyers and how it builds trust, transparency, and accountability.',
    category: 'Legal',
    author: 'Era Creatio Compliance Desk',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1600',
    publishedAt: '2026-02-10 11:45:00',
    content: `## What Is RERA?
RERA is a regulatory framework that protects buyers by improving transparency in project approvals, timelines, and commitments.

## Why It Matters
When a project is RERA-compliant, buyers can verify critical information and track legal accountability.

## Key Buyer Protections
- Transparent project registration
- Timely possession commitments
- Standardized agreement formats
- Defined complaint redressal mechanisms

## Before You Book
Always verify registration details and approved plans. Ask for all supporting documentation and keep records of commitments in writing.

A careful, documented buying process reduces long-term risk and creates confidence in your investment journey.`,
  },
];

const SAMPLE_COMMERCIAL_PROJECTS = [
  {
    slug: 'era-business-hub',
    name: 'Era Business Hub',
    location: 'Mavoor Road, Calicut',
    category: 'ongoing',
    landArea: '1.2 Acres',
    units: '48 Units',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600',
    summary:
      'A premium mixed-use business destination designed for modern offices, retail visibility, and long-term rental value.',
    details:
      'Era Business Hub is planned with efficient floor plates, ample frontage, and practical circulation for office and retail tenants. The project focuses on operational convenience, high visibility, and structural durability for long-term commercial performance.',
  },
  {
    slug: 'era-commercial-centre',
    name: 'Era Commercial Centre',
    location: 'Kuttikattor, Calicut',
    category: 'ongoing',
    landArea: '0.8 Acres',
    units: '32 Units',
    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600',
    summary:
      'A strategically positioned commercial centre focused on adaptable unit layouts and smooth customer movement.',
    details:
      'The project combines practical design with efficient space planning to support retail and service businesses. Carefully considered entry points, internal connectivity, and future-ready infrastructure help businesses operate with ease.',
  },
  {
    slug: 'era-plaza',
    name: 'Era Plaza',
    location: 'Feroke, Calicut',
    category: 'completed',
    landArea: '0.6 Acres',
    units: '24 Units',
    imageUrl: 'https://images.unsplash.com/photo-1554435493-93422e8220c8?w=1600',
    summary:
      'A completed commercial development delivering reliable business spaces in a well-connected location.',
    details:
      'Era Plaza demonstrates our execution standards in commercial construction, with durable structure, practical access, and efficient layouts. The completed project reflects dependable planning and long-term usability for businesses.',
  },
];

async function seedAdminUser(pool) {
  const adminPasswordHash = createPasswordHash(ADMIN_PASSWORD);

  await pool.execute(
    `INSERT INTO admin_users (username, password_hash)
     VALUES (?, ?)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [ADMIN_USERNAME, adminPasswordHash]
  );
}

async function seedSampleBlogs(pool) {
  const [rows] = await pool.query('SELECT COUNT(*) AS blogCount FROM blogs');
  const blogCount = Number(rows[0]?.blogCount || 0);

  if (blogCount > 0) {
    return;
  }

  for (const blog of SAMPLE_BLOGS) {
    await pool.execute(
      `INSERT INTO blogs
        (slug, title, excerpt, content, image_url, category, author, published_at, is_published)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        blog.slug,
        blog.title,
        blog.excerpt,
        blog.content,
        blog.imageUrl,
        blog.category,
        blog.author,
        blog.publishedAt,
      ]
    );
  }
}

async function seedSampleCommercialProjects(pool) {
  const [rows] = await pool.query('SELECT COUNT(*) AS projectCount FROM commercial_projects');
  const projectCount = Number(rows[0]?.projectCount || 0);

  if (projectCount > 0) {
    return;
  }

  for (const project of SAMPLE_COMMERCIAL_PROJECTS) {
    await pool.execute(
      `INSERT INTO commercial_projects
        (slug, name, location, category, land_area, units, image_url, summary, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        project.slug,
        project.name,
        project.location,
        project.category,
        project.landArea,
        project.units,
        project.imageUrl,
        project.summary,
        project.details,
      ]
    );
  }
}

async function initDb() {
  const pool = await getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS newsletter_subscribers (
      id INT PRIMARY KEY AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL UNIQUE,
      source VARCHAR(50) DEFAULT 'website',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS contact_inquiries (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NULL,
      phone VARCHAR(30) NOT NULL,
      interest VARCHAR(100) NULL,
      message TEXT NULL,
      source VARCHAR(50) DEFAULT 'website',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(120) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
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
    )
  `);

  await pool.query(`
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
    )
  `);

  await pool.query(`
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
    )
  `);

  await pool.query(`
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
    )
  `);

  await seedAdminUser(pool);
  await seedSampleBlogs(pool);
  await seedSampleCommercialProjects(pool);
}

module.exports = initDb;
