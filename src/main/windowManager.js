'use strict';

const { BrowserWindow, screen, shell } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');
const log = require('electron-log');
const { IS_DEV, DEVTOOLS } = require('./env');

let mainWindow = null;

function webPreferences() {
  return {
    preload: path.join(__dirname, '..', '..', 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    // Keep the renderer sandboxed in development and production. The preload
    // exposes the small, explicit API the UI needs.
    sandbox: true,
    webSecurity: true,
    allowRunningInsecureContent: false,
    devTools: IS_DEV,
  };
}

function lockDown(win) {
  const contents = win.webContents;
  const allowedDocument = pathToFileURL(path.join(__dirname, '..', 'renderer', 'index.html')).href;
  const isAllowedDocument = (url) => url === allowedDocument || url.startsWith(`${allowedDocument}#`);
  contents.on('will-navigate', (event, url) => {
    if (!isAllowedDocument(url)) event.preventDefault();
  });
  contents.setWindowOpenHandler(({ url }) => {
    if (IS_DEV && url.startsWith('chrome-devtools://')) return { action: 'allow' };
    // Only HTTPS links may leave the application. HTTP and custom protocols
    // are rejected so a renderer injection cannot launch arbitrary handlers.
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  contents.on('will-redirect', (event, url) => {
    if (!isAllowedDocument(url)) event.preventDefault();
  });
  contents.on('will-attach-webview', (event) => event.preventDefault());
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: Math.min(1400, width - 80),
    height: Math.min(900, height - 80),
    minWidth: 960,
    minHeight: 620,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#0A0A0A',
    show: false,
    webPreferences: webPreferences(),
    icon: path.join(__dirname, '..', '..', 'assets', 'icons', 'icon.png'),
  });
  mainWindow.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  if (DEVTOOLS) mainWindow.webContents.once('did-finish-load', () => mainWindow.webContents.openDevTools({ mode: 'detach' }));
  if (IS_DEV) {
    mainWindow.webContents.on('before-input-event', (_event, input) => {
      if (input.type === 'keyDown' && input.key === 'F12') {
        mainWindow.webContents.isDevToolsOpened() ? mainWindow.webContents.closeDevTools() : mainWindow.webContents.openDevTools({ mode: 'detach' });
      }
    });
  }
  lockDown(mainWindow);
  mainWindow.once('ready-to-show', () => { mainWindow.maximize(); mainWindow.show(); });
  mainWindow.on('maximize', () => mainWindow.webContents.send('window:maximized', true));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window:maximized', false));
  mainWindow.on('closed', () => { mainWindow = null; });
  log.info(`Main window created [sandbox=true, devTools=${IS_DEV}]`);
  return mainWindow;
}

function getMainWindow() { return mainWindow; }

module.exports = { createWindow, getMainWindow };
