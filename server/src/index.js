require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');

const { getPool } = require('./db');
const initDb = require('./initDb');
const {
  verifyPassword,
  createSessionToken,
  hashToken,
  slugify,
} = require('./auth');

const app = express();
const PORT = Number(process.env.PORT || 5000);
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24;
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');
const GALLERY_UPLOADS_DIR = path.join(UPLOADS_DIR, 'galleries');
const COMMERCIAL_PROJECT_UPLOADS_DIR = path.join(UPLOADS_DIR, 'commercial-projects');
const BLOG_UPLOADS_DIR = path.join(UPLOADS_DIR, 'blogs');
const GALLERY_TYPES = new Set(['independent', 'commercial']);
const GALLERY_CATEGORIES = new Set(['ongoing', 'completed']); 
const IMAGE_MAX_DIMENSION = 1920;
const IMAGE_JPEG_QUALITY = 80;

fs.mkdirSync(GALLERY_UPLOADS_DIR, { recursive: true });
fs.mkdirSync(COMMERCIAL_PROJECT_UPLOADS_DIR, { recursive: true });
fs.mkdirSync(BLOG_UPLOADS_DIR, { recursive: true });

const galleryUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, GALLERY_UPLOADS_DIR);
    },
    filename: (_req, _file, cb) => {
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.jpg`);
    },
  }),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!String(file.mimetype || '').startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }

    return cb(null, true);
  },
});

const commercialProjectUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, COMMERCIAL_PROJECT_UPLOADS_DIR);
    },
    filename: (_req, _file, cb) => {
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.jpg`);
    },
  }),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!String(file.mimetype || '').startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }

    return cb(null, true);
  },
});

const blogUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, BLOG_UPLOADS_DIR);
    },
    filename: (_req, _file, cb) => {
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}.jpg`);
    },
  }),
  limits: {
    fileSize: 8 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!String(file.mimetype || '').startsWith('image/')) {
      return cb(new Error('Only image files are allowed.'));
    }

    return cb(null, true);
  },
});

function extractBearerToken(req) {
  const authHeader = req.headers.authorization || '';

  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice('Bearer '.length).trim();
  return token || null;
}

async function createUniqueSlug(pool, title, preferredSlug = '', excludeBlogId = null) {
  const baseSlug = slugify(preferredSlug || title) || `journal-${Date.now()}`;
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix}`;
    const params = [candidate];
    let query = 'SELECT id FROM blogs WHERE slug = ?';

    if (excludeBlogId) {
      query += ' AND id <> ?';
      params.push(excludeBlogId);
    }

    query += ' LIMIT 1';

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return candidate;
    }

    suffix += 1;
  }
}

