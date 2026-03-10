import { Platform } from 'react-native'

const isElectron = Platform.OS === 'web'

type StorageModuleType = {
  setItem: (key: string, value: string) => Promise<boolean>
  getItem: (key: string) => Promise<string | null>
  removeItem: (key: string) => Promise<boolean>
  getAllKeys: () => Promise<string[]>
  clear: () => Promise<boolean>
  appendErrorLog: (entryJson: string) => Promise<boolean>
  getErrorLogPath: () => Promise<string>
}

let StorageModule: StorageModuleType

if (isElectron) {
  const { requireElectronModule } = require('@tray-link/rn-electron-modules') as {
    requireElectronModule: <T>(moduleName: string) => T
  }
  StorageModule = requireElectronModule<StorageModuleType>('Storage')
} else {
  StorageModule = {
    setItem: async () => false,
    getItem: async () => null,
    removeItem: async () => false,
    getAllKeys: async () => [],
    clear: async () => false,
    appendErrorLog: async () => false,
    getErrorLogPath: async () => '',
  }
}

export function setItem(key: string, value: string): Promise<boolean> {
  return StorageModule.setItem(key, value)
}

export function getItem(key: string): Promise<string | null> {
  return StorageModule.getItem(key)
}

export function removeItem(key: string): Promise<boolean> {
  return StorageModule.removeItem(key)
}

export function getAllKeys(): Promise<string[]> {
  return StorageModule.getAllKeys()
}

export function clear(): Promise<boolean> {
  return StorageModule.clear()
}

export function appendErrorLog(entryJson: string): Promise<boolean> {
  return StorageModule.appendErrorLog(entryJson)
}

export function getErrorLogPath(): Promise<string> {
  return StorageModule.getErrorLogPath()
}
