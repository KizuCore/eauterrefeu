import { app, BrowserWindow } from 'electron'
import path from 'path'
import { spawn, ChildProcess } from 'child_process'

let win: BrowserWindow | null = null
let apiProcess: ChildProcess | null = null
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

  // Fermer l'API quand la fenêtre se ferme
  win.on('closed', () => {
    win = null
    if (apiProcess) {
      apiProcess.kill()
      apiProcess = null
    }
  })
}

// Fonction pour lancer le backend Node
function startAPI() {
  const apiPath = isDev
    ? path.join(__dirname, '../../backend/server.cjs') // dev
    : path.join(process.resourcesPath, 'backend/server.cjs') // build

  apiProcess = spawn('node', [apiPath], {
    detached: true,
    stdio: 'ignore' // ou ['pipe','pipe','pipe'] si tu veux récupérer les logs
  })
}

app.whenReady().then(() => {
  startAPI() // Lancer le backend
  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})