async function createUniqueCommercialProjectSlug(pool, projectName, preferredSlug = '', excludeProjectId = null) {
  const baseSlug = slugify(preferredSlug || projectName) || `commercial-project-${Date.now()}`;
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix}`;
    const params = [candidate];
    let query = 'SELECT id FROM commercial_projects WHERE slug = ?';

    if (excludeProjectId) {
      query += ' AND id <> ?';
      params.push(excludeProjectId);
    }

    query += ' LIMIT 1';

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return candidate;
    }

    suffix += 1;
  }
}

function normalizeBlogPayload(body, uploadedFile = null) {
  const payload = body || {};
  const isPublishedValue = String(payload.isPublished || '').trim().toLowerCase();
  const isPublished = isPublishedValue === 'false' || payload.isPublished === false ? 0 : 1;
  const uploadedImageUrl = uploadedFile ? `/uploads/blogs/${uploadedFile.filename}` : '';

  return {
    title: String(payload.title || '').trim(),
    excerpt: String(payload.excerpt || '').trim(),
    content: String(payload.content || '').trim(),
    imageUrl: uploadedImageUrl || String(payload.imageUrl || '').trim(),
    category: String(payload.category || '').trim() || 'General',
    author: String(payload.author || '').trim() || 'Era Creatio Editorial',
    preferredSlug: String(payload.slug || '').trim(),
    isPublished,
    publishedAt: payload.publishedAt ? new Date(payload.publishedAt) : null,
  };
}

function mapBlogRow(row, req) {
  return {
    ...row,
    imageUrl: normalizeStoredImageUrl(req, row.imageUrl),
  };
}

function normalizeCommercialProjectCategory(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return GALLERY_CATEGORIES.has(normalized) ? normalized : '';
}

function normalizeCommercialProjectPayload(body) {
  const payload = body || {};

  return {
    name: String(payload.name || '').trim(),
    location: String(payload.location || '').trim(),
    category: normalizeCommercialProjectCategory(payload.category) || 'ongoing',
    landArea: String(payload.landArea || '').trim(),
    units: String(payload.units || '').trim(),
    summary: String(payload.summary || '').trim(),
    details: String(payload.details || '').trim(),
    preferredSlug: String(payload.slug || '').trim(),
  };
}

function normalizeGalleryType(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return GALLERY_TYPES.has(normalized) ? normalized : '';
}

function normalizeGalleryCategory(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return GALLERY_CATEGORIES.has(normalized) ? normalized : '';
}

function removeUploadedFiles(files) {
  for (const file of files || []) {
    if (!file || !file.path) {
      continue;
    }

    fs.promises.unlink(file.path).catch(() => {
      // Ignore cleanup failures to avoid masking the main error.
    });
  }
}

async function compressUploadedImage(file) {
  if (!file || !file.path) {
    return null;
  }

  const tempPath = `${file.path}.tmp`;

  try {
    await sharp(file.path)
      .rotate()
      .resize({
        width: IMAGE_MAX_DIMENSION,
        height: IMAGE_MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: IMAGE_JPEG_QUALITY, mozjpeg: true })
      .toFile(tempPath);

    await fs.promises.rename(tempPath, file.path);
    return file;
  } catch (error) {
    await fs.promises.unlink(tempPath).catch(() => {
      // Ignore cleanup failures from partial compression writes.
    });
    throw error;
  }
}

async function compressUploadedImages(files) {
  const normalized = Array.isArray(files) ? files.filter(Boolean) : [];

  if (!normalized.length) {
    return [];
  }

  await Promise.all(normalized.map((file) => compressUploadedImage(file)));
  return normalized;
}

function normalizeStoredImageUrl(req, value) {
  const imageUrl = String(value || '').trim();

  if (!imageUrl) {
    return '';
  }

  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  const publicOrigin = String(process.env.PUBLIC_SERVER_URL || '').trim();
  const origin = publicOrigin || `${req.protocol}://${req.get('host')}`;

  return `${origin}${imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`}`;
}

function mapGalleryRowsToCollections(rows, req) {
  const collections = {
    independent: {
      ongoing: [],
      completed: [],
    },
    commercial: {
      ongoing: [],
      completed: [],
    },
  };

  for (const row of rows) {
    const galleryType = normalizeGalleryType(row.galleryType);
    const category = normalizeGalleryCategory(row.category);

    if (!galleryType || !category) {
      continue;
    }

    const location = String(row.placeName || '').trim() || 'Unnamed Place';
    const imageUrls = [row.image1Url, row.image2Url, row.image3Url]
      .map((url) => normalizeStoredImageUrl(req, url))
      .filter(Boolean);

    if (imageUrls.length === 0) {
      continue;
    }

    collections[galleryType][category].push({
      id: `gallery-${row.id}`,
      src: imageUrls[0],
      location,
      category,
      galleryImages: imageUrls,
      imageCount: imageUrls.length,
    });
  }

  return collections;
}

function mapGalleryRowForAdmin(row, req) {
  const images = [row.image1Url, row.image2Url, row.image3Url]
    .map((url) => normalizeStoredImageUrl(req, url))
    .filter(Boolean);

  return {
    id: row.id,
    galleryType: row.galleryType,
    category: row.category,
    placeName: row.placeName,
    images,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapCommercialProjectRow(row, req) {
  const category = normalizeCommercialProjectCategory(row.category) || 'ongoing';

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    category,
    status: category === 'completed' ? 'Completed' : 'Ongoing',
    landArea: row.landArea,
    units: row.units,
    image: normalizeStoredImageUrl(req, row.imageUrl ),
    summary: row.summary || '',
    details: row.details || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapCommercialProjectRowsToCollections(rows, req) {
  const collections = {
    ongoing: [],
    completed: [],
  };

  for (const row of rows) {
    const project = mapCommercialProjectRow(row, req);

    collections[project.category].push(project);
  }

  return collections;
}

function parseUploadPathFromStoredUrl(value) {
  const imageUrl = String(value || '').trim();

  if (!imageUrl) {
    return '';
  }

  if (imageUrl.startsWith('/uploads/')) {
    return imageUrl;
  }

  try {
    const parsed = new URL(imageUrl);

    if (parsed.pathname.startsWith('/uploads/')) {
      return parsed.pathname;
    }
  } catch (_error) {
    return '';
  }

  return '';
}

function removeStoredImages(imageUrls) {
  for (const imageUrl of imageUrls || []) {
    const uploadPath = parseUploadPathFromStoredUrl(imageUrl);

    if (!uploadPath) {
      continue;
    }

    const absolutePath = path.join(__dirname, '..', uploadPath.replace(/^\//, ''));
    fs.promises.unlink(absolutePath).catch(() => {
      // Ignore cleanup failures for already-removed files.
    });
  }
}

async function requireAdmin(req, res, next) {
  const sessionToken = extractBearerToken(req);

  if (!sessionToken) {
    return res.status(401).json({ message: 'Unauthorized.' });
  }

  try {
    const pool = await getPool();
    const tokenHash = hashToken(sessionToken);
    const [rows] = await pool.execute(
      `SELECT
         s.id,
         s.admin_user_id AS adminUserId,
         u.username
       FROM admin_sessions s
       INNER JOIN admin_users u ON u.id = s.admin_user_id
       WHERE s.token_hash = ?
         AND s.expires_at > NOW()
       LIMIT 1`,
      [tokenHash]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Unauthorized.' });
    }

    await pool.execute('UPDATE admin_sessions SET last_used_at = NOW() WHERE id = ?', [rows[0].id]);

    req.admin = {
      id: rows[0].adminUserId,
      username: rows[0].username,
    };
    req.session = {
      id: rows[0].id,
      tokenHash,
    };

    return next();
  } catch (_error) {
    return res.status(500).json({ message: 'Could not authorize admin request.' });
  }
}

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  })
);
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

app.get('/api/health', async (_req, res) => {
  try {
    const pool = await getPool();
    await pool.query('SELECT 1');
    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ ok: false, message: 'Database connection failed.' });
  }
});

app.get('/api/galleries', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT
         id,
         gallery_type AS galleryType,
         category,
         place_name AS placeName,
         image_1_url AS image1Url,
         image_2_url AS image2Url,
         image_3_url AS image3Url
       FROM gallery_entries
       ORDER BY created_at DESC`
    );

    return res.json(mapGalleryRowsToCollections(rows, req));
  } catch (_error) {
    return res.status(500).json({ message: 'Could not load galleries right now.' });
  }
});

