// Version Display Script
// Gets version from main process via IPC

class VersionDisplay {
  constructor() {
    this.init();
  }

  init() {
    // Request version from main process
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send('get-app-version');
      window.electron.ipcRenderer.on('app-version', (data) => {
        this.updateVersionDisplay(data.version);
      });
    } else {
      console.warn('IPC not available, using fallback version');
    }
  }

  updateVersionDisplay(version) {
    const versionElement = document.getElementById('version-display');
    if (versionElement) {
      versionElement.textContent = `v${version}`;
    }
  }
}

// Initialize version display
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new VersionDisplay();
  });
} else {
  new VersionDisplay();
}
