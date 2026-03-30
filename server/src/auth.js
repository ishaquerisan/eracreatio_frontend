const crypto = require('crypto');

function createPasswordHash(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }

  const [salt, hashHex] = storedHash.split(':');
  const derivedHashHex = crypto.scryptSync(password, salt, 64).toString('hex');

  const hashBuffer = Buffer.from(hashHex, 'hex');
  const derivedBuffer = Buffer.from(derivedHashHex, 'hex');

  if (hashBuffer.length !== derivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, derivedBuffer);
}

function createSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

module.exports = {
  createPasswordHash,
  verifyPassword,
  createSessionToken,
  hashToken,
  slugify,
};