app.get('/api/commercial-projects', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT
         id,
         slug,
         name,
         location,
         category,
         land_area AS landArea,
         units,
         image_url AS imageUrl,
         summary,
         details,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM commercial_projects
       ORDER BY category ASC, updated_at DESC`
    );

    return res.json(mapCommercialProjectRowsToCollections(rows, req));
  } catch (_error) {
    return res.status(500).json({ message: 'Could not load commercial projects right now.' });
  }
});

app.get('/api/commercial-projects/:idOrSlug', async (req, res) => {
  const { idOrSlug } = req.params;
  const isNumericIdentifier = /^\d+$/.test(String(idOrSlug));

  try {
    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT
         id,
         slug,
         name,
         location,
         category,
         land_area AS landArea,
         units,
         image_url AS imageUrl,
         summary,
         details,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM commercial_projects
       WHERE ${isNumericIdentifier ? 'id = ?' : 'slug = ?'}
       LIMIT 1`,
      [isNumericIdentifier ? Number(idOrSlug) : String(idOrSlug)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Commercial project not found.' });
    }

    return res.json({ project: mapCommercialProjectRow(rows[0], req) });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not load this commercial project right now.' });
  }
});

app.get('/api/blogs', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT
         id,
         slug,
         title,
         excerpt,
         image_url AS imageUrl,
         category,
         author,
         published_at AS publishedAt
       FROM blogs
       WHERE is_published = 1
       ORDER BY published_at DESC`
    );

    return res.json({ blogs: rows.map((row) => mapBlogRow(row, req)) });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not load blogs right now.' });
  }
});

app.get('/api/blogs/:idOrSlug', async (req, res) => {
  const { idOrSlug } = req.params;
  const isNumericIdentifier = /^\d+$/.test(String(idOrSlug));

  try {
    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT
         id,
         slug,
         title,
         excerpt,
         content,
         image_url AS imageUrl,
         category,
         author,
         published_at AS publishedAt
       FROM blogs
       WHERE is_published = 1
         AND ${isNumericIdentifier ? 'id = ?' : 'slug = ?'}
       LIMIT 1`,
      [isNumericIdentifier ? Number(idOrSlug) : idOrSlug]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Blog not found.' });
    }

    return res.json({ blog: mapBlogRow(rows[0], req) });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not load this blog right now.' });
  }
});

