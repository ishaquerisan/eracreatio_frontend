require('dotenv').config();

const crypto = require('crypto');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
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
const MEDIA_URL_PREFIX = '/api/media/';
const UPLOADS_URL_PREFIX = '/uploads/';
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');
const GALLERY_TYPES = new Set(['independent', 'commercial']);
const GALLERY_CATEGORIES = new Set(['ongoing', 'completed']); 
const VILLA_STATUSES = new Set(['draft', 'ongoing', 'upcoming', 'completed']);
const IMAGE_MAX_DIMENSION = 1920;
const IMAGE_JPEG_QUALITY = 80;

fs.mkdirSync(UPLOADS_ROOT, { recursive: true });

const galleryUpload = multer({
  storage: multer.memoryStorage(),
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
  storage: multer.memoryStorage(),
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

const villaUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 120 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const mimeType = String(file.mimetype || '').toLowerCase();

    if (mimeType.startsWith('image/') || mimeType === 'application/pdf' || mimeType.startsWith('video/')) {
      return cb(null, true);
    }

    return cb(new Error('Only image, PDF, and video files are allowed.'));
  },
});

const blogUpload = multer({
  storage: multer.memoryStorage(),
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

async function createUniqueVillaSlug(pool, villaName, preferredSlug = '', excludeVillaId = null) {
  const baseSlug = slugify(preferredSlug || villaName) || `villa-${Date.now()}`;
  let suffix = 0;

  while (true) {
    const candidate = suffix === 0 ? baseSlug : `${baseSlug}-${suffix}`;
    const params = [candidate];
    let query = 'SELECT id FROM villas WHERE slug = ?';

    if (excludeVillaId) {
      query += ' AND id <> ?';
      params.push(excludeVillaId);
    }

    query += ' LIMIT 1';

    const [rows] = await pool.execute(query, params);

    if (rows.length === 0) {
      return candidate;
    }

    suffix += 1;
  }
}

function parseJsonValue(value, fallback) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  if (Array.isArray(value) || typeof value === 'object') {
    return value;
  }

  try {
    return JSON.parse(String(value));
  } catch (_error) {
    return fallback;
  }
}

function normalizeTextOrFallback(value, fallback = '') {
  const normalized = String(value || '').trim();
  return normalized ? normalized : fallback;
}

function normalizeVillaStatus(value, fallback = 'draft') {
  const normalized = String(value || '').trim().toLowerCase();
  return VILLA_STATUSES.has(normalized) ? normalized : fallback;
}

function normalizeAmenityItems(value) {
  const rawItems = parseJsonValue(value, []);

  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item) => {
      if (typeof item === 'string') {
        const title = item.trim();
        return title ? { title, desc: '', icon: '' } : null;
      }

      if (!item || typeof item !== 'object') {
        return null;
      }

      const title = String(item.title || '').trim();
      const desc = String(item.desc || '').trim();
      const icon = String(item.icon || '').trim();

      if (!title && !desc) {
        return null;
      }

      return { title, desc, icon };
    })
    .filter(Boolean);
}

function normalizeStringArray(value) {
  const rawItems = parseJsonValue(value, []);

  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems.map((item) => String(item || '').trim()).filter(Boolean);
}

function normalizeStoredReferenceUrl(value) {
  const rawValue = String(value || '').trim();

  if (!rawValue) {
    return '';
  }

  if (rawValue.startsWith('/api/media/') || rawValue.startsWith('/uploads/')) {
    return rawValue;
  }

  try {
    const parsed = new URL(rawValue);

    if (parsed.pathname.startsWith('/api/media/') || parsed.pathname.startsWith('/uploads/')) {
      return parsed.pathname;
    }
  } catch (_error) {
    return rawValue;
  }

  return rawValue;
}

function getMediaUrl(mediaId) {
  return `${MEDIA_URL_PREFIX}${mediaId}`;
}

function getUploadUrl(uploadPath) {
  const normalizedPath = String(uploadPath || '').replace(/\\/g, '/').replace(/^\/+/, '');
  return `${UPLOADS_URL_PREFIX}${normalizedPath}`;
}

function getMediaIdFromStoredUrl(value) {
  const storedUrl = normalizeStoredReferenceUrl(value);

  if (!storedUrl.startsWith('/api/media/')) {
    return null;
  }

  const mediaId = Number(storedUrl.slice('/api/media/'.length));
  return Number.isInteger(mediaId) && mediaId > 0 ? mediaId : null;
}

