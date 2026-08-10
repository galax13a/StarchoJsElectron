'use strict';

const { BrowserWindow, screen, shell } = require('electron');
const path = require('path');
const log = require('electron-log');
const { IS_PROD, IS_DEV, DEVTOOLS } = require('./env');

let mainWindow = null;

function webPreferences() {
  return {
    preload: path.join(__dirname, '..', '..', 'preload.js'),
    contextIsolation: true,
    nodeIntegration: false,
    sandbox: IS_PROD,
    webSecurity: true,
    allowRunningInsecureContent: false,
    devTools: IS_DEV,
  };
}

function lockDown(win) {
  const contents = win.webContents;
  contents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });
  contents.setWindowOpenHandler(({ url }) => {
    if (IS_DEV && url.startsWith('chrome-devtools://')) return { action: 'allow' };
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  contents.on('will-redirect', (event, url) => {
    if (!url.startsWith('file://') && !url.startsWith('http://127.0.0.1')) event.preventDefault();
  });
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
  log.info(`Main window created [sandbox=${IS_PROD}, devTools=${IS_DEV}]`);
  return mainWindow;
}

function getMainWindow() { return mainWindow; }

module.exports = { createWindow, getMainWindow };
