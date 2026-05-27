class Player {
  constructor() {
    this.audio = document.getElementById('audio');
    this.nowPlaying = document.getElementById('now-playing');
    this.currentLogo = document.getElementById('current-logo');
    this.playBtn = document.getElementById('play-btn');
    this.pauseBtn = document.getElementById('pause-btn');
    this.stopBtn = document.getElementById('stop-btn');
    this.restartBtn = document.getElementById('restart-btn');
    this.statusIndicator = document.getElementById('status-indicator');
    
    this.currentStation = null;
    this.isPlaying = false;
    this.isConnected = false;
    this.isLoading = false;
    
    this.init();
  }

  init() {
    // Setup control buttons
    this.playBtn.onclick = () => this.play();
    this.pauseBtn.onclick = () => this.pause();
    this.stopBtn.onclick = () => this.stop();
    this.restartBtn.onclick = () => this.restart();

    // Volume control
    this.volumeSlider = document.getElementById('volume-slider');
    this.volumeFill   = document.getElementById('volume-fill');
    this.volumePct    = document.getElementById('volume-pct');
    this.muteBtn      = document.getElementById('mute-btn');
    this.volumeIcon   = document.getElementById('volume-icon');
    this._prevVolume  = 80;
    this.audio.volume = 0.8;
    this._updateVolumeUI(80);

    this.volumeSlider.addEventListener('input', () => {
      const v = parseInt(this.volumeSlider.value, 10);
      this.audio.volume = v / 100;
      this.audio.muted  = false;
      this.muteBtn.classList.remove('muted');
      this._prevVolume = v > 0 ? v : this._prevVolume;
      this._updateVolumeUI(v);
    });

    this.muteBtn.onclick = () => {
      if (this.audio.muted || parseInt(this.volumeSlider.value) === 0) {
        // Unmute
        const restore = this._prevVolume || 80;
        this.audio.muted  = false;
        this.audio.volume = restore / 100;
        this.volumeSlider.value = restore;
        this.muteBtn.classList.remove('muted');
        this._updateVolumeUI(restore);
      } else {
        // Mute
        this._prevVolume = parseInt(this.volumeSlider.value) || 80;
        this.audio.muted = true;
        this.volumeSlider.value = 0;
        this.muteBtn.classList.add('muted');
        this._updateVolumeUI(0);
      }
    };
    
    // Audio event listeners
    this.audio.addEventListener('playing', () => {
      this.isPlaying = true;
      this.isConnected = true;
      this.updateStatus();
      if (window.audioVisualizer) {
        window.audioVisualizer.connectToAudio(this.audio);
        window.audioVisualizer.start();
      }
    });

    this.audio.addEventListener('pause', () => {
      this.isPlaying = false;
      this.updateStatus();
      if (window.audioVisualizer) {
        window.audioVisualizer.stop();
      }
    });

    this.audio.addEventListener('error', () => {
      this.isConnected = false;
      this.updateStatus();
    });

    this.audio.addEventListener('stalled', () => {
      this.isConnected = false;
      this.updateStatus();
    });

    this.audio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.updateStatus();
    });
  }

  updateStatus() {
    const statusText = document.getElementById('status-text');
    if (this.isLoading) {
      this.statusIndicator.className = 'status-indicator loading';
      statusText.textContent = 'جاري التحميل...';
    } else if (this.isConnected && this.isPlaying) {
      this.statusIndicator.className = 'status-indicator connected';
      statusText.textContent = 'يُبث مباشرة';
    } else if (!this.isConnected && this.currentStation) {
      this.statusIndicator.className = 'status-indicator error';
      statusText.textContent = 'خطأ في الاتصال';
    } else {
      this.statusIndicator.className = 'status-indicator';
      statusText.textContent = 'موقوف';
    }
  }

  playStation(station) {
   // Remove active class from all cards
  document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
  
  // Find and activate the clicked card
  const cards = document.querySelectorAll('.card');
  window.stationsData.forEach((st, index) => {
    if (st.name === station.name) {
      cards[index].classList.add('active');
    }
  });
  
  // Update current station
  this.currentStation = station;
  
  // Update player info
  this.nowPlaying.innerHTML = `<span>${station.name}</span>`;
  
  // Update logo - improved version
  if (station.logo) {
    const initials = station.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    
    this.currentLogo.innerHTML = `
      <img src="${station.logo}" alt="${station.name}" 
           onload="this.style.opacity='1'"
           onerror="
             this.style.display='none';
             const placeholder = document.getElementById('current-logo-placeholder');
             if (placeholder) placeholder.style.display='flex';
           "
           style="opacity:0; transition: opacity 0.3s; background: white;">
      <div id="current-logo-placeholder" class="current-logo-placeholder">
        <span>${initials}</span>
      </div>`;
  } else {
    const initials = station.name.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
    this.currentLogo.innerHTML = `
      <div class="current-logo-placeholder" style="display:flex;">
        <span>${initials}</span>
      </div>`;
  }
    
    // Stop current audio
    this.audio.pause();
    this.isPlaying = false;
    this.isConnected = false;
    this.isLoading = true;
    this.playBtn.style.display = 'flex';
    this.pauseBtn.style.display = 'none';
    this.updateStatus();
    
    // Set new source and play
    this.audio.src = station.url;
    this.audio.play()
      .then(() => {
        this.isPlaying = true;
        this.isConnected = true;
        this.isLoading = false;
        this.playBtn.style.display = 'none';
        this.pauseBtn.style.display = 'flex';
        this.updateStatus();
        this.updateTrayTitle();
      })
      .catch(e => {
        console.error('Error playing station:', e);
        this.isLoading = false;
        this.nowPlaying.innerHTML = `خطأ في الاتصال: <span>${station.name}</span>`;
        this.statusIndicator.className = 'status-indicator error';
        this.updateStatus();
      });
  }

  play() {
    if (this.currentStation) {
      this.audio.play()
        .then(() => {
          this.isPlaying = true;
          this.isConnected = true;
          this.playBtn.style.display = 'none';
          this.pauseBtn.style.display = 'flex';
          this.updateStatus();
          this.updateTrayTitle();
        })
        .catch(e => {
          console.error('Error playing:', e);
          this.statusIndicator.className = 'status-indicator error';
        });
    } else {
      this.showNotification('الرجاء اختيار محطة راديو أولاً');
    }
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    this.playBtn.style.display = 'flex';
    this.pauseBtn.style.display = 'none';
    this.updateStatus();
    this.updateTrayTitle();
  }