async function compressImageBuffer(fileBuffer) {
  return sharp(fileBuffer)
    .rotate()
    .resize({
      width: IMAGE_MAX_DIMENSION,
      height: IMAGE_MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: IMAGE_JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
}

function getSafeFileExtension(fileName, fallback = '') {
  const extension = path.extname(String(fileName || '')).toLowerCase();
  return /^[a-z0-9.]{1,12}$/.test(extension) ? extension : fallback;
}

function getExtensionFromMimeType(mimeType) {
  const normalizedMimeType = String(mimeType || '').toLowerCase();

  switch (normalizedMimeType) {
    case 'application/pdf':
      return '.pdf';
    case 'video/mp4':
      return '.mp4';
    case 'video/quicktime':
      return '.mov';
    case 'video/webm':
      return '.webm';
    case 'video/x-msvideo':
      return '.avi';
    case 'video/x-matroska':
      return '.mkv';
    default:
      return '';
  }
}

function normalizeUploadScope(scope) {
  const normalizedScope = String(scope || '').trim().toLowerCase();

  if (!normalizedScope) {
    return 'misc';
  }

  const allowedScopes = new Set(['blogs', 'commercial-projects', 'galleries', 'villas', 'misc']);
  return allowedScopes.has(normalizedScope) ? normalizedScope : 'misc';
}

function getUploadAbsolutePathFromStoredUrl(value) {
  const normalizedStoredUrl = normalizeStoredReferenceUrl(value);

  if (!normalizedStoredUrl.startsWith(UPLOADS_URL_PREFIX)) {
    return '';
  }

  const relativeUploadPath = normalizedStoredUrl.slice(UPLOADS_URL_PREFIX.length).replace(/\\/g, '/').replace(/^\/+/, '');
  if (!relativeUploadPath) {
    return '';
  }

  const resolvedRoot = path.resolve(UPLOADS_ROOT);
  const absolutePath = path.resolve(resolvedRoot, relativeUploadPath);

  if (!absolutePath.startsWith(resolvedRoot)) {
    return '';
  }

  return absolutePath;
}

async function storeUploadedMediaFile(_pool, file, uploadScope = 'misc') {
  if (!file || !file.buffer) {
    return '';
  }

  const mimeType = String(file.mimetype || '').toLowerCase();
  let data = Buffer.from(file.buffer);
  let extension = getSafeFileExtension(file.originalname, getExtensionFromMimeType(mimeType));

  if (mimeType.startsWith('image/')) {
    data = await compressImageBuffer(file.buffer);
    extension = '.jpg';
  }

  const now = new Date();
  const year = String(now.getFullYear());
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const folder = normalizeUploadScope(uploadScope);
  const relativeDirectory = path.join(folder, year, month);
  const absoluteDirectory = path.join(UPLOADS_ROOT, relativeDirectory);
  const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${extension || ''}`;
  const relativeUploadPath = path.join(relativeDirectory, uniqueName);
  const absoluteFilePath = path.join(UPLOADS_ROOT, relativeUploadPath);

  await fs.promises.mkdir(absoluteDirectory, { recursive: true });
  await fs.promises.writeFile(absoluteFilePath, data);

  return getUploadUrl(relativeUploadPath);
}

async function storeUploadedMediaFiles(pool, files, uploadScope = 'misc') {
  const storedUrls = [];

  for (const file of files || []) {
    if (!file) {
      continue;
    }

    storedUrls.push(await storeUploadedMediaFile(pool, file, uploadScope));
  }

  return storedUrls.filter(Boolean);
}

async function storeVillaUploadedMedia(pool, uploadedFiles = {}) {
  const fileUrls = {
    bannerImageUrl: '',
    projectLogoUrl: '',
    brochurePdfUrl: '',
    walkthroughVideoUrl: '',
    availabilityChartPdfUrl: '',
    locationScanImageUrl: '',
    reraScanImageUrl: '',
    exteriorImages: [],
    interiorImages: [],
  };
  const cleanupUrls = [];

  const storeSingle = async (file) => {
    const url = await storeUploadedMediaFile(pool, file, 'villas');

    if (url) {
      cleanupUrls.push(url);
    }

    return url;
  };

  const storeMultiple = async (files) => {
    const urls = [];

    for (const file of files || []) {
      if (!file) {
        continue;
      }

      urls.push(await storeSingle(file));
    }

    return urls.filter(Boolean);
  };

  fileUrls.bannerImageUrl = await storeSingle((uploadedFiles.bannerImage || [])[0]);
  fileUrls.projectLogoUrl = await storeSingle((uploadedFiles.projectLogo || [])[0]);
  fileUrls.brochurePdfUrl = await storeSingle((uploadedFiles.brochurePdf || [])[0]);
  fileUrls.walkthroughVideoUrl = await storeSingle((uploadedFiles.walkthroughVideo || [])[0]);
  fileUrls.availabilityChartPdfUrl = await storeSingle((uploadedFiles.availabilityChartPdf || [])[0]);
  fileUrls.locationScanImageUrl = await storeSingle((uploadedFiles.locationScanImage || [])[0]);
  fileUrls.reraScanImageUrl = await storeSingle((uploadedFiles.reraScanImage || [])[0]);
  fileUrls.exteriorImages = await storeMultiple(uploadedFiles.exteriorImages || []);
  fileUrls.interiorImages = await storeMultiple(uploadedFiles.interiorImages || []);

  return { fileUrls, cleanupUrls };
}

function normalizeVillaPayload(body) {
  const payload = body || {};

  return {
    name: String(payload.name || '').trim(),
    location: String(payload.location || '').trim(),
    acres: String(payload.acres || '').trim(),
    totalVillas: String(payload.totalVillas || '').trim(),
    status: normalizeVillaStatus(payload.status),
    description: String(payload.description || '').trim(),
    overviewTitle: String(payload.overviewTitle || '').trim(),
    overviewDescription: String(payload.overviewDescription || '').trim(),
    overviewTotalLand: String(payload.overviewTotalLand || '').trim(),
    overviewTotalUnits: String(payload.overviewTotalUnits || '').trim(),
    configuration: String(payload.configuration || '').trim(),
    startingPrice: String(payload.startingPrice || '').trim(),
    slug: String(payload.slug || '').trim(),
    reraNumber: String(payload.reraNumber || '').trim(),
    mapLocationUrl: String(payload.mapLocationUrl || '').trim(),
    otherCharges: String(payload.otherCharges || '').trim(),
    projectDetails: parseJsonValue(payload.projectDetails, {}),
    projectHighlights: normalizeStringArray(payload.projectHighlights),
    locationAdvantages: normalizeStringArray(payload.locationAdvantages),
    amenities: normalizeAmenityItems(payload.amenities),
    existingExteriorImages: parseJsonValue(payload.existingExteriorImages, undefined),
    existingInteriorImages: parseJsonValue(payload.existingInteriorImages, undefined),
  };
}

function mapVillaRow(row, req) {
  const projectDetails = parseJsonValue(row.projectDetails, {}) || {};
  const exteriorImages = normalizeStringArray(row.exteriorImages).map((value) => normalizeStoredImageUrl(req, value));
  const interiorImages = normalizeStringArray(row.interiorImages).map((value) => normalizeStoredImageUrl(req, value));
  const highlights = normalizeStringArray(row.projectHighlights);
  const amenities = normalizeAmenityItems(row.amenities);
  const locationAdvantages = normalizeStringArray(row.locationAdvantages);

  const bannerImage = normalizeStoredImageUrl(req, row.bannerImageUrl);
  const projectLogo = normalizeStoredImageUrl(req, row.projectLogoUrl);
  const brochurePdfUrl = normalizeStoredImageUrl(req, row.brochurePdfUrl);
  const walkthroughVideoUrl = normalizeStoredImageUrl(req, row.walkthroughVideoUrl);
  const availabilityChartPdfUrl = normalizeStoredImageUrl(req, row.availabilityChartPdfUrl);
  const mapLocationUrl = normalizeTextOrFallback(row.mapLocationUrl, projectDetails.mapLocationUrl || '');
  const locationScanImageUrl = normalizeStoredImageUrl(req, projectDetails.locationScanImageUrl || '');
  const reraScanImageUrl = normalizeStoredImageUrl(req, projectDetails.reraScanImageUrl || '');

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    location: row.location,
    acres: row.acres || '',
    totalVillas: row.totalVillas || '',
    status: normalizeVillaStatus(row.status),
    bannerImage,
    image: bannerImage,
    projectLogo,
    logo: projectLogo,
    brochurePdfUrl,
    description: row.description || '',
    overviewTitle: row.overviewTitle || '',
    overviewDescription: row.overviewDescription || '',
    overviewTotalLand: row.overviewTotalLand || '',
    overviewTotalUnits: row.overviewTotalUnits || '',
    configuration: row.configuration || '',
    startingPrice: row.startingPrice || '',
    price: row.startingPrice || projectDetails.price || '',
    walkthroughVideoUrl,
    availabilityChartPdfUrl,
    mapLocationUrl,
    locationScanImageUrl,
    reraScanImageUrl,
    otherCharges: row.otherCharges || '',
    reraNumber: row.reraNumber || projectDetails.reraNumber || '',
    projectDetails: {
      ...projectDetails,
      projectName: projectDetails.projectName || row.name || '',
      location: projectDetails.location || row.location || '',
      totalLandArea: projectDetails.totalLandArea || row.acres || '',
      totalUnits: projectDetails.totalUnits || row.totalVillas || '',
      configuration: projectDetails.configuration || row.configuration || '',
      price: projectDetails.price || row.startingPrice || '',
      status: normalizeVillaStatus(projectDetails.status || row.status),
      reraNumber: projectDetails.reraNumber || row.reraNumber || '',
      locationScanImageUrl,
      reraScanImageUrl,
    },
    images: {
      exterior: exteriorImages.length > 0 ? exteriorImages : bannerImage ? [bannerImage] : [],
      interior: interiorImages,
    },
    highlights,
    amenities,
    locationAdvantages,
    otherCharges: row.otherCharges || '',
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function mapVillaRowForAdmin(row, req) {
  return mapVillaRow(row, req);
}

function normalizeBlogPayload(body) {
  const payload = body || {};
  const isPublishedValue = String(payload.isPublished || '').trim().toLowerCase();
  const isPublished = isPublishedValue === 'false' || payload.isPublished === false ? 0 : 1;

  return {
    title: String(payload.title || '').trim(),
    excerpt: String(payload.excerpt || '').trim(),
    content: String(payload.content || '').trim(),
    imageUrl: String(payload.imageUrl || '').trim(),
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

function removeStoredImages(imageUrls) {
  const cleanupTasks = [];

  for (const imageUrl of imageUrls || []) {
    const mediaId = getMediaIdFromStoredUrl(imageUrl);

    if (mediaId) {
      cleanupTasks.push(
        getPool().then((pool) => pool.execute('DELETE FROM media_assets WHERE id = ?', [mediaId])).catch(() => null)
      );
      continue;
    }

    const uploadAbsolutePath = getUploadAbsolutePathFromStoredUrl(imageUrl);

    if (!uploadAbsolutePath) {
      continue;
    }

    cleanupTasks.push(fs.promises.unlink(uploadAbsolutePath).catch(() => null));
  }

  if (cleanupTasks.length > 0) {
    Promise.all(cleanupTasks).catch(() => null);
  }
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
app.use('/uploads', express.static(UPLOADS_ROOT));
app.use(express.json());

app.get('/api/media/:mediaId', async (req, res) => {
  const mediaId = Number(req.params.mediaId);

  if (!Number.isInteger(mediaId) || mediaId <= 0) {
    return res.status(400).json({ message: 'Invalid media id.' });
  }

  try {
    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT
         id,
         file_name AS fileName,
         mime_type AS mimeType,
         file_size AS fileSize,
         data
       FROM media_assets
       WHERE id = ?
       LIMIT 1`,
      [mediaId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Media asset not found.' });
    }

    const media = rows[0];
    res.setHeader('Content-Type', media.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', String(media.fileSize || media.data?.length || 0));
    res.setHeader('Content-Disposition', `inline; filename="${String(media.fileName || 'asset').replace(/"/g, '')}"`);
    return res.send(media.data);
  } catch (_error) {
    return res.status(500).json({ message: 'Could not load media asset.' });
  }
});

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

app.get('/api/villas', async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT
         id,
         slug,
         name,
         location,
         acres,
         total_villas AS totalVillas,
         banner_image_url AS bannerImageUrl,
         project_logo_url AS projectLogoUrl,
         status,
         overview_title AS overviewTitle,
         overview_description AS overviewDescription,
         overview_total_land AS overviewTotalLand,
         overview_total_units AS overviewTotalUnits,
         configuration,
         starting_price AS startingPrice,
         description,
         walkthrough_video_url AS walkthroughVideoUrl,
         brochure_pdf_url AS brochurePdfUrl,
         availability_chart_pdf_url AS availabilityChartPdfUrl,
         map_location_url AS mapLocationUrl,
         project_highlights AS projectHighlights,
         project_details AS projectDetails,
         amenities,
         exterior_images AS exteriorImages,
         interior_images AS interiorImages,
         location_advantages AS locationAdvantages,
         other_charges AS otherCharges,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM villas
       ORDER BY updated_at DESC`
    );

    return res.json({ villas: rows.map((row) => mapVillaRow(row, req)) });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not load villas right now.' });
  }
});

app.get('/api/villas/:idOrSlug', async (req, res) => {
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
         acres,
         total_villas AS totalVillas,
         banner_image_url AS bannerImageUrl,
         project_logo_url AS projectLogoUrl,
         status,
         brochure_pdf_url AS brochurePdfUrl,
         description,
         overview_title AS overviewTitle,
         overview_description AS overviewDescription,
         overview_total_land AS overviewTotalLand,
         overview_total_units AS overviewTotalUnits,
         configuration,
         starting_price AS startingPrice,
         walkthrough_video_url AS walkthroughVideoUrl,
         availability_chart_pdf_url AS availabilityChartPdfUrl,
         map_location_url AS mapLocationUrl,
         project_highlights AS projectHighlights,
         project_details AS projectDetails,
         amenities,
         exterior_images AS exteriorImages,
         interior_images AS interiorImages,
         location_advantages AS locationAdvantages,
         other_charges AS otherCharges,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM villas
       WHERE ${isNumericIdentifier ? 'id = ?' : 'slug = ?'}
       LIMIT 1`,
      [isNumericIdentifier ? Number(idOrSlug) : String(idOrSlug)]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Villa not found.' });
    }

    return res.json({ villa: mapVillaRow(rows[0], req) });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not load this villa right now.' });
  }
});

