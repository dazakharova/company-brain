const { contextBridge } = require('electron');

// Expose only the information the renderer needs, never raw Electron APIs.
contextBridge.exposeInMainWorld('desktop', {
  electronVersion: process.versions.electron,
});
