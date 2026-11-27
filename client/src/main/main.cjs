const { app, BrowserWindow } = require('electron');
const path = require('node:path');

async function createWindow() {
  const window = new BrowserWindow({
    title: 'Company Brain',
    width: 1120,
    height: 760,
    minWidth: 640,
    minHeight: 480,
    backgroundColor: '#fff',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  // Keep this window on the local application and reject popup windows.
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.once('ready-to-show', () => window.show());

  await window.loadFile(path.join(__dirname, '../renderer/index.html'));

  if (process.argv.includes('--dev')) {
    window.webContents.openDevTools();
  }
}

function handleStartupError(error) {
  console.error('Could not start the Company Brain client:', error);
  app.exit(1);
}

app.whenReady().then(() => {
  app.setName('Company Brain');
  createWindow().catch(handleStartupError);

  // macOS keeps the application running after its last window closes.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch(handleStartupError);
    }
  });
}).catch(handleStartupError);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