app.get('/api/admin/villas', requireAdmin, async (req, res) => {
  try {
    const pool = await getPool();
    const [rows] = await pool.query(
      `SELECT
         id,
         slug,
         name,
         location,
         acres,
         total_villas AS totalVillas,
         banner_image_url AS bannerImageUrl,
         project_logo_url AS projectLogoUrl,
         status,
         brochure_pdf_url AS brochurePdfUrl,
         description,
         overview_title AS overviewTitle,
         overview_description AS overviewDescription,
         overview_total_land AS overviewTotalLand,
         overview_total_units AS overviewTotalUnits,
         configuration,
         starting_price AS startingPrice,
         walkthrough_video_url AS walkthroughVideoUrl,
         exterior_images AS exteriorImages,
         interior_images AS interiorImages,
         project_highlights AS projectHighlights,
         project_details AS projectDetails,
         amenities,
         availability_chart_pdf_url AS availabilityChartPdfUrl,
         map_location_url AS mapLocationUrl,
         location_advantages AS locationAdvantages,
         other_charges AS otherCharges,
         created_at AS createdAt,
         updated_at AS updatedAt
       FROM villas
       ORDER BY updated_at DESC`
    );

    return res.json({ villas: rows.map((row) => mapVillaRowForAdmin(row, req)) });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not load villas.' });
  }
});

