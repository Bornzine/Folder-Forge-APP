const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: 'FolderForge',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  win.loadFile('index.html');
}

// Open the Windows folder picker
ipcMain.handle('pick-folder', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Choose a folder to scan'
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

// Read the contents of a folder recursively
ipcMain.handle('scan-folder', async (event, folderPath) => {
  function readDir(dir, depth = 0) {
    // Safety: don't go more than 4 levels deep on first scan
    if (depth > 4) return null;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const children = [];
      for (const entry of entries) {
        // Skip hidden files and system folders
        if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const sub = readDir(fullPath, depth + 1);
          children.push({
            id: 'real_' + Math.random().toString(36).slice(2, 11),
            name: entry.name,
            type: 'folder',
            realPath: fullPath,
            children: sub || []
          });
        } else if (entry.isFile()) {
          children.push({
            id: 'real_' + Math.random().toString(36).slice(2, 11),
            name: entry.name,
            type: 'file',
            realPath: fullPath
          });
        }
      }
      return children;
    } catch (err) {
      return [];
    }
  }

  const name = path.basename(folderPath);
  return {
    id: 'root',
    name: name + ' (real)',
    type: 'folder',
    realPath: folderPath,
    children: readDir(folderPath, 0) || []
  };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });