class WaveVisualizer {
  constructor() {
    this.waveVisualizer = document.getElementById('wave-visualizer');
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.dataArray = null;
    this.animationId = null;
    this.bars = [];
    this.isActive = false;
    
    this.init();
  }

  init() {
    // Create a container for centered bars
    this.barsContainer = document.createElement('div');
    this.barsContainer.style.display = 'flex';
    this.barsContainer.style.alignItems = 'flex-end';
    this.barsContainer.style.justifyContent = 'center';
    this.barsContainer.style.gap = '2px';
    this.barsContainer.style.height = '100%';
    this.barsContainer.style.width = '100%';
    this.waveVisualizer.appendChild(this.barsContainer);
    
    // Create wave bars
    for (let i = 0; i < 40; i++) {
      const bar = document.createElement('div');
      bar.className = 'wave-bar';
      bar.style.height = '10px';
      bar.style.position = 'relative';
      bar.style.left = '0';
      bar.style.bottom = '0';
      this.barsContainer.appendChild(bar);
      this.bars.push(bar);
    }
  }

  connectToAudio(audioElement) {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.analyser = this.audioContext.createAnalyser();
      this.source = this.audioContext.createMediaElementSource(audioElement);
      this.source.connect(this.analyser);
      this.analyser.connect(this.audioContext.destination);
      this.analyser.fftSize = 128;
      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    }
  }

  start() {
    this.isActive = true;
    this.update();
  }

  stop() {
    this.isActive = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    
    // Reset bars to minimal height
    this.bars.forEach(bar => {
      bar.style.height = '10px';
      bar.style.opacity = '0.3';
    });
  }

  update() {
    if (!this.isActive || !this.analyser) {
      return;
    }

    this.analyser.getByteFrequencyData(this.dataArray);
    
    // Create smooth wave effect
    for (let i = 0; i < this.bars.length; i++) {
      const value = this.dataArray[Math.floor(i * 1.5)] || 0;
      
      // Create wave pattern
      const waveHeight = 10 + (value / 255) * 25;
      const waveOffset = Math.sin(i * 0.3 + Date.now() * 0.005) * 5;
      
      this.bars[i].style.height = `${waveHeight + waveOffset}px`;
      this.bars[i].style.opacity = 0.5 + (value / 255) * 0.5;
      
      // Color variation based on frequency
      const hue = 340 + (value / 255) * 20;
      this.bars[i].style.background = `linear-gradient(to top, 
        hsl(${hue}, 100%, 65%), 
        hsl(${hue + 20}, 100%, 75%))`;
    }
    
    this.animationId = requestAnimationFrame(() => this.update());
  }

  // Alternative visualizer style - Equalizer
  createEqualizer() {
    this.waveVisualizer.innerHTML = '';
    this.bars = [];
    
    this.barsContainer = document.createElement('div');
    this.barsContainer.style.display = 'flex';
    this.barsContainer.style.alignItems = 'flex-end';
    this.barsContainer.style.justifyContent = 'center';
    this.barsContainer.style.gap = '2px';
    this.barsContainer.style.height = '100%';
    this.barsContainer.style.width = '100%';
    this.waveVisualizer.appendChild(this.barsContainer);
    
    for (let i = 0; i < 20; i++) {
      const bar = document.createElement('div');
      bar.className = 'equalizer-bar';
      bar.style.height = '10px';
      this.barsContainer.appendChild(bar);
      this.bars.push(bar);
    }
  }

  // Alternative visualizer style - Spectrum
  createSpectrum() {
    this.waveVisualizer.innerHTML = '';
    this.bars = [];
    
    this.barsContainer = document.createElement('div');
    this.barsContainer.style.display = 'flex';
    this.barsContainer.style.alignItems = 'center';
    this.barsContainer.style.justifyContent = 'center';
    this.barsContainer.style.gap = '1px';
    this.barsContainer.style.height = '100%';
    this.barsContainer.style.width = '100%';
    this.waveVisualizer.appendChild(this.barsContainer);
    
    for (let i = 0; i < 60; i++) {
      const dot = document.createElement('div');
      dot.className = 'spectrum-dot';
      this.barsContainer.appendChild(dot);
      this.bars.push(dot);
    }
  }

  // Switch between visualizer styles
  setStyle(style = 'wave') {
    this.stop();
    
    switch(style) {
      case 'equalizer':
        this.createEqualizer();
        break;
      case 'spectrum':
        this.createSpectrum();
        break;
      case 'wave':
      default:
        this.waveVisualizer.innerHTML = '';
        this.bars = [];
        this.init();
        break;
    }
  }
}

// Create and export visualizer instance
const visualizer = new WaveVisualizer();
window.audioVisualizer = visualizer;