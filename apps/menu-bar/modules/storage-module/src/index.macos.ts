import { requireNativeModule } from 'expo-modules-core'

type StorageModuleType = {
  setItem: (key: string, value: string) => Promise<boolean>
  getItem: (key: string) => Promise<string | null>
  removeItem: (key: string) => Promise<boolean>
  getAllKeys: () => Promise<string[]>
  clear: () => Promise<boolean>
  appendErrorLog: (entryJson: string) => Promise<boolean>
  getErrorLogPath: () => Promise<string>
  getConfigPath: () => Promise<string>
}

const NativeStorage = requireNativeModule<StorageModuleType>('Storage')

export function setItem(key: string, value: string): Promise<boolean> {
  return NativeStorage.setItem(key, value)
}

export function getItem(key: string): Promise<string | null> {
  return NativeStorage.getItem(key)
}

export function removeItem(key: string): Promise<boolean> {
  return NativeStorage.removeItem(key)
}

export function getAllKeys(): Promise<string[]> {
  return NativeStorage.getAllKeys()
}

export function clear(): Promise<boolean> {
  return NativeStorage.clear()
}

export function appendErrorLog(entryJson: string): Promise<boolean> {
  return NativeStorage.appendErrorLog(entryJson)
}

export function getErrorLogPath(): Promise<string> {
  return NativeStorage.getErrorLogPath()
}

export function getConfigPath(): Promise<string> {
  return NativeStorage.getConfigPath()
}