app.post('/api/newsletter', async (req, res) => {
  const { email, source = 'website' } = req.body || {};

  if (!email || !String(email).trim()) {
    return res.status(400).json({ message: 'Email is required.' });
  }

  try {
    const pool = await getPool();
    await pool.execute(
      'INSERT INTO newsletter_subscribers (email, source) VALUES (?, ?)',
      [String(email).trim().toLowerCase(), source]
    );

    return res.status(201).json({ message: 'Subscribed successfully.' });
  } catch (error) {
    if (error && error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'This email is already subscribed.' });
    }
    return res.status(500).json({ message: 'Could not save newsletter subscription.' });
  }
});

app.post('/api/contacts', async (req, res) => {
  const {
    name,
    email = null,
    phone,
    interest = null,
    message = null,
    source = 'website',
  } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: 'Name is required.' });
  }

  if (!phone || !String(phone).trim()) {
    return res.status(400).json({ message: 'Phone is required.' });
  }

  try {
    const pool = await getPool();
    await pool.execute(
      `INSERT INTO contact_inquiries
        (name, email, phone, interest, message, source)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        String(name).trim(),
        email ? String(email).trim() : null,
        String(phone).trim(),
        interest ? String(interest).trim() : null,
        message ? String(message).trim() : null,
        source,
      ]
    );

    return res.status(201).json({ message: 'Inquiry submitted successfully.' });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not save contact inquiry.' });
  }
});

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT
         id,
         username,
         password_hash AS passwordHash
       FROM admin_users
       WHERE username = ?
       LIMIT 1`,
      [String(username).trim()]
    );

    if (rows.length === 0 || !verifyPassword(String(password), rows[0].passwordHash)) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = createSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await pool.execute('DELETE FROM admin_sessions WHERE admin_user_id = ? OR expires_at < NOW()', [rows[0].id]);
    await pool.execute(
      `INSERT INTO admin_sessions (admin_user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [rows[0].id, hashToken(token), expiresAt]
    );

    return res.json({
      token,
      expiresAt: expiresAt.toISOString(),
      admin: {
        id: rows[0].id,
        username: rows[0].username,
      },
    });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not complete admin login.' });
  }
});

app.post('/api/admin/logout', requireAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    await pool.execute('DELETE FROM admin_sessions WHERE id = ?', [req.session.id]);
    return res.json({ message: 'Logged out successfully.' });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not log out right now.' });
  }
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  return res.json({ admin: req.admin });
});

app.get('/api/admin/newsletter-subscriptions', requireAdmin, async (_req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT
         id,
         email,
         source,
         created_at AS createdAt
       FROM newsletter_subscribers
       ORDER BY created_at DESC`
    );

    return res.json({ subscriptions: rows });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not load newsletter subscriptions.' });
  }
});

app.get('/api/admin/contact-inquiries', requireAdmin, async (_req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT
         id,
         name,
         email,
         phone,
         interest,
         message,
         source,
         created_at AS createdAt
       FROM contact_inquiries
       ORDER BY created_at DESC`
    );

    return res.json({ contacts: rows });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not load contact inquiries.' });
  }
});

app.delete('/api/admin/contact-inquiries/:contactId', requireAdmin, async (req, res) => {
  const contactId = Number(req.params.contactId);

  if (!Number.isInteger(contactId) || contactId <= 0) {
    return res.status(400).json({ message: 'Invalid contact inquiry id.' });
  }

  try {
    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT
         id
       FROM contact_inquiries
       WHERE id = ?
       LIMIT 1`,
      [contactId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Contact inquiry not found.' });
    }

    await pool.execute('DELETE FROM contact_inquiries WHERE id = ?', [contactId]);
    return res.json({ message: 'Contact inquiry deleted successfully.' });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not delete contact inquiry.' });
  }
});