app.post(
  '/api/admin/villas',
  requireAdmin,
  villaUpload.fields([
    { name: 'bannerImage', maxCount: 1 },
    { name: 'projectLogo', maxCount: 1 },
    { name: 'brochurePdf', maxCount: 1 },
    { name: 'walkthroughVideo', maxCount: 1 },
    { name: 'availabilityChartPdf', maxCount: 1 },
    { name: 'locationScanImage', maxCount: 1 },
    { name: 'reraScanImage', maxCount: 1 },
    { name: 'exteriorImages', maxCount: 20 },
    { name: 'interiorImages', maxCount: 20 },
  ]),
  async (req, res) => {
    const uploadedFiles = req.files || {};
    const normalizedPayload = normalizeVillaPayload(req.body);
    if (!normalizedPayload.name || !normalizedPayload.location) {
      return res.status(400).json({ message: 'Name and location are required.' });
    }

    let cleanupUrls = [];

    try {
      const pool = await getPool();
      const storedMedia = await storeVillaUploadedMedia(pool, uploadedFiles);
      cleanupUrls = storedMedia.cleanupUrls;
      const { fileUrls } = storedMedia;
      const slug = await createUniqueVillaSlug(pool, normalizedPayload.name, normalizedPayload.slug);
      const projectDetails = {
        ...(normalizedPayload.projectDetails && typeof normalizedPayload.projectDetails === 'object' ? normalizedPayload.projectDetails : {}),
        projectName: normalizedPayload.name,
        location: normalizedPayload.location,
        totalLandArea: normalizedPayload.acres,
        totalUnits: normalizedPayload.totalVillas,
        configuration: normalizedPayload.configuration,
        price: normalizedPayload.startingPrice,
        status: normalizedPayload.status,
        reraNumber: normalizedPayload.reraNumber,
        locationScanImageUrl: fileUrls.locationScanImageUrl || '',
        reraScanImageUrl: fileUrls.reraScanImageUrl || '',
      };

      const [result] = await pool.execute(
        `INSERT INTO villas
          (slug, name, location, acres, total_villas, banner_image_url, project_logo_url, status, brochure_pdf_url, description,
           overview_title, overview_description, overview_total_land, overview_total_units, configuration, starting_price,
           walkthrough_video_url, exterior_images, interior_images, project_highlights, project_details, amenities,
           availability_chart_pdf_url, map_location_url, location_advantages, other_charges)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)` ,
        [
          slug,
          normalizedPayload.name,
          normalizedPayload.location,
          normalizedPayload.acres || null,
          normalizedPayload.totalVillas || null,
          fileUrls.bannerImageUrl || null,
          fileUrls.projectLogoUrl || null,
          normalizedPayload.status,
          fileUrls.brochurePdfUrl || null,
          normalizedPayload.description || null,
          normalizedPayload.overviewTitle || null,
          normalizedPayload.overviewDescription || null,
          normalizedPayload.overviewTotalLand || null,
          normalizedPayload.overviewTotalUnits || null,
          normalizedPayload.configuration || null,
          normalizedPayload.startingPrice || null,
          fileUrls.walkthroughVideoUrl || null,
          fileUrls.exteriorImages.length > 0 ? JSON.stringify(fileUrls.exteriorImages) : null,
          fileUrls.interiorImages.length > 0 ? JSON.stringify(fileUrls.interiorImages) : null,
          normalizedPayload.projectHighlights.length > 0 ? JSON.stringify(normalizedPayload.projectHighlights) : null,
          JSON.stringify(projectDetails),
          normalizedPayload.amenities.length > 0 ? JSON.stringify(normalizedPayload.amenities) : null,
          fileUrls.availabilityChartPdfUrl || null,
          normalizedPayload.mapLocationUrl || null,
          normalizedPayload.locationAdvantages.length > 0 ? JSON.stringify(normalizedPayload.locationAdvantages) : null,
          normalizedPayload.otherCharges || null,
        ]
      );

      const [rows] = await pool.execute(
        `SELECT
           id,
           slug,
           name,
           location,
           acres,
           total_villas AS totalVillas,
           banner_image_url AS bannerImageUrl,
           project_logo_url AS projectLogoUrl,
           status,
           brochure_pdf_url AS brochurePdfUrl,
           description,
           overview_title AS overviewTitle,
           overview_description AS overviewDescription,
           overview_total_land AS overviewTotalLand,
           overview_total_units AS overviewTotalUnits,
           configuration,
           starting_price AS startingPrice,
           walkthrough_video_url AS walkthroughVideoUrl,
           exterior_images AS exteriorImages,
           interior_images AS interiorImages,
           project_highlights AS projectHighlights,
           project_details AS projectDetails,
           amenities,
           availability_chart_pdf_url AS availabilityChartPdfUrl,
           map_location_url AS mapLocationUrl,
           location_advantages AS locationAdvantages,
           other_charges AS otherCharges,
           created_at AS createdAt,
           updated_at AS updatedAt
         FROM villas
         WHERE id = ?
         LIMIT 1`,
        [result.insertId]
      );

      return res.status(201).json({
        message: 'Villa created successfully.',
        villa: mapVillaRowForAdmin(rows[0], req),
      });
    } catch (_error) {
      removeStoredImages(cleanupUrls);
      return res.status(500).json({ message: 'Could not create villa.' });
    }
  }
);

