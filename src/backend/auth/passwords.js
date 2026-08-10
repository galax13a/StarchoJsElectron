'use strict';

const crypto = require('crypto');

const KEY_LENGTH = 64;
const SCRYPT_OPTIONS = { N: 16_384, r: 8, p: 1, maxmem: 32 * 1024 * 1024 };
const LEGACY_SALT = 'starcho-local-salt';

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

function legacyHash(password) {
  return crypto.createHash('sha256').update(password + LEGACY_SALT).digest('hex');
}

function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  if (stored.startsWith('scrypt$')) {
    const [, saltHex, keyHex] = stored.split('$');
    if (!saltHex || !keyHex || !/^[0-9a-f]+$/i.test(saltHex) || !/^[0-9a-f]+$/i.test(keyHex)) return false;
    try {
      const expected = Buffer.from(keyHex, 'hex');
      const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, SCRYPT_OPTIONS);
      return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
    } catch (_) { return false; }
  }
  const expected = Buffer.from(stored, 'hex');
  const actual = Buffer.from(legacyHash(password), 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function isLegacyHash(stored) {
  return typeof stored === 'string' && /^[0-9a-f]{64}$/i.test(stored);
}

module.exports = { hashPassword, verifyPassword, isLegacyHash };
