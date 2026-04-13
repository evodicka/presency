import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { loadData, saveData } from './persistence'

function getDataPath(): string {
  return join(app.getPath('userData'), 'presence-data.json')
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1280,
    minHeight: 800,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  ipcMain.handle('load-data', async () => {
    return loadData(getDataPath())
  })

  ipcMain.handle('save-data', async (_event, data: Record<string, string>) => {
    await saveData(getDataPath(), data)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
