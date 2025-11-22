const { app, BrowserWindow } = require('electron');
const path = require('path');
// Prefer environment-based detection to avoid loading ESM-only modules during tests
const isDev = (process.env.ELECTRON_IS_DEV === 'true') || (process.env.NODE_ENV === 'development');

function getStartUrl() {
  return isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'build/index.html')}`;
}

async function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  const startUrl = getStartUrl();

  await mainWindow.loadURL(startUrl);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

if (app && typeof app.whenReady === 'function') {
  app.whenReady().then(createWindow);

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
}

module.exports = { getStartUrl };