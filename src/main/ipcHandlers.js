'use strict';

const { ipcMain, app, shell, Notification } = require('electron');
const { getMainWindow } = require('./windowManager');
const { IS_DEV } = require('./env');
const log = require('electron-log');
const fs = require('fs');
const path = require('path');

function registerIpcHandlers(_appPaths, serverPort) {
  ipcMain.handle('app:get-server-port', () => serverPort);
  ipcMain.handle('app:get-version', () => app.getVersion());
  ipcMain.handle('app:get-paths', () => _appPaths);
  ipcMain.handle('app:is-dev', () => IS_DEV);

  const logPath = path.join(app.getPath('userData'), 'errors.log');
  ipcMain.on('log:write', (_event, message) => {
    try { fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${message}\n`, 'utf8'); } catch (_) {}
  });
  ipcMain.handle('log:read', () => { try { return fs.readFileSync(logPath, 'utf8'); } catch (_) { return ''; } });
  ipcMain.handle('log:clear', () => { try { fs.writeFileSync(logPath, '', 'utf8'); } catch (_) {} });

  ipcMain.handle('system:stats', async () => {
    const os = require('os');
    const snapshot = () => os.cpus().map((cpu) => ({ ...cpu.times }));
    const before = snapshot();
    await new Promise((resolve) => setTimeout(resolve, 300));
    const after = snapshot();
    let total = 0; let idle = 0;
    before.forEach((first, index) => {
      const second = after[index];
      const diff = Object.values(second).reduce((sum, value, i) => sum + value - Object.values(first)[i], 0);
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

  ipcMain.on('window:minimize', () => getMainWindow()?.minimize());
  ipcMain.on('window:maximize', () => {
    const win = getMainWindow();
    if (win) win.isMaximized() ? win.unmaximize() : win.maximize();
  });
  ipcMain.on('window:close', () => getMainWindow()?.close());
  ipcMain.handle('window:is-maximized', () => getMainWindow()?.isMaximized() ?? false);
  ipcMain.on('app:set-theme', (_event, theme) => getMainWindow()?.webContents.send('app:theme-changed', theme));

  ipcMain.on('app:notification', (_event, { title, body }) => {
    if (Notification.isSupported()) new Notification({ title, body }).show();
  });
  ipcMain.on('app:open-external', (_event, url) => {
    if (typeof url === 'string' && /^https?:\/\//.test(url)) shell.openExternal(url);
  });
  ipcMain.on('app:restart', () => { app.relaunch(); app.exit(0); });

  ipcMain.on('updater:install', () => require('electron-updater').autoUpdater.quitAndInstall());
  ipcMain.on('updater:check', () => {
    if (!IS_DEV) require('electron-updater').autoUpdater.checkForUpdatesAndNotify().catch((error) => log.error('[updater]', error.message));
  });
}

module.exports = { registerIpcHandlers };