app.get('/api/admin/gallery-entries', requireAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT
         id,
         gallery_type AS galleryType,
         category,
         place_name AS placeName,
         image_1_url AS image1Url,
         image_2_url AS image2Url,
         image_3_url AS image3Url,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM gallery_entries
       ORDER BY created_at DESC`
    );

    return res.json({ entries: rows.map((row) => mapGalleryRowForAdmin(row, req)) });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not load gallery entries.' });
  }
});

app.post('/api/admin/gallery-entries', requireAdmin, galleryUpload.array('images', 3), async (req, res) => {
  const files = Array.isArray(req.files) ? req.files : [];
  const galleryType = normalizeGalleryType(req.body?.galleryType);
  const category = normalizeGalleryCategory(req.body?.category);
  const placeName = String(req.body?.placeName || '').trim();

  if (!galleryType || !category || !placeName) {
    removeUploadedFiles(files);
    return res.status(400).json({ message: 'Gallery type, category, and place name are required.' });
  }

  if (files.length < 1 || files.length > 3) {
    removeUploadedFiles(files);
    return res.status(400).json({ message: 'Please upload at least 1 and at most 3 images for each place.' });
  }

  try {
    await compressUploadedImages(files);
  } catch (_error) {
    removeUploadedFiles(files);
    return res.status(500).json({ message: 'Could not process gallery images.' });
  }

  const imageUrls = files.map((file) => `/uploads/galleries/${file.filename}`);
  const paddedImageUrls = [...imageUrls, '', ''].slice(0, 3);

  try {
    const pool = await getPool();
    const [result] = await pool.execute(
      `INSERT INTO gallery_entries
        (gallery_type, category, place_name, image_1_url, image_2_url, image_3_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [galleryType, category, placeName, paddedImageUrls[0], paddedImageUrls[1], paddedImageUrls[2]]
    );

    const [rows] = await pool.execute(
      `SELECT
         id,
         gallery_type AS galleryType,
         category,
         place_name AS placeName,
         image_1_url AS image1Url,
         image_2_url AS image2Url,
         image_3_url AS image3Url,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM gallery_entries
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      message: 'Gallery entry created successfully.',
      entry: mapGalleryRowForAdmin(rows[0], req),
    });
  } catch (_error) {
    removeUploadedFiles(files);
    return res.status(500).json({ message: 'Could not save gallery entry.' });
  }
});

app.put('/api/admin/gallery-entries/:entryId', requireAdmin, galleryUpload.array('images', 3), async (req, res) => {
  const entryId = Number(req.params.entryId);
  const files = Array.isArray(req.files) ? req.files : [];
  const galleryType = normalizeGalleryType(req.body?.galleryType);
  const category = normalizeGalleryCategory(req.body?.category);
  const placeName = String(req.body?.placeName || '').trim();

  if (!Number.isInteger(entryId) || entryId <= 0) {
    removeUploadedFiles(files);
    return res.status(400).json({ message: 'Invalid gallery entry id.' });
  }

  if (!galleryType || !category || !placeName) {
    removeUploadedFiles(files);
    return res.status(400).json({ message: 'Gallery type, category, and place name are required.' });
  }

  if (files.length > 3) {
    removeUploadedFiles(files);
    return res.status(400).json({ message: 'Please upload at most 3 image files.' });
  }

  try {
    await compressUploadedImages(files);
  } catch (_error) {
    removeUploadedFiles(files);
    return res.status(500).json({ message: 'Could not process gallery images.' });
  }

  try {
    const pool = await getPool();
    const [existingRows] = await pool.execute(
      `SELECT
         id,
         image_1_url AS image1Url,
         image_2_url AS image2Url,
         image_3_url AS image3Url
       FROM gallery_entries
       WHERE id = ?
       LIMIT 1`,
      [entryId]
    );

    if (existingRows.length === 0) {
      removeUploadedFiles(files);
      return res.status(404).json({ message: 'Gallery entry not found.' });
    }

    let nextImageUrls = [existingRows[0].image1Url, existingRows[0].image2Url, existingRows[0].image3Url];
    let shouldDeleteExistingImages = false;

    if (files.length > 0) {
      const uploadedImageUrls = files.map((file) => `/uploads/galleries/${file.filename}`);
      nextImageUrls = [...uploadedImageUrls, '', ''].slice(0, 3);
      shouldDeleteExistingImages = true;
    }

    await pool.execute(
      `UPDATE gallery_entries
       SET
         gallery_type = ?,
         category = ?,
         place_name = ?,
         image_1_url = ?,
         image_2_url = ?,
         image_3_url = ?
       WHERE id = ?`,
      [galleryType, category, placeName, nextImageUrls[0], nextImageUrls[1], nextImageUrls[2], entryId]
    );

    if (shouldDeleteExistingImages) {
      removeStoredImages([existingRows[0].image1Url, existingRows[0].image2Url, existingRows[0].image3Url]);
    }

    const [rows] = await pool.execute(
      `SELECT
         id,
         gallery_type AS galleryType,
         category,
         place_name AS placeName,
         image_1_url AS image1Url,
         image_2_url AS image2Url,
         image_3_url AS image3Url,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM gallery_entries
       WHERE id = ?
       LIMIT 1`,
      [entryId]
    );

    return res.json({
      message: 'Gallery entry updated successfully.',
      entry: mapGalleryRowForAdmin(rows[0], req),
    });
  } catch (_error) {
    removeUploadedFiles(files);
    return res.status(500).json({ message: 'Could not update gallery entry.' });
  }
});

app.delete('/api/admin/gallery-entries/:entryId', requireAdmin, async (req, res) => {
  const entryId = Number(req.params.entryId);

  if (!Number.isInteger(entryId) || entryId <= 0) {
    return res.status(400).json({ message: 'Invalid gallery entry id.' });
  }

  try {
    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT
         id,
         image_1_url AS image1Url,
         image_2_url AS image2Url,
         image_3_url AS image3Url
       FROM gallery_entries
       WHERE id = ?
       LIMIT 1`,
      [entryId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Gallery entry not found.' });
    }

    await pool.execute('DELETE FROM gallery_entries WHERE id = ?', [entryId]);
    removeStoredImages([rows[0].image1Url, rows[0].image2Url, rows[0].image3Url]);

    return res.json({ message: 'Gallery entry deleted successfully.' });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not delete gallery entry.' });
  }
});

