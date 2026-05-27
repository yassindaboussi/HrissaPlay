const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const { setupAutoUpdater, stopAutoUpdater } = require('./auto-updater');

let mainWindow;
let tray = null;

function createWindow() {
  // Get version from package.json
  const packageJson = require('../../package.json');
  const version = packageJson.version;
  const windowTitle = `HrissaPlay v${version} - Tunisian Radios`;

  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 275,
    minHeight: 365,
    title: windowTitle,
    frame: false,
    titleBarStyle: 'hidden',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/preload.js')
    },
    icon: path.join(__dirname, '../../public/icons/icon.png'),
    backgroundColor: '#0a0a0f',
    show: false
  });

  // Remove default menu
  mainWindow.removeMenu();

  mainWindow.loadFile(path.join(__dirname, '../../public/index.html'));

  // Create tray icon
  createTray();

  // Setup auto-updater
  setupAutoUpdater(mainWindow);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window maximize/restore
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-state-changed', true);
  });

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-state-changed', false);
  });

  // Open DevTools in dev mode
  if (process.argv.includes('--enable-logging')) {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow.webContents.openDevTools({ mode: 'detach' });
      console.log('DevTools opened (dev mode)');
    });
  }
}

function createTray() {
  // Create tray icon
  const iconPath = path.join(__dirname, '../../public/icons/tray-icon.png');
  let trayIcon;
  
  try {
    trayIcon = nativeImage.createFromPath(iconPath)
  if (!trayIcon.isEmpty()) { console.log('Icon loaded') };
    if (trayIcon.isEmpty()) {
      trayIcon = nativeImage.createFromPath(path.join(__dirname, '../../public/icons/icon.png'));
    }
  } catch (err) {
    console.log('Using default tray icon');
    trayIcon = nativeImage.createFromPath(path.join(__dirname, '../../public/icons/icon.png'));
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('HrissaPlay - Tunisian Radios');

  // Simplified tray menu (removed Play/Pause, Next Station)
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);

  // Double click to show/hide window
  tray.on('double-click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
}

// IPC handlers
ipcMain.on('minimize-window', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('maximize-window', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('close-window', () => {
  if (mainWindow) mainWindow.hide();
});

ipcMain.on('update-tray-title', (event, title) => {
  if (tray) {
    tray.setToolTip(title);
  }
});

// Handle version request from renderer
ipcMain.on('get-app-version', (event) => {
  const packageJson = require('../../package.json');
  event.reply('app-version', { version: packageJson.version });
});

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Prevent app from quitting when all windows are closed
app.on('window-all-closed', (event) => {
  event.preventDefault();
});

// Handle certificate errors
app.commandLine.appendSwitch('ignore-certificate-errors');

// Cleanup on quit
app.on('before-quit', () => {
  stopAutoUpdater();
  if (tray) {
    tray.destroy();
  }
});