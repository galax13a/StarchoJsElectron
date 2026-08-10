'use strict';

const { ipcMain, app, shell, Notification, safeStorage, dialog } = require('electron');
const { getMainWindow } = require('./windowManager');
const { IS_DEV } = require('./env');
const { getDb } = require('../backend/database/connection');
const log = require('electron-log');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const crypto = require('crypto');

let authSessionPath = null;

function isTrustedSender(event) {
  const win = getMainWindow();
  const frameUrl = event?.senderFrame?.url || '';
  const allowedUrl = pathToFileURL(path.join(__dirname, '..', 'renderer', 'index.html')).href;
  return Boolean(
    win && !win.isDestroyed() &&
    event?.sender === win.webContents &&
    (frameUrl === allowedUrl || frameUrl.startsWith(`${allowedUrl}#`)),
  );
}

function requireTrustedSender(event) {
  if (!isTrustedSender(event)) {
    log.warn('[IPC] Rejected message from untrusted sender');
    throw new Error('Untrusted IPC sender');
  }
}

function acceptTrustedSender(event) {
  if (!isTrustedSender(event)) {
    log.warn('[IPC] Rejected message from untrusted sender');
    return false;
  }
  return true;
}

function readSecureSession() {
  if (!authSessionPath || !safeStorage.isEncryptionAvailable()) return null;
  try {
    const encrypted = fs.readFileSync(authSessionPath);
    return JSON.parse(safeStorage.decryptString(encrypted));
  } catch (_) {
    return null;
  }
}

function writeSecureSession(session) {
  if (!authSessionPath || !safeStorage.isEncryptionAvailable()) return false;
  if (!session || typeof session.token !== 'string' || session.token.length > 256) return false;
  if (typeof session.username !== 'string' || session.username.length > 128) return false;
  if (!Number.isFinite(session.expiresAt)) return false;
  try {
    const payload = JSON.stringify({
      token: session.token,
      username: session.username,
      expiresAt: session.expiresAt,
    });
    fs.writeFileSync(authSessionPath, safeStorage.encryptString(payload), { mode: 0o600 });
    return true;
  } catch (error) {
    log.warn('[IPC] Could not save secure auth session:', error.message);
    return false;
  }
}

function clearSecureSession() {
  if (!authSessionPath) return;
  try { fs.rmSync(authSessionPath, { force: true }); } catch (_) {}
}

function lockConfigPath(appPaths) { return path.join(appPaths.userData, 'app-lock.bin'); }

function readLockConfig(appPaths) {
  try {
    const raw = fs.readFileSync(lockConfigPath(appPaths));
    const text = safeStorage.isEncryptionAvailable() ? safeStorage.decryptString(raw) : raw.toString('utf8');
    const config = JSON.parse(text);
    if (!['pin', 'password'].includes(config.mode)) return null;
    return config;
  } catch (_) { return null; }
}

function writeLockConfig(appPaths, config) {
  const text = JSON.stringify(config);
  const payload = safeStorage.isEncryptionAvailable() ? safeStorage.encryptString(text) : Buffer.from(text, 'utf8');
  fs.writeFileSync(lockConfigPath(appPaths), payload, { mode: 0o600 });
}

function hashLockPin(pin, saltHex) {
  return crypto.scryptSync(pin, Buffer.from(saltHex, 'hex'), 32).toString('hex');
}