app.get('/api/admin/commercial-projects', requireAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT
         id,
         slug,
         name,
         location,
         category,
         land_area AS landArea,
         units,
         image_url AS imageUrl,
         summary,
         details,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM commercial_projects
       ORDER BY updated_at DESC`
    );

    return res.json({ projects: rows.map((row) => mapCommercialProjectRow(row, req)) });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not load commercial projects.' });
  }
});

app.post('/api/admin/commercial-projects', requireAdmin, commercialProjectUpload.single('image'), async (req, res) => {
  const uploadedFile = req.file || null;
  const {
    name,
    location,
    category,
    landArea,
    units,
    summary,
    details,
    preferredSlug,
  } = normalizeCommercialProjectPayload(req.body);

  if (!name || !location || !landArea || !units) {
    removeUploadedFiles([uploadedFile]);
    return res.status(400).json({ message: 'Name, location, land area, and units are required.' });
  }

  if (!uploadedFile) {
    return res.status(400).json({ message: 'Please upload a cover image.' });
  }

  try {
    await compressUploadedImage(uploadedFile);
  } catch (_error) {
    removeUploadedFiles([uploadedFile]);
    return res.status(500).json({ message: 'Could not process commercial project image.' });
  }

  const imageUrl = `/uploads/commercial-projects/${uploadedFile.filename}`;

  try {
    const pool = await getPool();
    const slug = await createUniqueCommercialProjectSlug(pool, name, preferredSlug);

    const [result] = await pool.execute(
      `INSERT INTO commercial_projects
        (slug, name, location, category, land_area, units, image_url, summary, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [slug, name, location, category, landArea, units, imageUrl, summary || null, details || null]
    );

    const [rows] = await pool.execute(
      `SELECT
         id,
         slug,
         name,
         location,
         category,
         land_area AS landArea,
         units,
         image_url AS imageUrl,
         summary,
         details,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM commercial_projects
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({
      message: 'Commercial project created successfully.',
      project: mapCommercialProjectRow(rows[0], req),
    });
  } catch (_error) {
    removeUploadedFiles([uploadedFile]);
    return res.status(500).json({ message: 'Could not create commercial project.' });
  }
});

app.put('/api/admin/commercial-projects/:projectId', requireAdmin, commercialProjectUpload.single('image'), async (req, res) => {
  const projectId = Number(req.params.projectId);
  const uploadedFile = req.file || null;

  if (!Number.isInteger(projectId) || projectId <= 0) {
    removeUploadedFiles([uploadedFile]);
    return res.status(400).json({ message: 'Invalid commercial project id.' });
  }

  const {
    name,
    location,
    category,
    landArea,
    units,
    summary,
    details,
    preferredSlug,
  } = normalizeCommercialProjectPayload(req.body);

  if (!name || !location || !landArea || !units) {
    removeUploadedFiles([uploadedFile]);
    return res.status(400).json({ message: 'Name, location, land area, and units are required.' });
  }

  if (uploadedFile) {
    try {
      await compressUploadedImage(uploadedFile);
    } catch (_error) {
      removeUploadedFiles([uploadedFile]);
      return res.status(500).json({ message: 'Could not process commercial project image.' });
    }
  }

  try {
    const pool = await getPool();
    const [existingRows] = await pool.execute(
      `SELECT
         id,
         image_url AS imageUrl
       FROM commercial_projects
       WHERE id = ?
       LIMIT 1`,
      [projectId]
    );

    if (existingRows.length === 0) {
      removeUploadedFiles([uploadedFile]);
      return res.status(404).json({ message: 'Commercial project not found.' });
    }

    const nextImageUrl = uploadedFile
      ? `/uploads/commercial-projects/${uploadedFile.filename}`
      : existingRows[0].imageUrl;

    const slug = await createUniqueCommercialProjectSlug(pool, name, preferredSlug, projectId);

    await pool.execute(
      `UPDATE commercial_projects
       SET
         slug = ?,
         name = ?,
         location = ?,
         category = ?,
         land_area = ?,
         units = ?,
         image_url = ?,
         summary = ?,
         details = ?
       WHERE id = ?`,
      [slug, name, location, category, landArea, units, nextImageUrl, summary || null, details || null, projectId]
    );

    if (uploadedFile) {
      removeStoredImages([existingRows[0].imageUrl]);
    }

    const [rows] = await pool.execute(
      `SELECT
         id,
         slug,
         name,
         location,
         category,
         land_area AS landArea,
         units,
         image_url AS imageUrl,
         summary,
         details,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM commercial_projects
       WHERE id = ?
       LIMIT 1`,
      [projectId]
    );

    return res.json({
      message: 'Commercial project updated successfully.',
      project: mapCommercialProjectRow(rows[0], req),
    });
  } catch (_error) {
    removeUploadedFiles([uploadedFile]);
    return res.status(500).json({ message: 'Could not update commercial project.' });
  }
});

app.delete('/api/admin/commercial-projects/:projectId', requireAdmin, async (req, res) => {
  const projectId = Number(req.params.projectId);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    return res.status(400).json({ message: 'Invalid commercial project id.' });
  }

  try {
    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT
         id,
         image_url AS imageUrl
       FROM commercial_projects
       WHERE id = ?
       LIMIT 1`,
      [projectId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Commercial project not found.' });
    }

    await pool.execute('DELETE FROM commercial_projects WHERE id = ?', [projectId]);
    removeStoredImages([rows[0].imageUrl]);
    return res.json({ message: 'Commercial project deleted successfully.' });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not delete commercial project.' });
  }
});

