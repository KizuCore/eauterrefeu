import { app, BrowserWindow, session } from 'electron';
import path from 'path';
import { autoUpdater } from 'electron-updater';

let win: BrowserWindow | null = null;
const isDev = !app.isPackaged;

function createWindow() {
  // Optional: create a persistent session in a writable folder
  const ses = session.fromPartition('persist:myApp');

  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.mjs'), // preload path
      contextIsolation: true,
      nodeIntegration: false,
      session: ses, // use writable session to avoid cache errors
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173'); // Vite dev server
    win.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, '../renderer/index.html');
    win.loadFile(indexPath);
    // DevTools can be removed in production or left for debugging
    // win.webContents.openDevTools();
  }

  // Optional: remove Chromium autofill / password manager
  win.webContents.session.setUserAgent(win.webContents.session.getUserAgent() + ' MyApp');
}

app.whenReady().then(() => {
  createWindow();

  if (!isDev) {
    autoUpdater.checkForUpdatesAndNotify();
    autoUpdater.on('update-downloaded', () => {
      win?.webContents.send('updateReady');
    });
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
