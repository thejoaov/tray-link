import { registerMainModules } from '@tray-link/rn-electron-modules'
import { app, BrowserWindow, protocol } from 'electron'
import started from 'electron-squirrel-startup'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { MainModules } from '../modules/mainRegistry'
import { LocalServer } from './LocalServer'
import TrayGenerator from './TrayGenerator'

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string
declare const MAIN_WINDOW_VITE_NAME: string

const ELECTRON_WEB_DEV_SERVER_URL = 'http://localhost:8081'

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (process.platform === 'win32' && started) {
  app.quit()
}

// Ensure a stable app name across dev and packaged builds so electron-store
// resolves the same userData/config.json path.
app.setName('TrayLink')

// Use a different protocol for macos so it doesn't conflict with the react-native-macos project
const scheme = os.platform() !== 'darwin' ? 'tlink' : 'tlink-debug'
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient(scheme, process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient(scheme)
}

protocol.registerSchemesAsPrivileged([
  {
    scheme,
    privileges: { standard: true, supportFetchAPI: true, secure: true },
  },
])

const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
}

const sanitizeCorruptedElectronStore = () => {
  const userDataPath = app.getPath('userData')
  const storePath = path.join(userDataPath, 'config.json')

  if (!fs.existsSync(storePath)) {
    return
  }

  try {
    JSON.parse(fs.readFileSync(storePath, 'utf8'))
  } catch (error) {
    const backupPath = path.join(userDataPath, `config.corrupted-${Date.now()}.json`)
    fs.renameSync(storePath, backupPath)
    console.error(`[ElectronMain] Backed up corrupted config store to ${backupPath}.`, error)
  }
}

const parseJSONStringValueIfNeeded = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const readJsonObject = (targetPath: string): Record<string, unknown> | null => {
  if (!fs.existsSync(targetPath)) {
    return null
  }

  try {
    return JSON.parse(fs.readFileSync(targetPath, 'utf8')) as Record<string, unknown>
  } catch {
    return null
  }
}

const loadLegacyProjects = (): unknown[] => {
  const home = app.getPath('home')
  const candidates = [
    path.join(home, 'Library', 'Application Support', 'tray-link', 'config.json'),
    path.join(home, 'Library', 'Application Support', 'Tray Link', 'config.json'),
    path.join(home, 'Library', 'Application Support', 'vs-tray', 'config.json'),
  ]

  for (const candidate of candidates) {
    const data = readJsonObject(candidate)
    if (!data) {
      continue
    }

    const projects = parseJSONStringValueIfNeeded(data.projects)
    if (Array.isArray(projects) && projects.length > 0) {
      return projects
    }
  }

  return []
}

const restoreProjectsIfNeeded = () => {
  const storePath = path.join(app.getPath('userData'), 'config.json')
  const current = readJsonObject(storePath) ?? {}
  const currentProjects = parseJSONStringValueIfNeeded(current.projects)

  if (Array.isArray(currentProjects) && currentProjects.length > 0) {
    return
  }

  const legacyProjects = loadLegacyProjects()
  if (!legacyProjects.length) {
    return
  }

  const next = {
    ...current,
    projects: legacyProjects,
  }

  fs.mkdirSync(path.dirname(storePath), { recursive: true })
  fs.writeFileSync(storePath, JSON.stringify(next, undefined, '\t') + '\n', 'utf8')
  console.error(`[ElectronMain] Restored ${legacyProjects.length} projects from legacy config into ${storePath}.`)
}

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 380,
    height: 600,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      devTools: true,
      webSecurity: false,
      preload: path.join(__dirname, './preload.js'),
    },
    skipTaskbar: true,
  })

  if (process.platform === 'darwin') {
    mainWindow.setAlwaysOnTop(true, 'pop-up-menu')
    mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  }

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
    mainWindow.loadURL(ELECTRON_WEB_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }

  mainWindow.webContents.once('dom-ready', () => {
    // Only keep the current session in the logs
    mainWindow.webContents.executeJavaScript("localStorage.setItem('logs', '[]')")
  })

  return mainWindow
}

app.on('ready', () => {
  sanitizeCorruptedElectronStore()
  restoreProjectsIfNeeded()

  if (process.platform === 'darwin') {
    app.dock?.hide()
  }

  registerMainModules(MainModules)

  const mainWindow = createMainWindow()
  const Tray = new TrayGenerator(mainWindow)
  Tray.createTray()

  const server = new LocalServer()
  server.start()
})
