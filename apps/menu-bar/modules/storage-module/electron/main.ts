import { app } from 'electron'
import fs from 'fs'
import path from 'path'

const STORE_FILE_NAME = 'config.json'
type StoreShape = Record<string, unknown>

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

const normalizeStoreShape = (store: StoreShape): StoreShape => {
  const normalizedEntries = Object.entries(store).map(([key, value]) => [key, parseJSONStringValueIfNeeded(value)])
  return Object.fromEntries(normalizedEntries)
}

const writeStoreToDisk = (store: StoreShape) => {
  const storePath = getStorePath()
  const directory = path.dirname(storePath)
  const tempPath = path.join(directory, `${STORE_FILE_NAME}.tmp`)
  fs.mkdirSync(directory, { recursive: true })

  const serialized = JSON.stringify(store, undefined, '\t') + '\n'
  JSON.parse(serialized)
  fs.writeFileSync(tempPath, serialized, 'utf8')
  JSON.parse(fs.readFileSync(tempPath, 'utf8'))
  fs.renameSync(tempPath, storePath)
}

const readStoreFromDisk = (): StoreShape => {
  const storePath = getStorePath()
  if (!fs.existsSync(storePath)) {
    return {}
  }

  try {
    const raw = fs.readFileSync(storePath, 'utf8')
    const parsed = JSON.parse(raw) as StoreShape
    const normalized = normalizeStoreShape(parsed)

    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      writeStoreToDisk(normalized)
    }

    return normalized
  } catch (error) {
    console.error(`[StorageMain] Failed to read store at ${storePath}, recreating it from a backup.`, error)

    try {
      backupCorruptedStore(storePath)
    } catch (backupError) {
      console.error(`[StorageMain] Failed to backup corrupted store at ${storePath}.`, backupError)
    }

    return {}
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
    const store = readStoreFromDisk()
    store[key] = parseJSONStringValueIfNeeded(value)
    writeStoreToDisk(store)
    return true
  },
  getItem: (key: string) => {
    const store = readStoreFromDisk()
    return serializeStoredValue(store[key])
  },
  removeItem: (key: string) => {
    const store = readStoreFromDisk()
    delete store[key]
    writeStoreToDisk(store)
    return true
  },
  getAllKeys: () => {
    try {
      const store = readStoreFromDisk()
      return Object.keys(store)
    } catch (error) {
      console.error('[StorageMain] Failed to list store keys.', error)
      return []
    }
  },
  clear: () => {
    writeStoreToDisk({})
    return true
  },
  appendErrorLog: (entryJson: string) => {
    const store = readStoreFromDisk()
    const existing = store['error-log']
    const entries = Array.isArray(existing) ? existing : []
    entries.push(JSON.parse(entryJson))
    store['error-log'] = entries
    writeStoreToDisk(store)
    return true
  },
  getErrorLogPath: () => {
    return path.join(getStorePath().replace(/config\.json$/i, ''), 'error-log.json')
  },
  getConfigPath: () => {
    return getStorePath()
  },
}
