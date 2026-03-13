import { Project, Settings } from '@tray-link/common-types'
import fs from 'fs'
import os from 'os'
import path from 'path'

/**
 * Computes the same config path that the Electron app's electron-store uses.
 * electron-store defaults to `app.getPath('userData')` which resolves to:
 *   macOS:   ~/Library/Application Support/<productName>/
 *   Linux:   ~/.config/<productName>/  (or $XDG_CONFIG_HOME)
 *   Windows: %APPDATA%/<productName>/
 *
 * The productName in electron/package.json is "TrayLink".
 */
const APP_NAME = 'TrayLink'

function getConfigPath(): string {
  let dir: string
  switch (process.platform) {
    case 'darwin':
      dir = path.join(os.homedir(), 'Library', 'Application Support', APP_NAME)
      break
    case 'win32':
      dir = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), APP_NAME)
      break
    default:
      dir = path.join(process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config'), APP_NAME)
      break
  }
  return path.join(dir, 'config.json')
}

function parseJSONStringValueIfNeeded(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value
  }

  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

function readConfig(): Record<string, unknown> {
  try {
    const raw = fs.readFileSync(getConfigPath(), 'utf8')
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const normalized = Object.fromEntries(
      Object.entries(parsed).map(([key, value]) => [key, parseJSONStringValueIfNeeded(value)]),
    )

    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      writeConfig(normalized)
    }

    return normalized
  } catch {
    return {}
  }
}

function writeConfig(config: Record<string, unknown>): void {
  const configPath = getConfigPath()
  fs.mkdirSync(path.dirname(configPath), { recursive: true })
  // Match electron-store/conf format: JSON with tabs + trailing newline
  fs.writeFileSync(configPath, JSON.stringify(config, undefined, '\t') + '\n', 'utf8')
}

const PROJECTS_KEY = 'projects'

export const projectStore = {
  getProjects: async (): Promise<Project[]> => {
    try {
      const config = readConfig()
      const data = config[PROJECTS_KEY]
      if (!data) return []
      if (typeof data === 'string') {
        return JSON.parse(data)
      }
      if (Array.isArray(data)) {
        return data
      }
      return []
    } catch (_e) {
      return []
    }
  },

  saveProjects: async (projects: Project[]): Promise<void> => {
    const config = readConfig()
    config[PROJECTS_KEY] = projects
    writeConfig(config)
  },

  addProject: async (project: Project): Promise<void> => {
    const projects = await projectStore.getProjects()
    await projectStore.saveProjects([...projects, project])
  },

  removeProject: async (projectId: string): Promise<void> => {
    const projects = await projectStore.getProjects()
    await projectStore.saveProjects(projects.filter((p) => p.id !== projectId))
  },

  updateProject: async (project: Project): Promise<void> => {
    const projects = await projectStore.getProjects()
    const index = projects.findIndex((p) => p.id === project.id)
    if (index > -1) {
      projects[index] = project
      await projectStore.saveProjects(projects)
    }
  },
}

const PREFERENCES_KEY = 'user-preferences'

const defaultPreferences: Settings = {
  locale: 'en',
  defaultEditor: null,
  defaultTerminal: null,
  launchOnLogin: false,
  showAppIcons: false,
  removeFromDiskByDefault: false,
  requireProjectDeletionConfirmation: false,
  hasInstalledCli: false,
  customEditors: [],
  customTerminals: [],
}

export const preferencesStore = {
  getPreferences: (): Settings => {
    try {
      const config = readConfig()
      const data = config[PREFERENCES_KEY]
      if (!data) return { ...defaultPreferences }
      if (typeof data === 'string') {
        return { ...defaultPreferences, ...(JSON.parse(data) as Partial<Settings>) }
      }
      return { ...defaultPreferences, ...(data as Partial<Settings>) }
    } catch {
      return { ...defaultPreferences }
    }
  },

  savePreferences: (preferences: Settings): void => {
    const config = readConfig()
    config[PREFERENCES_KEY] = preferences
    writeConfig(config)
  },

  setDefaultEditor: (command: string | null): void => {
    const prefs = preferencesStore.getPreferences()
    preferencesStore.savePreferences({ ...prefs, defaultEditor: command })
  },

  setDefaultTerminal: (command: string | null): void => {
    const prefs = preferencesStore.getPreferences()
    preferencesStore.savePreferences({ ...prefs, defaultTerminal: command })
  },
}
