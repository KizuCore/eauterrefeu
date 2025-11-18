import { app, BrowserWindow } from 'electron'
import path from 'path'


let win: BrowserWindow | null = null
const isDev = !app.isPackaged

function createWindow() {
  const preloadPath = path.join(__dirname, '../preload/preload.js')

  win = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools()
  } else {
    win.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
})
