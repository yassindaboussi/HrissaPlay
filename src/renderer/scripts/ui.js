// Window controls
document.getElementById('minimize-btn').onclick = () => {
  if (window.electron && window.electron.minimizeWindow) {
    window.electron.minimizeWindow();
  }
};

document.getElementById('maximize-btn').onclick = () => {
  if (window.electron && window.electron.maximizeWindow) {
    window.electron.maximizeWindow();
  }
};

document.getElementById('close-btn').onclick = () => {
  if (window.electron && window.electron.closeWindow) {
    window.electron.closeWindow();
  }
};

// Update maximize button icon based on window state
if (window.electron && window.electron.onWindowStateChange) {
  window.electron.onWindowStateChange((isMaximized) => {
    const icon = document.querySelector('#maximize-btn i');
    if (isMaximized) {
      icon.className = 'far fa-window-restore';
    } else {
      icon.className = 'far fa-square';
    }
  });
}

// Optional: Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Space bar to play/pause
  if (e.code === 'Space' && !e.target.matches('input, textarea, button')) {
    e.preventDefault();
    if (window.player) {
      if (window.player.isPlaying) {
        window.player.pause();
      } else {
        window.player.play();
      }
    }
  }
  
  // Escape to stop
  if (e.code === 'Escape' && !e.target.matches('input, textarea, button')) {
    if (window.player) {
      window.player.stop();
    }
  }
  
  // R to restart
  if (e.code === 'KeyR' && e.ctrlKey && !e.target.matches('input, textarea, button')) {
    e.preventDefault();
    if (window.player) {
      window.player.restart();
    }
  }
});

// Visualizer style switcher (optional - can add to settings)
function setVisualizerStyle(style) {
  if (window.audioVisualizer) {
    window.audioVisualizer.setStyle(style);
  }
}

// Export UI functions
window.setVisualizerStyle = setVisualizerStyle;