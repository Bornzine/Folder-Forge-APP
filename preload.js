const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('folderForge', {
  pickFolder: () => ipcRenderer.invoke('pick-folder'),
  scanFolder: (path) => ipcRenderer.invoke('scan-folder', path)
});