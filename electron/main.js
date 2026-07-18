const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow

// ─── Resolve the correct icon for each platform ──────────────────────────────
function getIconPath() {
  // electron-builder copies buildResources (public/) into resources/public
  const base = isDev
    ? path.join(__dirname, '..', 'public')
    : path.join(process.resourcesPath, 'public')

  if (process.platform === 'win32') return path.join(base, 'icon.ico')
  return path.join(base, 'icon.png')
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#000000',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: true,
    icon: getIconPath(),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  })

  if (isDev) {
    // Dev: open to /app so Login page shows (not Download Hub)
    mainWindow.loadURL('http://localhost:3000/#/app')
    mainWindow.webContents.openDevTools()
  } else {
    // Production: load dist/index.html with hash #/app
    // This skips DownloadPage entirely — shows Login → full Chat
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'), {
      hash: '/app'
    })
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Required for ffmpeg.wasm — SharedArrayBuffer needs COOP/COEP headers
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Cross-Origin-Opener-Policy':   ['same-origin'],
        'Cross-Origin-Embedder-Policy': ['require-corp'],
      }
    })
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

ipcMain.handle('open-app', async (event, appName) => {
  return { success: false, message: 'Use URL schemes for app launching' }
})
