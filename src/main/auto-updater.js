const { ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Configure logger
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// Update check interval (24 hours)
const UPDATE_CHECK_INTERVAL = 24 * 60 * 60 * 1000;

let updateCheckInterval;
let mainWindow;

function setupAutoUpdater(win) {
  mainWindow = win;

  // Check for updates on startup (after 5 seconds)
  setTimeout(() => {
    checkForUpdates();
  }, 5000);

  // Set up periodic update checks
  updateCheckInterval = setInterval(() => {
    checkForUpdates();
  }, UPDATE_CHECK_INTERVAL);

  // Update available
  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info);
    mainWindow.webContents.send('update-available', {
      version: info.version,
      releaseDate: info.releaseDate,
      releaseNotes: info.releaseNotes
    });

    // Auto-download in background
    setTimeout(() => {
      autoUpdater.downloadUpdate();
    }, 1000);
  });

  // Update not available
  autoUpdater.on('update-not-available', () => {
    log.info('No updates available');
    mainWindow.webContents.send('update-not-available');
  });

  // Download progress
  autoUpdater.on('download-progress', (progressObj) => {
    const progress = Math.round((progressObj.transferred / progressObj.total) * 100);
    mainWindow.webContents.send('download-progress', {
      progress: progress,
      speed: (progressObj.bytesPerSecond / 1024 / 1024).toFixed(2), // MB/s
      transferred: (progressObj.transferred / 1024 / 1024).toFixed(2), // MB
      total: (progressObj.total / 1024 / 1024).toFixed(2) // MB
    });
  });

  // Update downloaded and ready to install
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info);
    mainWindow.webContents.send('update-downloaded', {
      version: info.version
    });

    // Auto-install after 10 seconds
    setTimeout(() => {
      autoUpdater.quitAndInstall();
    }, 10000);
  });

  // Error
  autoUpdater.on('error', (err) => {
    log.error('Update error:', err);
    mainWindow.webContents.send('update-error', {
      message: err.message || 'Failed to check for updates'
    });
  });

  // IPC handlers
  ipcMain.on('check-for-updates', () => {
    checkForUpdates();
  });

  ipcMain.on('skip-update', () => {
    log.info('Update skipped by user');
  });

  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.on('download-update', () => {
    autoUpdater.downloadUpdate();
  });
}

function checkForUpdates() {
  log.info('Checking for updates...');
  autoUpdater.checkForUpdates();
}

function stopAutoUpdater() {
  if (updateCheckInterval) {
    clearInterval(updateCheckInterval);
  }
}

module.exports = {
  setupAutoUpdater,
  stopAutoUpdater
};
