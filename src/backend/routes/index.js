'use strict';

// ── Core router — auth + config + settings + plugin management ──────────────

const crypto = require('crypto');
const router = require('express').Router();
const { getDb } = require('../database/connection');
const { validate } = require('../middleware/validate');
const { LoginSchema, RegisterSchema, ProfileUpdateSchema } = require('../schemas/auth');
const { hashPassword, verifyPassword, isLegacyHash } = require('../auth/passwords');

// ── App session store (SQLite-backed, 7-day tokens) ───────────────────────────
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const loginAttempts = new Map();
const registerAttempts = new Map();

function hashSessionToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function createAppSession(username) {
  const db        = getDb();
  const token     = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL;
  db.prepare('INSERT OR REPLACE INTO app_sessions (token, username, expires_at) VALUES (?, ?, ?)')
    .run(hashSessionToken(token), username, expiresAt);
  // Clean up expired sessions opportunistically
  db.prepare('DELETE FROM app_sessions WHERE expires_at < ?').run(Date.now());
  return { token, expiresAt };
}

function validateAppSession(token) {
  if (!token) return null;
  const db  = getDb();
  const row = db.prepare('SELECT username FROM app_sessions WHERE token = ? AND expires_at > ?')
    .get(hashSessionToken(token), Date.now());
  return row ? row.username : null;
}

function destroyAppSession(token) {
  try { getDb().prepare('DELETE FROM app_sessions WHERE token = ?').run(hashSessionToken(token)); } catch (_) {}
}

function bearerToken(req) {
  const header = req.get('authorization') || '';
  const match = header.match(/^Bearer\s+([A-Za-z0-9]+)$/i);
  return match ? match[1] : null;
}

function requireAppSession(req, res, next) {
  const token = bearerToken(req);
  const username = validateAppSession(token);
  if (!username) return res.status(401).json({ error: 'Sesión requerida o expirada' });
  req.auth = { token, username };
  res.set('Cache-Control', 'no-store');
  next();
}

function rateRecord(map, ip) {
  const now = Date.now();
  for (const [key, value] of map) {
    if (now - value.startedAt >= LOGIN_WINDOW_MS) map.delete(key);
  }
  const record = map.get(ip);
  if (!record || now - record.startedAt >= LOGIN_WINDOW_MS) {
    const fresh = { startedAt: now, count: 0 };
    map.set(ip, fresh);
    return fresh;
  }
  return record;
}

function ensureDefaultUser(db) {
  const u = process.env.APP_USER     || 'admin';
  const p = process.env.APP_PASSWORD || 'admin123';
  db.prepare('INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)').run(u, hashPassword(p));
}

// ── Auth ─────────────────────────────────────────────────────────────────────

router.post('/auth/login', validate(LoginSchema), (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || '127.0.0.1';
  const attempt = rateRecord(loginAttempts, ip);
  res.set('Cache-Control', 'no-store');
  if (attempt.count >= LOGIN_MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Demasiados intentos. Espera 15 minutos.' });
  }
  try {
    const db = getDb();
    ensureDefaultUser(db);
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user || !verifyPassword(password, user.password)) {
      attempt.count += 1;
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }
    if (isLegacyHash(user.password)) {
      db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashPassword(password), user.id);
    }
    loginAttempts.delete(ip);
    const { token, expiresAt } = createAppSession(user.username);
    res.json({ ok: true, username: user.username, token, expiresAt });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Validates a session token — called on app startup when a stored session exists
router.get('/auth/validate', (req, res) => {
  const token    = bearerToken(req);
  const username = validateAppSession(token);
  res.set('Cache-Control', 'no-store');
  if (!username) return res.status(401).json({ error: 'Sesión expirada o inválida' });
  try {
    const db   = getDb();
    const user = db.prepare('SELECT username FROM users WHERE username = ?').get(username);
    if (!user) { destroyAppSession(token); return res.status(401).json({ error: 'Usuario no encontrado' }); }
    res.json({ ok: true, username: user.username });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/auth/register', validate(RegisterSchema), (req, res) => {
  const { username, password } = req.body;
  const ip = req.ip || '127.0.0.1';
  const attempt = rateRecord(registerAttempts, ip);
  if (attempt.count >= LOGIN_MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Demasiados registros. Espera 15 minutos.' });
  }
  try {
    const db = getDb();
    if (db.prepare('SELECT id FROM users WHERE username = ?').get(username))
      return res.status(409).json({ error: 'Ese usuario ya existe' });
    db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashPassword(password));
    registerAttempts.delete(ip);
    res.json({ ok: true });
  } catch (err) {
    attempt.count += 1;
    res.status(500).json({ error: 'No se pudo crear la cuenta' });
  }
});

router.get('/auth/profile', requireAppSession, (req, res) => {
  const username = req.auth.username;
  try {
    const db   = getDb();
    const user = db.prepare('SELECT username, full_name, nickname, whatsapp, avatar FROM users WHERE username = ?').get(username);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/auth/profile', requireAppSession, validate(ProfileUpdateSchema), (req, res) => {
  const { username, full_name, nickname, whatsapp, avatar } = req.body;
  if (username !== req.auth.username) return res.status(403).json({ error: 'No puedes modificar otro usuario' });
  try {
    const db = getDb();
    db.prepare('UPDATE users SET full_name=?, nickname=?, whatsapp=?, avatar=? WHERE username=?')
      .run(full_name, nickname, whatsapp, avatar, username);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Everything outside the public auth endpoints requires the bearer session.
router.use(requireAppSession);

// ── App config ────────────────────────────────────────────────────────────────

router.get('/config', (_req, res) => {
  res.json({
    appName:    process.env.APP_NAME    || 'Starcho JS',
    appVersion: process.env.APP_VERSION || '1.0.0',
    appSlogan:  process.env.APP_SLOGAN  || 'Notas simples, rápidas y organizadas',
    logoText:   process.env.LOGO_TEXT   || 'Starcho',
    appTitle:   process.env.APP_TITLE   || 'Starcho JS — Notas',
  });
});

// ── Settings (global key-value store) ────────────────────────────────────────

router.use('/settings', require('./settingsRoutes'));

// ── Plugin management ─────────────────────────────────────────────────────────

router.use('/plugins', require('./pluginsRoute'));

module.exports = router;
