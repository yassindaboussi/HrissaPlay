// Update notification system
// Note: ipcRenderer is available globally through preload.js
const { ipcRenderer } = window.electron || {};

class UpdateManager {
  constructor() {
    this.updateState = 'idle'; // idle, available, downloading, downloaded, error
    this.updateData = null;
    
    // Check if ipcRenderer is available
    if (!ipcRenderer) {
      console.error('ipcRenderer not available');
      return;
    }
    
    this.init();
  }

  init() {
    this.createUpdateUI();
    this.setupIpcListeners();
  }

  createUpdateUI() {
    // Create update modal
    const updateModal = document.createElement('div');
    updateModal.id = 'update-modal';
    updateModal.innerHTML = `
      <style>
        #update-modal {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(5px);
          z-index: 10000;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.3s ease-out;
        }

        #update-modal.show {
          display: flex;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .update-container {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 16px;
          padding: 32px;
          width: 90%;
          max-width: 500px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          animation: slideUp 0.4s ease-out;
        }

        @keyframes slideUp {
          from {
            transform: translateY(30px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .update-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 20px;
        }

        .update-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, #ff3e6c, #ff6b8b);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 0 20px rgba(255, 62, 108, 0.3);
        }

        .update-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: #f0f0ff;
          margin: 0;
        }

        .update-subtitle {
          font-size: 0.85rem;
          color: #b0b0d0;
          margin: 4px 0 0 0;
        }

        .update-body {
          margin: 24px 0;
        }

        .update-version {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          margin-bottom: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .update-version label {
          color: #b0b0d0;
          font-size: 0.85rem;
          font-weight: 500;
        }

        .update-version span {
          color: #f0f0ff;
          font-weight: 600;
          font-family: 'Courier New', monospace;
        }

        .update-notes {
          max-height: 120px;
          overflow-y: auto;
          padding: 12px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          font-size: 0.85rem;
          color: #b0b0d0;
          line-height: 1.5;
          margin: 12px 0;
        }

        .update-progress {
          display: none;
          margin: 20px 0;
        }

        .update-progress.show {
          display: block;
        }

        .progress-bar-bg {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #ff3e6c, #ff6b8b);
          border-radius: 4px;
          width: 0%;
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(255, 62, 108, 0.5);
        }

        .progress-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          color: #b0b0d0;
          margin-top: 8px;
        }

        .progress-speed {
          color: #00ff9d;
          font-weight: 600;
        }

        .update-status {
          text-align: center;
          padding: 16px;
          border-radius: 8px;
          margin: 12px 0;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .status-downloading {
          background: rgba(0, 100, 200, 0.1);
          border: 1px solid rgba(0, 150, 255, 0.3);
          color: #00d4ff;
        }

        .status-ready {
          background: rgba(0, 255, 157, 0.1);
          border: 1px solid rgba(0, 255, 157, 0.3);
          color: #00ff9d;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }

        .status-error {
          background: rgba(255, 100, 107, 0.1);
          border: 1px solid rgba(255, 100, 107, 0.3);
          color: #ff6b6b;
        }

        .update-footer {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }

        .update-btn {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .btn-primary {
          background: linear-gradient(135deg, #ff3e6c, #ff6b8b);
          color: white;
          box-shadow: 0 4px 15px rgba(255, 62, 108, 0.3);
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(255, 62, 108, 0.4);
        }

        .btn-primary:active {
          transform: translateY(0);
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.1);
          color: #b0b0d0;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.15);
          color: #f0f0ff;
          border-color: rgba(255, 255, 255, 0.3);
        }

        .update-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          transform: none !important;
        }

        .spinner {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 62, 108, 0.3);
          border-top-color: #ff3e6c;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      </style>

      <div class="update-container">
        <div class="update-header">
          <div class="update-icon">📦</div>
          <div>
            <h2 class="update-title">Update Available</h2>
            <p class="update-subtitle">New version is ready to install</p>
          </div>
        </div>

        <div class="update-body">
          <div class="update-version">
            <label>Current Version</label>
            <span id="current-version">v1.0.0</span>
          </div>
          <div class="update-version">
            <label>New Version</label>
            <span id="new-version" style="color: #00ff9d;">v1.0.1</span>
          </div>

          <div id="update-notes" class="update-notes"></div>

          <div id="update-progress" class="update-progress">
            <div class="progress-bar-bg">
              <div id="progress-bar" class="progress-bar"></div>
            </div>
            <div class="progress-info">
              <span><span id="progress-percent">0</span>%</span>
              <span class="progress-speed"><span id="progress-speed">0</span> MB/s</span>
              <span><span id="progress-transferred">0</span> / <span id="progress-total">0</span> MB</span>
            </div>
          </div>

          <div id="update-status" class="update-status" style="display: none;"></div>
        </div>

        <div class="update-footer">
          <button id="skip-update" class="update-btn btn-secondary">Later</button>
          <button id="install-update" class="update-btn btn-primary">Update Now</button>
        </div>
      </div>
    `;

    document.body.appendChild(updateModal);

    // Event listeners
    document.getElementById('skip-update').addEventListener('click', () => {
      this.hideUpdate();
      if (ipcRenderer) {
        ipcRenderer.send('skip-update');
      }
    });

    document.getElementById('install-update').addEventListener('click', () => {
      this.installUpdate();
    });
  }

