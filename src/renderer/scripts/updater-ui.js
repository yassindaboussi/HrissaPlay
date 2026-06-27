// ── HrissaPlay Update Manager ─────────────────────────────────────────────────
// Auto-checks on startup (after 5s) and every 24h (handled in main process).
// Icon in titlebar is ALWAYS clickable:
//   • idle / up-to-date / error  → opens a small popover with "Check now" button
//   • available / downloading / downloaded → opens the full update modal
// ─────────────────────────────────────────────────────────────────────────────

const { ipcRenderer } = window.electron || {};

class UpdateManager {
  constructor() {
    // checking | up-to-date | available | downloading | downloaded | error
    this.state = 'checking';
    this.updateData = null;
    this._devTimer = null;
    this._toastTimer = null;

    if (!ipcRenderer) { console.error('[UpdateManager] ipcRenderer unavailable'); return; }

    this._injectStyles();
    this._buildPopover();
    this._buildToast();
    this._buildModal();
    this._bindIcon();
    this._listenIpc();
    this._setState('checking');

    // Show popover briefly on startup so the user discovers the icon
    // and understands they can click it to check manually.
    setTimeout(() => {
      this._openPopover();
      // Auto-close after 4s (unless user interacted with it)
      this._startupPopoverTimer = setTimeout(() => {
        if (!this._userOpenedPopover) this._closePopover();
      }, 4000);
    }, 1200); // slight delay so the UI is fully rendered first

    // Dev-mode fallback: if electron-updater skips silently, stop spinning after 10s
    this._devTimer = setTimeout(() => {
      if (this.state === 'checking') this._setState('up-to-date');
    }, 10000);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STATE MACHINE
  // ══════════════════════════════════════════════════════════════════════════

  _setState(state, tooltip) {
    this.state = state;
    const icon = document.getElementById('upd-icon');
    if (!icon) return;

    const map = {
      checking:    { cls: 'fa-rotate',           spin: true,  tip: 'Checking for updates…'         },
      'up-to-date':{ cls: 'fa-circle-check',     spin: false, tip: 'Up to date — click to check'   },
      available:   { cls: 'fa-circle-arrow-up',  spin: false, tip: 'Update available — click to see'},
      downloading: { cls: 'fa-circle-arrow-down',spin: true,  tip: 'Downloading update…'            },
      downloaded:  { cls: 'fa-bolt-lightning',   spin: false, tip: 'Ready to install — click!'      },
      error:       { cls: 'fa-circle-exclamation',spin:false, tip: 'Update check failed — click to retry'},
    };
    const cfg = map[state] || map.checking;

    icon.className = `fas ${cfg.cls}${cfg.spin ? ' upd-spin' : ''}`;
    const wrapper = document.getElementById('upd-icon-wrap');
    if (wrapper) {
      wrapper.className = `upd-wrap upd-${state}`;
      wrapper.title = tooltip || cfg.tip;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ICON — always clickable
  // ══════════════════════════════════════════════════════════════════════════

  _bindIcon() {
    const wrap = document.getElementById('upd-icon-wrap');
    if (!wrap) return;
    wrap.addEventListener('click', (e) => {
      e.stopPropagation();
      this._userOpenedPopover = true; // user clicked — don't auto-close the startup popover
      clearTimeout(this._startupPopoverTimer);
      if (this.state === 'available' || this.state === 'downloading' || this.state === 'downloaded') {
        this._closePopover();
        this._openModal();
      } else {
        // idle / up-to-date / checking / error → toggle popover
        const pop = document.getElementById('upd-popover');
        if (pop && pop.classList.contains('show')) {
          this._closePopover();
        } else {
          this._openPopover();
        }
      }
    });

    // Close popover when clicking outside
    document.addEventListener('click', () => this._closePopover());
  }

  // ══════════════════════════════════════════════════════════════════════════
  // POPOVER  (for idle / up-to-date / error states)
  // ══════════════════════════════════════════════════════════════════════════

  _buildPopover() {
    const pop = document.createElement('div');
    pop.id = 'upd-popover';
    pop.innerHTML = `
      <div class="pop-row">
        <span class="pop-dot" id="pop-dot"></span>
        <span class="pop-status" id="pop-status">Checking…</span>
      </div>
      <div class="pop-ver" id="pop-ver"></div>
      <button class="pop-btn" id="pop-check-btn">
        <i class="fas fa-rotate"></i> Check now
      </button>
      <p class="pop-hint">Click this icon anytime to check manually</p>
    `;
    document.body.appendChild(pop);

    document.getElementById('pop-check-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this._manualCheck();
    });

    // Prevent click-outside from immediately closing when opening
    pop.addEventListener('click', (e) => e.stopPropagation());
  }

  _openPopover() {
    const pop = document.getElementById('upd-popover');
    const wrap = document.getElementById('upd-icon-wrap');
    if (!pop || !wrap) return;

    // Position below the icon
    const rect = wrap.getBoundingClientRect();
    pop.style.top  = (rect.bottom + 6) + 'px';
    pop.style.left = Math.max(8, rect.left - 120) + 'px';

    // Fill content based on current state
    const dot    = document.getElementById('pop-dot');
    const status = document.getElementById('pop-status');
    const ver    = document.getElementById('pop-ver');
    const btn    = document.getElementById('pop-check-btn');

    const stateMap = {
      checking:    { dot: 'dot-checking', text: 'Checking for updates…', btnTxt: null },
      'up-to-date':{ dot: 'dot-ok',       text: 'You\'re up to date ✓',  btnTxt: '<i class="fas fa-rotate"></i> Check now' },
      error:       { dot: 'dot-error',    text: 'Check failed',          btnTxt: '<i class="fas fa-rotate"></i> Retry' },
      available:   { dot: 'dot-update',   text: 'Update available!',     btnTxt: '<i class="fas fa-circle-arrow-up"></i> See update' },
      downloading: { dot: 'dot-dl',       text: 'Downloading…',          btnTxt: null },
      downloaded:  { dot: 'dot-ok',       text: 'Ready to install!',     btnTxt: '<i class="fas fa-bolt-lightning"></i> Install now' },
    };
    const cfg = stateMap[this.state] || stateMap.checking;

    dot.className    = `pop-dot ${cfg.dot}`;
    status.textContent = cfg.text;
    ver.textContent  = this.updateData?.version ? `Current: v${this._currentVersion()} → v${this.updateData.version}` : `Current: ${this._currentVersion()}`;
    btn.innerHTML    = cfg.btnTxt || '<i class="fas fa-rotate"></i> Check now';
    btn.disabled     = this.state === 'checking' || this.state === 'downloading';

    pop.classList.add('show');
  }

  _closePopover() {
    document.getElementById('upd-popover')?.classList.remove('show');
  }

  _currentVersion() {
    return document.getElementById('version-display')?.textContent || 'v1.1.0';
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MANUAL CHECK
  // ══════════════════════════════════════════════════════════════════════════

  _manualCheck() {
    if (this.state === 'available' || this.state === 'downloading' || this.state === 'downloaded') {
      this._closePopover();
      this._openModal();
      return;
    }

    this._setState('checking');
    this._updatePopoverStatus('dot-checking', 'Checking…', null, true);
    ipcRenderer.send('check-for-updates');

    // Fallback: if main doesn't respond in 12s, go back to up-to-date
    clearTimeout(this._manualCheckTimer);
    this._manualCheckTimer = setTimeout(() => {
      if (this.state === 'checking') this._setState('up-to-date');
      this._updatePopoverStatus('dot-ok', 'You\'re up to date ✓', null, false);
    }, 12000);
  }

  _updatePopoverStatus(dotCls, text, btnHtml, btnDisabled) {
    const dot = document.getElementById('pop-dot');
    const status = document.getElementById('pop-status');
    const btn = document.getElementById('pop-check-btn');
    if (dot)    dot.className = `pop-dot ${dotCls}`;
    if (status) status.textContent = text;
    if (btn) {
      if (btnHtml !== null) btn.innerHTML = btnHtml;
      btn.disabled = btnDisabled;
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // TOAST
  // ══════════════════════════════════════════════════════════════════════════

  _buildToast() {
    const t = document.createElement('div');
    t.id = 'upd-toast';
    t.innerHTML = `
      <div class="toast-icon-box">📦</div>
      <div class="toast-body">
        <div class="toast-title" id="toast-title">Update Available</div>
        <div class="toast-sub"  id="toast-sub">Click to see what's new</div>
      </div>
      <button class="toast-x" id="toast-x"><i class="fas fa-times"></i></button>
    `;
    document.body.appendChild(t);

    t.addEventListener('click', (e) => {
      if (!e.target.closest('#toast-x')) { this._openModal(); this._hideToast(); }
    });
    document.getElementById('toast-x').addEventListener('click', (e) => {
      e.stopPropagation(); this._hideToast();
    });
  }

  _showToast(title, sub) {
    const el = document.getElementById('upd-toast');
    const titleEl = document.getElementById('toast-title');
    const subEl   = document.getElementById('toast-sub');
    if (titleEl) titleEl.textContent = title;
    if (subEl)   subEl.textContent   = sub;
    el?.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => this._hideToast(), 8000);
  }

  _hideToast() {
    document.getElementById('upd-toast')?.classList.remove('show');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MODAL  (update available / downloading / ready)
  // ══════════════════════════════════════════════════════════════════════════

  _buildModal() {
    const m = document.createElement('div');
    m.id = 'upd-modal';
    m.innerHTML = `
      <div class="upd-modal-box">
        <div class="upd-modal-header">
          <div class="upd-modal-icon">📦</div>
          <div>
            <h2 class="upd-modal-title" id="modal-title">Update Available</h2>
            <p class="upd-modal-sub"   id="modal-sub">A new version is ready</p>
          </div>
        </div>

        <div class="upd-ver-row">
          <label>Current</label><span id="modal-cur">v1.1.0</span>
        </div>
        <div class="upd-ver-row">
          <label>New version</label><span id="modal-new" class="ver-new">—</span>
        </div>

        <div id="modal-notes" class="upd-notes"></div>

        <div id="modal-prog" class="upd-prog">
          <div class="upd-track"><div class="upd-fill" id="modal-fill"></div></div>
          <div class="upd-prog-info">
            <span><span id="modal-pct">0</span>%</span>
            <span class="prog-spd"><span id="modal-spd">0</span> MB/s</span>
            <span><span id="modal-xfer">0</span> / <span id="modal-tot">0</span> MB</span>
          </div>
        </div>

        <div class="upd-banner" id="modal-banner"></div>

        <div class="upd-modal-footer">
          <button class="upd-btn upd-btn-sec" id="modal-later">Later</button>
          <button class="upd-btn upd-btn-pri" id="modal-action">Download &amp; Install</button>
        </div>
      </div>
    `;
    document.body.appendChild(m);

    document.getElementById('modal-later').addEventListener('click', () => {
      this._closeModal(); ipcRenderer?.send('skip-update');
    });
    document.getElementById('modal-action').addEventListener('click', () => this._doInstall());
  }

  _openModal() {
    const m = document.getElementById('upd-modal');
    if (!m) return;

    // Sync version labels
    document.getElementById('modal-cur').textContent = this._currentVersion();
    if (this.updateData?.version)
      document.getElementById('modal-new').textContent = `v${this.updateData.version}`;

    // Sync action button label
    const btn = document.getElementById('modal-action');
    if (btn) btn.textContent = this.state === 'downloaded' ? 'Install Now' : 'Download & Install';

    m.classList.add('show');
  }

  _closeModal() {
    document.getElementById('upd-modal')?.classList.remove('show');
  }

  _setBanner(type, text) {
    const el = document.getElementById('modal-banner');
    if (!el) return;
    el.textContent = text;
    el.className = `upd-banner show banner-${type}`;
  }

  _doInstall() {
    const btn = document.getElementById('modal-action');
    if (btn) { btn.innerHTML = '<span class="btn-spin"></span>Installing…'; btn.disabled = true; }
    ipcRenderer?.send('install-update');
  }

  // ══════════════════════════════════════════════════════════════════════════
  // IPC LISTENERS
  // ══════════════════════════════════════════════════════════════════════════

  _listenIpc() {
    ipcRenderer.on('update-available', (data) => {
      clearTimeout(this._devTimer);
      clearTimeout(this._manualCheckTimer);
      this.updateData = data;
      this._setState('available');

      const notesEl = document.getElementById('modal-notes');
      if (notesEl) notesEl.textContent = data.releaseNotes || 'Improvements and bug fixes.';
      document.getElementById('modal-new').textContent = `v${data.version}`;

      // Update popover if open
      this._updatePopoverStatus('dot-update', `v${data.version} available!`,
        '<i class="fas fa-circle-arrow-up"></i> See update', false);

      this._showToast('Update Available 🎉', `v${data.version} is ready to download`);
      // Auto-download starts 1s later in main
      this._setBanner('downloading', '⬇️ Downloading in background…');
    });

    ipcRenderer.on('download-progress', (data) => {
      clearTimeout(this._manualCheckTimer);
      this._setState('downloading');
      const prog = document.getElementById('modal-prog');
      if (prog) prog.classList.add('show');
      document.getElementById('modal-fill').style.width = `${data.progress}%`;
      document.getElementById('modal-pct').textContent  = data.progress;
      document.getElementById('modal-spd').textContent  = data.speed;
      document.getElementById('modal-xfer').textContent = data.transferred;
      document.getElementById('modal-tot').textContent  = data.total;
    });

    ipcRenderer.on('update-downloaded', (data) => {
      clearTimeout(this._manualCheckTimer);
      this._setState('downloaded');
      this._setBanner('ready', '✅ Downloaded! Click "Install Now" to apply.');
      const btn = document.getElementById('modal-action');
      if (btn) { btn.textContent = 'Install Now'; btn.disabled = false; }
      this._showToast('Ready to Install ⚡', `v${data.version} — click to restart`);
    });

    ipcRenderer.on('update-not-available', () => {
      clearTimeout(this._devTimer);
      clearTimeout(this._manualCheckTimer);
      this._setState('up-to-date');
      // Update popover if open
      this._updatePopoverStatus('dot-ok', 'You\'re up to date ✓',
        '<i class="fas fa-rotate"></i> Check now', false);
    });

    ipcRenderer.on('update-error', (data) => {
      clearTimeout(this._devTimer);
      clearTimeout(this._manualCheckTimer);
      this._setState('error');
      this._updatePopoverStatus('dot-error', `Failed: ${data?.message || 'unknown'}`,
        '<i class="fas fa-rotate"></i> Retry', false);
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  // STYLES
  // ══════════════════════════════════════════════════════════════════════════

  _injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
      /* ── Titlebar icon ─────────────────────────────────────── */
      .upd-wrap {
        display: inline-flex;
        align-items: center;
        vertical-align: middle;
        margin-left: 6px;
        cursor: pointer;
        padding: 2px 4px;
        border-radius: 4px;
        transition: background 0.2s, opacity 0.3s;
        -webkit-app-region: no-drag;
        position: relative;
      }
      .upd-wrap:hover { background: rgba(255,255,255,0.1); }
      .upd-wrap i { font-size: 0.62rem; transition: color 0.3s; }

      .upd-checking    { opacity: 0.4; color: #b0b0d0; }
      .upd-up-to-date  { opacity: 0.45; color: #00ff9d; }
      .upd-available   { opacity: 1; color: #ff3e6c; animation: upd-pulse 2s infinite; }
      .upd-downloading { opacity: 1; color: #00aaff; }
      .upd-downloaded  { opacity: 1; color: #00ff9d; animation: upd-pulse 1.5s infinite; }
      .upd-error       { opacity: 0.5; color: #ff6b6b; }

      @keyframes upd-pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
      @keyframes upd-spin  { to{transform:rotate(360deg)} }
      .upd-spin { animation: upd-spin 1.1s linear infinite; display:inline-block; }

      /* ── Popover ───────────────────────────────────────────── */
      #upd-popover {
        position: fixed;
        z-index: 9998;
        background: #12121f;
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 10px;
        padding: 14px 16px 12px;
        width: 210px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.6);
        opacity: 0;
        transform: translateY(-6px) scale(0.97);
        pointer-events: none;
        transition: opacity 0.18s, transform 0.18s;
      }
      #upd-popover.show {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: all;
      }
      .pop-row {
        display: flex;
        align-items: center;
        gap: 7px;
        margin-bottom: 4px;
      }
      .pop-dot {
        width: 7px; height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .dot-checking { background:#b0b0d0; animation:upd-pulse 1.2s infinite; }
      .dot-ok       { background:#00ff9d; }
      .dot-update   { background:#ff3e6c; animation:upd-pulse 1.5s infinite; }
      .dot-dl       { background:#00aaff; animation:upd-pulse 1s infinite; }
      .dot-error    { background:#ff6b6b; }

      .pop-status {
        font-size: 0.78rem;
        font-weight: 600;
        color: #f0f0ff;
      }
      .pop-ver {
        font-size: 0.68rem;
        color: #7070a0;
        margin-bottom: 10px;
        padding-left: 14px;
      }
      .pop-btn {
        width: 100%;
        padding: 7px 10px;
        background: linear-gradient(135deg, #ff3e6c, #ff6b8b);
        border: none;
        border-radius: 7px;
        color: #fff;
        font-size: 0.75rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        transition: opacity 0.2s, transform 0.15s;
        box-shadow: 0 3px 10px rgba(255,62,108,0.3);
      }
      .pop-btn:hover:not(:disabled) { opacity:0.88; transform:translateY(-1px); }
      .pop-btn:disabled { opacity:0.4; cursor:default; transform:none; }
      .pop-hint {
        text-align: center;
        font-size: 0.62rem;
        color: #505070;
        margin-top: 7px;
        margin-bottom: 0;
      }

      /* ── Toast ─────────────────────────────────────────────── */
      #upd-toast {
        position: fixed;
        top: 40px; right: 14px;
        z-index: 9999;
        background: #12121f;
        border: 1px solid rgba(255,62,108,0.3);
        border-radius: 10px;
        padding: 10px 12px;
        display: flex;
        align-items: center;
        gap: 10px;
        max-width: 250px;
        box-shadow: 0 10px 35px rgba(0,0,0,0.55);
        cursor: pointer;
        transform: translateX(115%);
        transition: transform 0.32s cubic-bezier(0.34,1.56,0.64,1);
      }
      #upd-toast.show { transform: translateX(0); }
      .toast-icon-box {
        width: 30px; height: 30px;
        background: linear-gradient(135deg,#ff3e6c,#ff6b8b);
        border-radius: 8px;
        display:flex; align-items:center; justify-content:center;
        font-size:14px; flex-shrink:0;
        box-shadow: 0 0 12px rgba(255,62,108,0.35);
      }
      .toast-body { flex:1; min-width:0; }
      .toast-title { font-size:0.78rem; font-weight:700; color:#f0f0ff; }
      .toast-sub   { font-size:0.68rem; color:#9090b0; }
      .toast-x {
        background:none; border:none; color:#5050a0; cursor:pointer;
        font-size:10px; padding:2px; line-height:1; flex-shrink:0;
      }
      .toast-x:hover { color:#f0f0ff; }

      /* ── Modal ─────────────────────────────────────────────── */
      #upd-modal {
        display:none; position:fixed; inset:0;
        background:rgba(0,0,0,0.82);
        backdrop-filter:blur(6px);
        z-index:10000;
        align-items:center; justify-content:center;
      }
      #upd-modal.show { display:flex; animation:upd-fadein 0.22s ease-out; }
      @keyframes upd-fadein { from{opacity:0} to{opacity:1} }

      .upd-modal-box {
        background: linear-gradient(135deg,#14142a,#0e1628);
        border-radius:16px;
        padding:26px 26px 22px;
        width:90%; max-width:440px;
        border:1px solid rgba(255,255,255,0.08);
        box-shadow:0 24px 64px rgba(0,0,0,0.65);
        animation: upd-slideup 0.3s cubic-bezier(0.34,1.56,0.64,1);
      }
      @keyframes upd-slideup {
        from{transform:translateY(22px);opacity:0}
        to  {transform:translateY(0);opacity:1}
      }
      .upd-modal-header { display:flex; align-items:center; gap:12px; margin-bottom:18px; }
      .upd-modal-icon {
        width:42px; height:42px;
        background:linear-gradient(135deg,#ff3e6c,#ff6b8b);
        border-radius:11px; display:flex; align-items:center;
        justify-content:center; font-size:20px; flex-shrink:0;
        box-shadow:0 0 18px rgba(255,62,108,0.3);
      }
      .upd-modal-title { font-size:1.15rem; font-weight:700; color:#f0f0ff; margin:0; }
      .upd-modal-sub   { font-size:0.77rem; color:#9090b0; margin:3px 0 0; }

      .upd-ver-row {
        display:flex; justify-content:space-between; align-items:center;
        padding:9px 12px;
        background:rgba(255,255,255,0.03);
        border-radius:7px; margin-bottom:6px;
        border:1px solid rgba(255,255,255,0.05);
      }
      .upd-ver-row label { color:#9090b0; font-size:0.77rem; }
      .upd-ver-row span  { color:#f0f0ff; font-weight:600; font-family:monospace; font-size:0.8rem; }
      .ver-new { color:#00ff9d !important; }

      .upd-notes {
        max-height:80px; overflow-y:auto;
        padding:9px 12px; margin-top:8px;
        background:rgba(0,0,0,0.2);
        border-radius:7px; border:1px solid rgba(255,255,255,0.04);
        font-size:0.77rem; color:#9090b0; line-height:1.5;
      }

      .upd-prog { display:none; margin-top:14px; }
      .upd-prog.show { display:block; }
      .upd-track {
        width:100%; height:5px;
        background:rgba(255,255,255,0.08);
        border-radius:3px; overflow:hidden; margin-bottom:5px;
      }
      .upd-fill {
        height:100%; width:0%;
        background:linear-gradient(90deg,#ff3e6c,#ff6b8b);
        border-radius:3px; transition:width 0.3s;
        box-shadow:0 0 8px rgba(255,62,108,0.5);
      }
      .upd-prog-info {
        display:flex; justify-content:space-between;
        font-size:0.68rem; color:#9090b0;
      }
      .prog-spd { color:#00ff9d; font-weight:600; }

      .upd-banner { display:none; padding:9px 12px; border-radius:7px; margin-top:10px; font-size:0.78rem; font-weight:500; }
      .upd-banner.show { display:block; }
      .banner-downloading { background:rgba(0,150,255,0.07); border:1px solid rgba(0,150,255,0.22); color:#00d4ff; }
      .banner-ready       { background:rgba(0,255,157,0.07); border:1px solid rgba(0,255,157,0.22); color:#00ff9d; animation:upd-pulse 2s infinite; }
      .banner-error       { background:rgba(255,100,107,0.07); border:1px solid rgba(255,100,107,0.22); color:#ff6b6b; }

      .upd-modal-footer { display:flex; gap:10px; margin-top:18px; }
      .upd-btn {
        flex:1; padding:10px 16px;
        border:none; border-radius:8px;
        font-size:0.85rem; font-weight:600;
        cursor:pointer; transition:all 0.18s;
      }
      .upd-btn-pri {
        background:linear-gradient(135deg,#ff3e6c,#ff6b8b);
        color:#fff; box-shadow:0 4px 14px rgba(255,62,108,0.28);
      }
      .upd-btn-pri:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 6px 20px rgba(255,62,108,0.38); }
      .upd-btn-sec {
        background:rgba(255,255,255,0.06);
        color:#9090b0; border:1px solid rgba(255,255,255,0.1);
      }
      .upd-btn-sec:hover:not(:disabled) { background:rgba(255,255,255,0.1); color:#f0f0ff; }
      .upd-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none !important; }
      .btn-spin {
        display:inline-block; width:10px; height:10px;
        border:2px solid rgba(255,255,255,0.3);
        border-top-color:#fff; border-radius:50%;
        animation:upd-spin 0.7s linear infinite;
        margin-right:6px; vertical-align:middle;
      }
    `;
    document.head.appendChild(s);
  }
}

// Boot
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { window.updateManager = new UpdateManager(); });
} else {
  window.updateManager = new UpdateManager();
}