app.put(
  '/api/admin/villas/:villaId',
  requireAdmin,
  villaUpload.fields([
    { name: 'bannerImage', maxCount: 1 },
    { name: 'projectLogo', maxCount: 1 },
    { name: 'brochurePdf', maxCount: 1 },
    { name: 'walkthroughVideo', maxCount: 1 },
    { name: 'availabilityChartPdf', maxCount: 1 },
    { name: 'locationScanImage', maxCount: 1 },
    { name: 'reraScanImage', maxCount: 1 },
    { name: 'exteriorImages', maxCount: 20 },
    { name: 'interiorImages', maxCount: 20 },
  ]),
  async (req, res) => {
    const villaId = Number(req.params.villaId);
    const uploadedFiles = req.files || {};
    const normalizedPayload = normalizeVillaPayload(req.body);
    const hasBannerImage = Array.isArray(uploadedFiles.bannerImage) && uploadedFiles.bannerImage.length > 0;
    const hasProjectLogo = Array.isArray(uploadedFiles.projectLogo) && uploadedFiles.projectLogo.length > 0;
    const hasBrochurePdf = Array.isArray(uploadedFiles.brochurePdf) && uploadedFiles.brochurePdf.length > 0;
    const hasWalkthroughVideo = Array.isArray(uploadedFiles.walkthroughVideo) && uploadedFiles.walkthroughVideo.length > 0;
    const hasAvailabilityChartPdf = Array.isArray(uploadedFiles.availabilityChartPdf) && uploadedFiles.availabilityChartPdf.length > 0;
    const hasLocationScanImage = Array.isArray(uploadedFiles.locationScanImage) && uploadedFiles.locationScanImage.length > 0;
    const hasReraScanImage = Array.isArray(uploadedFiles.reraScanImage) && uploadedFiles.reraScanImage.length > 0;

    if (!Number.isInteger(villaId) || villaId <= 0) {
      return res.status(400).json({ message: 'Invalid villa id.' });
    }

    let cleanupUrls = [];

    try {
      const pool = await getPool();
      const [existingRows] = await pool.execute(
        `SELECT
           id,
           slug,
           name,
           location,
           acres,
           total_villas AS totalVillas,
           banner_image_url AS bannerImageUrl,
           project_logo_url AS projectLogoUrl,
           status,
           brochure_pdf_url AS brochurePdfUrl,
           description,
           overview_title AS overviewTitle,
           overview_description AS overviewDescription,
           overview_total_land AS overviewTotalLand,
           overview_total_units AS overviewTotalUnits,
           configuration,
           starting_price AS startingPrice,
           walkthrough_video_url AS walkthroughVideoUrl,
           exterior_images AS exteriorImages,
           interior_images AS interiorImages,
           project_highlights AS projectHighlights,
           project_details AS projectDetails,
           amenities,
           availability_chart_pdf_url AS availabilityChartPdfUrl,
           map_location_url AS mapLocationUrl,
           project_details AS projectDetails,
           location_advantages AS locationAdvantages,
           other_charges AS otherCharges,
           created_at AS createdAt,
           updated_at AS updatedAt
         FROM villas
         WHERE id = ?
         LIMIT 1`,
        [villaId]
      );

      if (existingRows.length === 0) {
        return res.status(404).json({ message: 'Villa not found.' });
      }

      const existingRow = existingRows[0];
      const existingHighlights = normalizeStringArray(existingRow.projectHighlights);
      const existingAmenities = normalizeAmenityItems(existingRow.amenities);
      const existingLocationAdvantages = normalizeStringArray(existingRow.locationAdvantages);
      const existingExteriorImages = normalizeStringArray(existingRow.exteriorImages);
      const existingInteriorImages = normalizeStringArray(existingRow.interiorImages);
      const existingProjectDetails = parseJsonValue(existingRow.projectDetails, {}) || {};
      const retainedExteriorImages = Array.isArray(normalizedPayload.existingExteriorImages)
        ? normalizedPayload.existingExteriorImages.map((value) => normalizeStoredReferenceUrl(value)).filter(Boolean)
        : existingExteriorImages;
      const retainedInteriorImages = Array.isArray(normalizedPayload.existingInteriorImages)
        ? normalizedPayload.existingInteriorImages.map((value) => normalizeStoredReferenceUrl(value)).filter(Boolean)
        : existingInteriorImages;

      const storedMedia = await storeVillaUploadedMedia(pool, uploadedFiles);
      cleanupUrls = storedMedia.cleanupUrls;
      const { fileUrls } = storedMedia;
      const nextName = normalizedPayload.name || existingRow.name || '';
      const nextLocation = normalizedPayload.location || existingRow.location || '';
      const nextSlug = await createUniqueVillaSlug(pool, nextName, normalizedPayload.slug || existingRow.slug, villaId);
      const nextProjectDetails = Object.keys(normalizedPayload.projectDetails || {}).length > 0
        ? {
            ...existingProjectDetails,
            ...normalizedPayload.projectDetails,
          }
        : existingProjectDetails;
      const nextHighlights = normalizedPayload.projectHighlights.length > 0 ? normalizedPayload.projectHighlights : existingHighlights;
      const nextAmenities = normalizedPayload.amenities.length > 0 ? normalizedPayload.amenities : existingAmenities;
      const nextLocationAdvantages = normalizedPayload.locationAdvantages.length > 0 ? normalizedPayload.locationAdvantages : existingLocationAdvantages;
      const nextExteriorImages = [...retainedExteriorImages, ...fileUrls.exteriorImages];
      const nextInteriorImages = [...retainedInteriorImages, ...fileUrls.interiorImages];
      const nextBannerImageUrl = fileUrls.bannerImageUrl || existingRow.bannerImageUrl;
      const nextProjectLogoUrl = fileUrls.projectLogoUrl || existingRow.projectLogoUrl;
      const nextBrochurePdfUrl = fileUrls.brochurePdfUrl || existingRow.brochurePdfUrl;
      const nextWalkthroughVideoUrl = fileUrls.walkthroughVideoUrl || existingRow.walkthroughVideoUrl;
      const nextAvailabilityChartPdfUrl = fileUrls.availabilityChartPdfUrl || existingRow.availabilityChartPdfUrl;
      const nextLocationScanImageUrl = fileUrls.locationScanImageUrl || existingProjectDetails.locationScanImageUrl || '';
      const nextReraScanImageUrl = fileUrls.reraScanImageUrl || existingProjectDetails.reraScanImageUrl || '';
      const nextDescription = normalizedPayload.description || existingRow.description || '';
      const nextOverviewTitle = normalizedPayload.overviewTitle || existingRow.overviewTitle || '';
      const nextOverviewDescription = normalizedPayload.overviewDescription || existingRow.overviewDescription || '';
      const nextOverviewTotalLand = normalizedPayload.overviewTotalLand || existingRow.overviewTotalLand || '';
      const nextOverviewTotalUnits = normalizedPayload.overviewTotalUnits || existingRow.overviewTotalUnits || '';
      const nextConfiguration = normalizedPayload.configuration || existingRow.configuration || '';
      const nextStartingPrice = normalizedPayload.startingPrice || existingRow.startingPrice || '';
      const nextStatus = normalizeVillaStatus(normalizedPayload.status, existingRow.status || 'draft');
      const nextAcres = normalizedPayload.acres || existingRow.acres || '';
      const nextTotalVillas = normalizedPayload.totalVillas || existingRow.totalVillas || '';
      const nextMapLocationUrl = normalizedPayload.mapLocationUrl || existingRow.mapLocationUrl || '';
      const nextOtherCharges = normalizedPayload.otherCharges || existingRow.otherCharges || '';
      const mergedProjectDetails = {
        ...nextProjectDetails,
        projectName: nextProjectDetails.projectName || nextName,
        location: nextProjectDetails.location || nextLocation,
        totalLandArea: nextProjectDetails.totalLandArea || nextAcres,
        totalUnits: nextProjectDetails.totalUnits || nextTotalVillas,
        configuration: nextProjectDetails.configuration || nextConfiguration,
        price: nextProjectDetails.price || nextStartingPrice,
        status: nextProjectDetails.status || nextStatus,
        reraNumber: nextProjectDetails.reraNumber || normalizedPayload.reraNumber || existingProjectDetails.reraNumber || '',
        locationScanImageUrl: nextLocationScanImageUrl,
        reraScanImageUrl: nextReraScanImageUrl,
      };

      await pool.execute(
        `UPDATE villas
         SET
           slug = ?,
           name = ?,
           location = ?,
           acres = ?,
           total_villas = ?,
           banner_image_url = ?,
           project_logo_url = ?,
           status = ?,
           brochure_pdf_url = ?,
           description = ?,
           overview_title = ?,
           overview_description = ?,
           overview_total_land = ?,
           overview_total_units = ?,
           configuration = ?,
           starting_price = ?,
           walkthrough_video_url = ?,
           exterior_images = ?,
           interior_images = ?,
           project_highlights = ?,
           project_details = ?,
           amenities = ?,
           availability_chart_pdf_url = ?,
           map_location_url = ?,
           location_advantages = ?,
           other_charges = ?
         WHERE id = ?`,
        [
          nextSlug,
          nextName,
          nextLocation,
          nextAcres || null,
          nextTotalVillas || null,
          nextBannerImageUrl || null,
          nextProjectLogoUrl || null,
          nextStatus,
          nextBrochurePdfUrl || null,
          nextDescription || null,
          nextOverviewTitle || null,
          nextOverviewDescription || null,
          nextOverviewTotalLand || null,
          nextOverviewTotalUnits || null,
          nextConfiguration || null,
          nextStartingPrice || null,
          nextWalkthroughVideoUrl || null,
          nextExteriorImages.length > 0 ? JSON.stringify(nextExteriorImages) : null,
          nextInteriorImages.length > 0 ? JSON.stringify(nextInteriorImages) : null,
          nextHighlights.length > 0 ? JSON.stringify(nextHighlights) : null,
          JSON.stringify(mergedProjectDetails),
          nextAmenities.length > 0 ? JSON.stringify(nextAmenities) : null,
          nextAvailabilityChartPdfUrl || null,
          nextMapLocationUrl || null,
          nextLocationAdvantages.length > 0 ? JSON.stringify(nextLocationAdvantages) : null,
          nextOtherCharges || null,
          villaId,
        ]
      );

      if (hasBannerImage && existingRow.bannerImageUrl) {
        removeStoredImages([existingRow.bannerImageUrl]);
      }

      if (hasProjectLogo && existingRow.projectLogoUrl) {
        removeStoredImages([existingRow.projectLogoUrl]);
      }

      if (hasBrochurePdf && existingRow.brochurePdfUrl) {
        removeStoredImages([existingRow.brochurePdfUrl]);
      }

      if (hasWalkthroughVideo && existingRow.walkthroughVideoUrl) {
        removeStoredImages([existingRow.walkthroughVideoUrl]);
      }

      if (hasAvailabilityChartPdf && existingRow.availabilityChartPdfUrl) {
        removeStoredImages([existingRow.availabilityChartPdfUrl]);
      }

      if (hasLocationScanImage && existingProjectDetails.locationScanImageUrl) {
        removeStoredImages([existingProjectDetails.locationScanImageUrl]);
      }

      if (hasReraScanImage && existingProjectDetails.reraScanImageUrl) {
        removeStoredImages([existingProjectDetails.reraScanImageUrl]);
      }

      const removedExteriorImages = existingExteriorImages.filter((imageUrl) => !retainedExteriorImages.includes(imageUrl));
      const removedInteriorImages = existingInteriorImages.filter((imageUrl) => !retainedInteriorImages.includes(imageUrl));

      if (removedExteriorImages.length > 0) {
        removeStoredImages(removedExteriorImages);
      }

      if (removedInteriorImages.length > 0) {
        removeStoredImages(removedInteriorImages);
      }

      const [rows] = await pool.execute(
        `SELECT
           id,
           slug,
           name,
           location,
           acres,
           total_villas AS totalVillas,
           banner_image_url AS bannerImageUrl,
           project_logo_url AS projectLogoUrl,
           status,
           brochure_pdf_url AS brochurePdfUrl,
           description,
           overview_title AS overviewTitle,
           overview_description AS overviewDescription,
           overview_total_land AS overviewTotalLand,
           overview_total_units AS overviewTotalUnits,
           configuration,
           starting_price AS startingPrice,
           walkthrough_video_url AS walkthroughVideoUrl,
           exterior_images AS exteriorImages,
           interior_images AS interiorImages,
           project_highlights AS projectHighlights,
           project_details AS projectDetails,
           amenities,
           availability_chart_pdf_url AS availabilityChartPdfUrl,
           map_location_url AS mapLocationUrl,
           location_advantages AS locationAdvantages,
           other_charges AS otherCharges,
           created_at AS createdAt,
           updated_at AS updatedAt
         FROM villas
         WHERE id = ?
         LIMIT 1`,
        [villaId]
      );

      return res.json({
        message: 'Villa updated successfully.',
        villa: mapVillaRowForAdmin(rows[0], req),
      });
    } catch (_error) {
      removeStoredImages(cleanupUrls);
      return res.status(500).json({ message: 'Could not update villa.' });
    }
  }
);

