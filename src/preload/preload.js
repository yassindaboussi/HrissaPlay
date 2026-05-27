const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  updateTrayTitle: (title) => ipcRenderer.send('update-tray-title', title),
  
  // Expose ipcRenderer methods for update notifications
  ipcRenderer: {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, callback) => ipcRenderer.on(channel, (event, data) => callback(data)),
    once: (channel, callback) => ipcRenderer.once(channel, (event, data) => callback(data)),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel)
  },
  
  onWindowStateChange: (callback) => {
    ipcRenderer.on('window-state-changed', (event, isMaximized) => {
      callback(isMaximized);
    });
  }
});