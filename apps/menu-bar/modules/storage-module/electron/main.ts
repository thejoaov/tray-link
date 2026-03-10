import Store from 'electron-store'
import path from 'path'

// biome-ignore lint/suspicious/noExplicitAny: false positive
const store = new Store() as any

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

const normalizeStoreShape = () => {
  const currentStore = store.store as Record<string, unknown>
  const normalizedEntries = Object.entries(currentStore).map(([key, value]) => [
    key,
    parseJSONStringValueIfNeeded(value),
  ])
  const normalizedStore = Object.fromEntries(normalizedEntries)

  if (JSON.stringify(currentStore) !== JSON.stringify(normalizedStore)) {
    store.store = normalizedStore
  }
}

normalizeStoreShape()

export const StorageMain = {
  setItem: (key: string, value: string) => {
    store.set(key, parseJSONStringValueIfNeeded(value))
    return true
  },
  getItem: (key: string) => {
    return serializeStoredValue(store.get(key))
  },
  removeItem: (key: string) => {
    store.delete(key)
    return true
  },
  getAllKeys: () => {
    return Object.keys(store.store)
  },
  clear: () => {
    store.clear()
    return true
  },
  appendErrorLog: (entryJson: string) => {
    const existing = store.get('error-log')
    const entries = Array.isArray(existing) ? existing : []
    entries.push(JSON.parse(entryJson))
    store.set('error-log', entries)
    return true
  },
  getErrorLogPath: () => {
    return path.join(store.path.replace(/config\.json$/i, ''), 'error-log.json')
  },
}