  setupIpcListeners() {
    if (!ipcRenderer) {
      console.warn('ipcRenderer not available, update notifications disabled');
      return;
    }

    // Update available
    ipcRenderer.on('update-available', (data) => {
      this.updateData = data;
      this.showAvailableUpdate(data);
    });

    // Download progress
    ipcRenderer.on('download-progress', (data) => {
      this.updateProgress(data);
    });

    // Update downloaded
    ipcRenderer.on('update-downloaded', (data) => {
      this.showReadyToInstall(data);
    });

    // Update error
    ipcRenderer.on('update-error', (data) => {
      this.showError(data);
    });

    // Update not available
    ipcRenderer.on('update-not-available', () => {
      console.log('No updates available');
    });
  }

  showAvailableUpdate(data) {
    document.getElementById('new-version').textContent = `v${data.version}`;
    const notesElement = document.getElementById('update-notes');
    notesElement.textContent = data.releaseNotes || 'New version available with improvements and bug fixes.';

    this.updateState = 'available';
    this.showUpdate();
  }

  updateProgress(data) {
    document.getElementById('update-progress').classList.add('show');
    document.getElementById('progress-bar').style.width = `${data.progress}%`;
    document.getElementById('progress-percent').textContent = data.progress;
    document.getElementById('progress-speed').textContent = data.speed;
    document.getElementById('progress-transferred').textContent = data.transferred;
    document.getElementById('progress-total').textContent = data.total;
  }

  showReadyToInstall(data) {
    this.updateState = 'downloaded';
    const statusEl = document.getElementById('update-status');
    statusEl.textContent = '✅ Update downloaded! Click "Update Now" to install.';
    statusEl.className = 'update-status show status-ready';
    
    const installBtn = document.getElementById('install-update');
    installBtn.innerHTML = 'Install & Restart';
    installBtn.disabled = false;
  }

  showError(data) {
    this.updateState = 'error';
    const statusEl = document.getElementById('update-status');
    statusEl.textContent = `❌ ${data.message}`;
    statusEl.className = 'update-status show status-error';
  }

  installUpdate() {
    const installBtn = document.getElementById('install-update');
    installBtn.innerHTML = '<span class="spinner"></span>Installing...';
    installBtn.disabled = true;
    if (ipcRenderer) {
      ipcRenderer.send('install-update');
    }
  }

  showUpdate() {
    document.getElementById('update-modal').classList.add('show');
  }

  hideUpdate() {
    document.getElementById('update-modal').classList.remove('show');
  }
}

// Initialize update manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.updateManager = new UpdateManager();
  });
} else {
  window.updateManager = new UpdateManager();
}