stop() {
  this.audio.pause();
  this.audio.currentTime = 0;
  this.isPlaying = false;
  this.isConnected = false;
  this.isLoading = false;
  this.playBtn.style.display = 'flex';
  this.pauseBtn.style.display = 'none';
  this.nowPlaying.innerHTML = 'اختر محطة راديو';
  
  // Update status text to Arabic
  document.getElementById('status-text').textContent = 'جاهز';
  
  // Show radio icon placeholder instead of initials
  this.currentLogo.innerHTML = `
    <div class="current-logo-placeholder" style="display:flex;">
      <i class="fas fa-radio" style="color: var(--text-secondary); font-size: 1.2rem;"></i>
    </div>`;
  
  document.querySelectorAll('.card').forEach(c => c.classList.remove('active'));
  this.currentStation = null;
  this.updateStatus();
  this.updateTrayTitle();
}

  restart() {
    if (this.currentStation) {
      // Set loading state
      this.isLoading = true;
      this.isConnected = false;
      this.isPlaying = false;
      this.updateStatus();
      
      // Force reload the stream
      const tempSrc = this.audio.src;
      this.audio.pause();
      this.audio.src = '';
      
      // Add timestamp to prevent caching
      setTimeout(() => {
        this.audio.src = tempSrc.split('?')[0] + '?t=' + new Date().getTime();
        
        this.audio.play()
          .then(() => {
            this.isLoading = false;
            this.isPlaying = true;
            this.isConnected = true;
            this.playBtn.style.display = 'none';
            this.pauseBtn.style.display = 'flex';
            this.updateStatus();
            this.nowPlaying.innerHTML = `<span>${this.currentStation.name}</span>`;
            this.updateTrayTitle();
          })
          .catch(e => {
            console.error('Error restarting:', e);
            this.isLoading = false;
            this.isConnected = false;
            this.updateStatus();
            // Try original URL if timestamp fails
            this.audio.src = this.currentStation.url;
          });
      }, 100);
    }
  }

  updateTrayTitle() {
    if (this.currentStation && this.isPlaying) {
      document.title = `▶ ${this.currentStation.name} - HrissaPlay`;
      if (window.electron && window.electron.updateTrayTitle) {
        window.electron.updateTrayTitle(`Playing: ${this.currentStation.name}`);
      }
    } else {
      document.title = 'HrissaPlay - Tunisian Radios';
      if (window.electron && window.electron.updateTrayTitle) {
        window.electron.updateTrayTitle('HrissaPlay');
      }
    }
  }

  _updateVolumeUI(v) {
    // fill bar
    this.volumeFill.style.width = v + '%';

    // move thumb via CSS custom property
    this.volumeFill.closest('.volume-slider-wrap').style.setProperty('--thumb-left', v + '%');

    // percentage label + color class
    this.volumePct.textContent = v + '%';
    this.volumePct.className = 'volume-pct';
    if (v === 0)       this.volumePct.classList.add('muted');
    else if (v < 35)   this.volumePct.classList.add('low');
    else if (v < 70)   this.volumePct.classList.add('mid');
    else               this.volumePct.classList.add('loud');

    // icon
    const icon = this.volumeIcon;
    icon.className = 'fas';
    if (v === 0)      icon.classList.add('fa-volume-mute');
    else if (v < 40)  icon.classList.add('fa-volume-off');
    else if (v < 75)  icon.classList.add('fa-volume-down');
    else              icon.classList.add('fa-volume-up');
  }

    showNotification(message) {
    // Simple notification system
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 60px;
      left: 50%;
      transform: translateX(-50%);
      background: #1A1A28;
      color: var(--text-primary);
      padding: 12px 24px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      box-shadow: var(--shadow-lg);
      z-index: 10000;
      font-size: 0.9rem;
      font-weight: 500;
      animation: slideDown 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 2500);
  }
}

// Add notification animations
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
  
  @keyframes slideUp {
    from {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
    to {
      opacity: 0;
      transform: translateX(-50%) translateY(-20px);
    }
  }
`;
document.head.appendChild(notificationStyles);

// Create and export player instance
const player = new Player();
window.playStation = (station) => player.playStation(station);
window.player = player;