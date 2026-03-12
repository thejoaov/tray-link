import { app } from 'electron'
import Store from 'electron-store'
import fs from 'fs'
import path from 'path'

const STORE_FILE_NAME = 'config.json'
type StoreShape = Record<string, unknown>
type ElectronStoreInstance = {
  clear: () => void
  delete: (key: string) => void
  get: (key: string) => unknown
  path: string
  set: (key: string, value: unknown) => void
  store: StoreShape
}

let storeInstance: ElectronStoreInstance | null = null
let storeNormalized = false

const getStorePath = () => {
  return path.join(app.getPath('userData'), STORE_FILE_NAME)
}

const backupCorruptedStore = (storePath: string) => {
  if (!fs.existsSync(storePath)) {
    return
  }

  const directory = path.dirname(storePath)
  const backupPath = path.join(directory, `config.corrupted-${Date.now()}.json`)
  fs.renameSync(storePath, backupPath)
}

const createStore = (): ElectronStoreInstance => {
  try {
    return new Store<StoreShape>({ clearInvalidConfig: false }) as unknown as ElectronStoreInstance
  } catch (error) {
    const storePath = getStorePath()
    console.error(`[StorageMain] Failed to open store at ${storePath}, recreating it from a backup.`, error)

    try {
      backupCorruptedStore(storePath)
    } catch (backupError) {
      console.error(`[StorageMain] Failed to backup corrupted store at ${storePath}.`, backupError)
      throw error
    }

    return new Store<StoreShape>({ clearInvalidConfig: true }) as unknown as ElectronStoreInstance
  }
}

const normalizeStoreShape = (store: ElectronStoreInstance) => {
  try {
    const currentStore = store.store as StoreShape
    const normalizedEntries = Object.entries(currentStore).map(([key, value]) => [
      key,
      parseJSONStringValueIfNeeded(value),
    ])
    const normalizedStore = Object.fromEntries(normalizedEntries)

    if (JSON.stringify(currentStore) !== JSON.stringify(normalizedStore)) {
      store.store = normalizedStore
    }
  } catch (error) {
    console.error('[StorageMain] Failed to normalize store shape.', error)
  }
}

const getStore = (): ElectronStoreInstance => {
  if (!storeInstance) {
    storeInstance = createStore()
  }

  if (!storeNormalized) {
    normalizeStoreShape(storeInstance)
    storeNormalized = true
  }

  return storeInstance
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

const serializeStoredValue = (value: unknown): string | null => {
  if (typeof value === 'string') {
    return value
  }

  if (value == null) {
    return null
  }

  return JSON.stringify(value)
}

export const StorageMain = {
  setItem: (key: string, value: string) => {
    const store = getStore()
    store.set(key, parseJSONStringValueIfNeeded(value))
    return true
  },
  getItem: (key: string) => {
    const store = getStore()
    return serializeStoredValue(store.get(key))
  },
  removeItem: (key: string) => {
    const store = getStore()
    store.delete(key)
    return true
  },
  getAllKeys: () => {
    try {
      const store = getStore()
      return Object.keys(store.store)
    } catch (error) {
      console.error('[StorageMain] Failed to list store keys.', error)
      return []
    }
  },
  clear: () => {
    const store = getStore()
    store.clear()
    return true
  },
  appendErrorLog: (entryJson: string) => {
    const store = getStore()
    const existing = store.get('error-log')
    const entries = Array.isArray(existing) ? existing : []
    entries.push(JSON.parse(entryJson))
    store.set('error-log', entries)
    return true
  },
  getErrorLogPath: () => {
    const store = getStore()
    return path.join(store.path.replace(/config\.json$/i, ''), 'error-log.json')
  },
}