app.get('/api/admin/blogs', requireAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT
         id,
         slug,
         title,
         excerpt,
         content,
         image_url AS imageUrl,
         category,
         author,
         is_published AS isPublished,
         published_at AS publishedAt,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM blogs
       ORDER BY updated_at DESC`
    );

    return res.json({ blogs: rows.map((row) => mapBlogRow(row, req)) });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not load blogs for admin.' });
  }
});

app.post('/api/admin/blogs', requireAdmin, blogUpload.single('image'), async (req, res) => {
  const uploadedFile = req.file || null;
  const {
    title,
    excerpt,
    content,
    imageUrl,
    category,
    author,
    preferredSlug,
    isPublished,
    publishedAt,
  } = normalizeBlogPayload(req.body, uploadedFile);

  if (!uploadedFile) {
    return res.status(400).json({ message: 'Please upload a cover image.' });
  }

  if (!title || !excerpt || !content || !category) {
    removeUploadedFiles([uploadedFile]);
    return res.status(400).json({ message: 'Title, excerpt, content, and category are required.' });
  }

  if (publishedAt && Number.isNaN(publishedAt.getTime())) {
    removeUploadedFiles([uploadedFile]);
    return res.status(400).json({ message: 'Published date is invalid.' });
  }

  try {
    await compressUploadedImage(uploadedFile);
  } catch (_error) {
    removeUploadedFiles([uploadedFile]);
    return res.status(500).json({ message: 'Could not process blog image.' });
  }

  try {
    const pool = await getPool();
    const slug = await createUniqueSlug(pool, title, preferredSlug);

    const [result] = await pool.execute(
      `INSERT INTO blogs
        (slug, title, excerpt, content, image_url, category, author, is_published, published_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        title,
        excerpt,
        content,
        imageUrl,
        category,
        author,
        isPublished,
        publishedAt || new Date(),
      ]
    );

    const [rows] = await pool.execute(
      `SELECT
         id,
         slug,
         title,
         excerpt,
         content,
         image_url AS imageUrl,
         category,
         author,
         is_published AS isPublished,
         published_at AS publishedAt,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM blogs
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    );

    return res.status(201).json({ message: 'Blog published successfully.', blog: mapBlogRow(rows[0], req) });
  } catch (_error) {
    removeUploadedFiles([uploadedFile]);
    return res.status(500).json({ message: 'Could not save this blog.' });
  }
});

app.put('/api/admin/blogs/:blogId', requireAdmin, blogUpload.single('image'), async (req, res) => {
  const blogId = Number(req.params.blogId);
  const uploadedFile = req.file || null;

  if (!Number.isInteger(blogId) || blogId <= 0) {
    removeUploadedFiles([uploadedFile]);
    return res.status(400).json({ message: 'Invalid blog id.' });
  }

  const {
    title,
    excerpt,
    content,
    imageUrl,
    category,
    author,
    preferredSlug,
    isPublished,
    publishedAt,
  } = normalizeBlogPayload(req.body, uploadedFile);

  if (!title || !excerpt || !content || !category) {
    removeUploadedFiles([uploadedFile]);
    return res.status(400).json({ message: 'Title, excerpt, content, and category are required.' });
  }

  if (publishedAt && Number.isNaN(publishedAt.getTime())) {
    removeUploadedFiles([uploadedFile]);
    return res.status(400).json({ message: 'Published date is invalid.' });
  }

  if (uploadedFile) {
    try {
      await compressUploadedImage(uploadedFile);
    } catch (_error) {
      removeUploadedFiles([uploadedFile]);
      return res.status(500).json({ message: 'Could not process blog image.' });
    }
  }

  try {
    const pool = await getPool();
    const [existingRows] = await pool.execute(
      `SELECT
         id,
         image_url AS imageUrl,
         published_at AS publishedAt
       FROM blogs
       WHERE id = ?
       LIMIT 1`,
      [blogId]
    );

    if (existingRows.length === 0) {
      removeUploadedFiles([uploadedFile]);
      return res.status(404).json({ message: 'Blog not found.' });
    }

    const nextImageUrl = uploadedFile ? `/uploads/blogs/${uploadedFile.filename}` : existingRows[0].imageUrl;

    const slug = await createUniqueSlug(pool, title, preferredSlug, blogId);

    await pool.execute(
      `UPDATE blogs
       SET
         slug = ?,
         title = ?,
         excerpt = ?,
         content = ?,
         image_url = ?,
         category = ?,
         author = ?,
         is_published = ?,
         published_at = ?
       WHERE id = ?`,
      [
        slug,
        title,
        excerpt,
        content,
        nextImageUrl,
        category,
        author,
        isPublished,
        publishedAt || existingRows[0].publishedAt,
        blogId,
      ]
    );

    if (uploadedFile) {
      removeStoredImages([existingRows[0].imageUrl]);
    }

    const [rows] = await pool.execute(
      `SELECT
         id,
         slug,
         title,
         excerpt,
         content,
         image_url AS imageUrl,
         category,
         author,
         is_published AS isPublished,
         published_at AS publishedAt,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM blogs
       WHERE id = ?
       LIMIT 1`,
      [blogId]
    );

    return res.json({ message: 'Blog updated successfully.', blog: mapBlogRow(rows[0], req) });
  } catch (_error) {
    removeUploadedFiles([uploadedFile]);
    return res.status(500).json({ message: 'Could not update this blog.' });
  }
});

app.delete('/api/admin/blogs/:blogId', requireAdmin, async (req, res) => {
  const blogId = Number(req.params.blogId);

  if (!Number.isInteger(blogId) || blogId <= 0) {
    return res.status(400).json({ message: 'Invalid blog id.' });
  }

  try {
    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT
         id,
         image_url AS imageUrl
       FROM blogs
       WHERE id = ?
       LIMIT 1`,
      [blogId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Blog not found.' });
    }

    await pool.execute('DELETE FROM blogs WHERE id = ?', [blogId]);
    removeStoredImages([rows[0].imageUrl]);
    return res.json({ message: 'Blog deleted successfully.' });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not delete this blog.' });
  }
});

app.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'Each image must be 8MB or smaller.' });
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE' && error.field === 'image') {
      return res.status(400).json({ message: 'Please upload one image file.' });
    }

    return res.status(400).json({ message: 'Please upload at most 3 image files.' });
  }

  if (error && error.message === 'Only image files are allowed.') {
    return res.status(400).json({ message: error.message });
  }

  return next(error);
});

app.use((error, _req, res, _next) => {
  console.error('Unhandled server error:', error);
  return res.status(500).json({ message: 'Internal server error.' });
});

async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    process.exit(1);
  }
}

startServer();