app.delete('/api/admin/villas/:villaId', requireAdmin, async (req, res) => {
  const villaId = Number(req.params.villaId);

  if (!Number.isInteger(villaId) || villaId <= 0) {
    return res.status(400).json({ message: 'Invalid villa id.' });
  }

  try {
    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT
         id,
         banner_image_url AS bannerImageUrl,
         project_logo_url AS projectLogoUrl,
         brochure_pdf_url AS brochurePdfUrl,
         walkthrough_video_url AS walkthroughVideoUrl,
         availability_chart_pdf_url AS availabilityChartPdfUrl,
         exterior_images AS exteriorImages,
         interior_images AS interiorImages,
         project_details AS projectDetails
       FROM villas
       WHERE id = ?
       LIMIT 1`,
      [villaId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Villa not found.' });
    }

    await pool.execute('DELETE FROM villas WHERE id = ?', [villaId]);
    const projectDetails = parseJsonValue(rows[0].projectDetails, {}) || {};
    removeStoredImages([
      rows[0].bannerImageUrl,
      rows[0].projectLogoUrl,
      rows[0].brochurePdfUrl,
      rows[0].walkthroughVideoUrl,
      rows[0].availabilityChartPdfUrl,
      ...normalizeStringArray(rows[0].exteriorImages),
      ...normalizeStringArray(rows[0].interiorImages),
      projectDetails.locationScanImageUrl,
      projectDetails.reraScanImageUrl,
    ]);

    return res.json({ message: 'Villa deleted successfully.' });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not delete villa.' });
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

app.post('/api/admin/verify-password', requireAdmin, async (req, res) => {
  const { password } = req.body || {};

  if (!password) {
    return res.status(400).json({ message: 'Password is required.' });
  }

  try {
    const pool = await getPool();
    const [rows] = await pool.execute(
      `SELECT password_hash AS passwordHash
       FROM admin_users
       WHERE id = ?
       LIMIT 1`,
      [req.admin.id]
    );

    if (rows.length === 0 || !verifyPassword(String(password), rows[0].passwordHash)) {
      return res.status(401).json({ message: 'Invalid password.' });
    }

    return res.json({ message: 'Password verified successfully.' });
  } catch (_error) {
    return res.status(500).json({ message: 'Could not verify password.' });
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
    return res.status(400).json({ message: 'Gallery type, category, and place name are required.' });
  }

  if (files.length < 1 || files.length > 3) {
    return res.status(400).json({ message: 'Please upload at least 1 and at most 3 images for each place.' });
  }

  let imageUrls = [];

  try {
    const pool = await getPool();
    imageUrls = await storeUploadedMediaFiles(pool, files, 'galleries');
    const paddedImageUrls = [...imageUrls, '', ''].slice(0, 3);

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
    removeStoredImages(imageUrls);
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
    return res.status(400).json({ message: 'Invalid gallery entry id.' });
  }

  if (!galleryType || !category || !placeName) {
    return res.status(400).json({ message: 'Gallery type, category, and place name are required.' });
  }

  if (files.length > 3) {
    return res.status(400).json({ message: 'Please upload at most 3 image files.' });
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
      return res.status(404).json({ message: 'Gallery entry not found.' });
    }

    let nextImageUrls = [existingRows[0].image1Url, existingRows[0].image2Url, existingRows[0].image3Url];
    let shouldDeleteExistingImages = false;

    if (files.length > 0) {
      const uploadedImageUrls = await storeUploadedMediaFiles(pool, files, 'galleries');
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
    return res.status(400).json({ message: 'Name, location, land area, and units are required.' });
  }

  if (!uploadedFile) {
    return res.status(400).json({ message: 'Please upload a cover image.' });
  }

  let imageUrl = '';

  try {
    const pool = await getPool();
    imageUrl = await storeUploadedMediaFile(pool, uploadedFile, 'commercial-projects');
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
    removeStoredImages([imageUrl]);
    return res.status(500).json({ message: 'Could not create commercial project.' });
  }
});

app.put('/api/admin/commercial-projects/:projectId', requireAdmin, commercialProjectUpload.single('image'), async (req, res) => {
  const projectId = Number(req.params.projectId);
  const uploadedFile = req.file || null;

  if (!Number.isInteger(projectId) || projectId <= 0) {
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
    return res.status(400).json({ message: 'Name, location, land area, and units are required.' });
  }

  let nextImageUrl = '';

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
      return res.status(404).json({ message: 'Commercial project not found.' });
    }

    nextImageUrl = existingRows[0].imageUrl;

    if (uploadedFile) {
      nextImageUrl = await storeUploadedMediaFile(pool, uploadedFile, 'commercial-projects');
    }

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
    if (uploadedFile) {
      removeStoredImages([nextImageUrl]);
    }
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
  const blogPayload = normalizeBlogPayload(req.body);
  const {
    title,
    excerpt,
    content,
    category,
    author,
    preferredSlug,
    isPublished,
    publishedAt,
  } = blogPayload;
  let imageUrl = '';

  if (!uploadedFile) {
    return res.status(400).json({ message: 'Please upload a cover image.' });
  }

  if (!title || !excerpt || !content || !category) {
    return res.status(400).json({ message: 'Title, excerpt, content, and category are required.' });
  }

  if (publishedAt && Number.isNaN(publishedAt.getTime())) {
    return res.status(400).json({ message: 'Published date is invalid.' });
  }

  let cleanupUrls = [];

  try {
    const pool = await getPool();
    imageUrl = await storeUploadedMediaFile(pool, uploadedFile, 'blogs');
    cleanupUrls = imageUrl ? [imageUrl] : [];
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
    removeStoredImages(cleanupUrls);
    return res.status(500).json({ message: 'Could not save this blog.' });
  }
});

app.put('/api/admin/blogs/:blogId', requireAdmin, blogUpload.single('image'), async (req, res) => {
  const blogId = Number(req.params.blogId);
  const uploadedFile = req.file || null;

  if (!Number.isInteger(blogId) || blogId <= 0) {
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
  } = normalizeBlogPayload(req.body);

  if (!title || !excerpt || !content || !category) {
    return res.status(400).json({ message: 'Title, excerpt, content, and category are required.' });
  }

  if (publishedAt && Number.isNaN(publishedAt.getTime())) {
    return res.status(400).json({ message: 'Published date is invalid.' });
  }

  let cleanupUrls = [];

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
      return res.status(404).json({ message: 'Blog not found.' });
    }

    const nextImageUrl = uploadedFile ? await storeUploadedMediaFile(pool, uploadedFile, 'blogs') : existingRows[0].imageUrl;

    if (uploadedFile && nextImageUrl) {
      cleanupUrls = [nextImageUrl];
    }

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

    if (uploadedFile && existingRows[0].imageUrl) {
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
    removeStoredImages(cleanupUrls);
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
