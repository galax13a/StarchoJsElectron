'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Server
  getServerPort: () => ipcRenderer.invoke('app:get-server-port'),

  // App info
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  getPaths:   () => ipcRenderer.invoke('app:get-paths'),
  createBackup: () => ipcRenderer.invoke('data:create-backup'),

  // App restart
  restart: () => ipcRenderer.send('app:restart'),

  // Encrypted auth session (falls back to a short-lived in-memory/local
  // session only when the operating system key store is unavailable).
  getAuthSession:    () => ipcRenderer.invoke('auth:get-session'),
  setAuthSession:    (session) => ipcRenderer.invoke('auth:set-session', session),
  clearAuthSession:  () => ipcRenderer.invoke('auth:clear-session'),

  // Window controls
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close:    () => ipcRenderer.send('window:close'),
  isMaximized: () => ipcRenderer.invoke('window:is-maximized'),

  // Theme
  setTheme: (theme) => ipcRenderer.send('app:set-theme', theme),

  // System notification
  showNotification: (title, body) =>
    ipcRenderer.send('app:notification', { title, body }),

  // Updater events (main → renderer)
  onCheckingForUpdate:    (cb) => ipcRenderer.on('updater:checking',              ()       => cb()),
  onUpdateAvailable:      (cb) => ipcRenderer.on('updater:update-available',      (_, i)   => cb(i)),
  onUpdateNotAvailable:   (cb) => ipcRenderer.on('updater:update-not-available',  (_, i)   => cb(i)),
  onUpdateProgress:       (cb) => ipcRenderer.on('updater:download-progress',     (_, p)   => cb(p)),
  onUpdateDownloaded:     (cb) => ipcRenderer.on('updater:update-downloaded',     (_, i)   => cb(i)),
  onUpdaterError:         (cb) => ipcRenderer.on('updater:error',                 (_, msg) => cb(msg)),
  installUpdate:          ()   => ipcRenderer.send('updater:install'),
  checkForUpdates:        ()   => ipcRenderer.send('updater:check'),

  // Open external links
  openExternal: (url) => ipcRenderer.send('app:open-external', url),

  // System performance stats (CPU, RAM)
  getSystemStats: () => ipcRenderer.invoke('system:stats'),

  // Dev mode detection
  isDev: () => ipcRenderer.invoke('app:is-dev'),

  // Error log (dev only)
  logError: (msg) => ipcRenderer.send('log:write', msg),
  readLog:  ()    => ipcRenderer.invoke('log:read'),
  clearLog: ()    => ipcRenderer.invoke('log:clear'),

});