function registerIpcHandlers(appPaths, serverPort) {
  authSessionPath = path.join(appPaths.userData, 'auth-session.bin');

  ipcMain.handle('app:get-server-port', (event) => { requireTrustedSender(event); return serverPort; });
  ipcMain.handle('app:get-version', (event) => { requireTrustedSender(event); return app.getVersion(); });
  ipcMain.handle('app:get-paths', (event) => { requireTrustedSender(event); return appPaths; });
  ipcMain.handle('app:is-dev', (event) => { requireTrustedSender(event); return IS_DEV; });

  ipcMain.handle('data:create-backup', async (event, language) => {
    requireTrustedSender(event);
    const lang = language === 'en' ? 'en' : 'es';
    const defaultName = `starcho-backup-${new Date().toISOString().slice(0, 10)}.db`;
    const result = await dialog.showSaveDialog(getMainWindow(), {
      title: lang === 'en' ? 'Create backup' : 'Guardar copia de seguridad',
      defaultPath: path.join(appPaths.userData, defaultName),
      filters: [{ name: 'Base de datos SQLite', extensions: ['db'] }],
    });
    if (result.canceled || !result.filePath) return { canceled: true };
    await getDb().backup(path.resolve(result.filePath));
    return { canceled: false, path: result.filePath };
  });

  ipcMain.handle('lock:get-config', (event) => {
    requireTrustedSender(event);
    const config = readLockConfig(appPaths);
    return config ? { configured: true, mode: config.mode } : { configured: false, mode: null };
  });
  ipcMain.handle('lock:set-config', (event, payload) => {
    requireTrustedSender(event);
    if (!payload || !['pin', 'password'].includes(payload.mode)) throw new Error('INVALID_LOCK_METHOD');
    if (payload.mode === 'pin' && !/^\d{4}$/.test(String(payload.pin || ''))) throw new Error('INVALID_PIN');
    const config = { mode: payload.mode };
    if (payload.mode === 'pin') {
      const salt = crypto.randomBytes(16).toString('hex');
      config.salt = salt;
      config.hash = hashLockPin(String(payload.pin), salt);
    }
    writeLockConfig(appPaths, config);
    return { configured: true, mode: config.mode };
  });
  ipcMain.handle('lock:verify-pin', (event, pin) => {
    requireTrustedSender(event);
    const config = readLockConfig(appPaths);
    if (!config || config.mode !== 'pin' || !/^\d{4}$/.test(String(pin || ''))) return false;
    const actual = Buffer.from(hashLockPin(String(pin), config.salt), 'hex');
    const expected = Buffer.from(config.hash, 'hex');
    return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
  });
  ipcMain.handle('lock:clear-config', (event) => {
    requireTrustedSender(event);
    try { fs.rmSync(lockConfigPath(appPaths), { force: true }); } catch (_) {}
    return true;
  });

  ipcMain.handle('auth:get-session', (event) => { requireTrustedSender(event); return readSecureSession(); });
  ipcMain.handle('auth:set-session', (event, session) => { requireTrustedSender(event); return writeSecureSession(session); });
  ipcMain.handle('auth:clear-session', (event) => { requireTrustedSender(event); clearSecureSession(); return true; });

  const logPath = path.join(app.getPath('userData'), 'errors.log');
  ipcMain.on('log:write', (event, message) => {
    if (!acceptTrustedSender(event)) return;
    const safeMessage = typeof message === 'string' ? message.slice(0, 4000) : String(message ?? '').slice(0, 4000);
    try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${safeMessage}\n`, 'utf8'); } catch (_) {}
  });
  ipcMain.handle('log:read', (event) => {
    requireTrustedSender(event);
    try { return fs.readFileSync(logPath, 'utf8').slice(-200_000); } catch (_) { return ''; }
  });
  ipcMain.handle('log:clear', (event) => {
    requireTrustedSender(event);
    try { fs.writeFileSync(logPath, '', 'utf8'); } catch (_) {}
  });

  ipcMain.handle('system:stats', async (event) => {
    requireTrustedSender(event);
    const os = require('os');
    const snapshot = () => os.cpus().map((cpu) => ({ ...cpu.times }));
    const before = snapshot();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const after = snapshot();
    let total = 0; let idle = 0;
    before.forEach((first, index) => {
      const second = after[index];
      const firstValues = Object.values(first);
      const secondValues = Object.values(second);
      const diff = secondValues.reduce((sum, value, i) => sum + value - firstValues[i], 0);
      total += diff;
      idle += second.idle - first.idle;
    });
    const totalMemory = os.totalmem();
    const usedMemory = totalMemory - os.freemem();
    let disk = null;
    try {
      const root = process.platform === 'win32' ? `${process.env.SYSTEMDRIVE || 'C:'}\\` : '/';
      const stat = await fs.promises.statfs(root);
      const totalDisk = stat.bsize * stat.blocks;
      const freeDisk = stat.bsize * stat.bavail;
      disk = { total: totalDisk, used: totalDisk - freeDisk, free: freeDisk, percent: Math.round(((totalDisk - freeDisk) / totalDisk) * 100) };
    } catch (_) {}
    return { cpu: total ? Math.round((1 - idle / total) * 100) : 0, memory: { total: totalMemory, used: usedMemory, percent: Math.round((usedMemory / totalMemory) * 100) }, disk };
  });

  ipcMain.on('window:minimize', (event) => { if (acceptTrustedSender(event)) getMainWindow()?.minimize(); });
  ipcMain.on('window:maximize', (event) => {
    if (!acceptTrustedSender(event)) return;
    const win = getMainWindow();
    if (win) win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  // Use app.quit() so the close control also terminates the backend on macOS,
  // where closing the only window normally leaves the process running.
  ipcMain.on('window:close', (event) => { if (acceptTrustedSender(event)) app.quit(); });
  ipcMain.handle('window:is-maximized', (event) => { requireTrustedSender(event); return getMainWindow()?.isMaximized() ?? false; });
  ipcMain.on('app:set-theme', (event, theme) => {
    if (!acceptTrustedSender(event) || !['dark', 'light'].includes(theme)) return;
    getMainWindow()?.webContents.send('app:theme-changed', theme);
  });

  ipcMain.on('app:notification', (event, payload) => {
    if (!acceptTrustedSender(event) || !Notification.isSupported() || !payload || typeof payload !== 'object') return;
    const title = typeof payload.title === 'string' ? payload.title.slice(0, 120) : 'Starcho JS';
    const body = typeof payload.body === 'string' ? payload.body.slice(0, 1000) : '';
    new Notification({ title, body }).show();
  });
  ipcMain.on('app:open-external', (event, value) => {
    if (!acceptTrustedSender(event) || typeof value !== 'string') return;
    try {
      const url = new URL(value);
      if (url.protocol === 'https:') shell.openExternal(url.toString());
    } catch (_) {}
  });
  ipcMain.on('app:restart', (event) => { if (acceptTrustedSender(event)) { app.relaunch(); app.exit(0); } });

  ipcMain.on('updater:install', (event) => {
    if (!acceptTrustedSender(event) || IS_DEV) return;
    require('electron-updater').autoUpdater.quitAndInstall();
  });
  ipcMain.on('updater:check', (event) => {
    if (!acceptTrustedSender(event) || IS_DEV) return;
    require('electron-updater').autoUpdater.checkForUpdatesAndNotify().catch((error) => log.error('[updater]', error.message));
  });
}

module.exports = { registerIpcHandlers };
