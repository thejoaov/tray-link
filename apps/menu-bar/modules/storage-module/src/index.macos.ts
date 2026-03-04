import { requireNativeModule } from 'expo-modules-core'

type StorageModuleType = {
  setItem: (key: string, value: string) => Promise<boolean>
  getItem: (key: string) => Promise<string | null>
  removeItem: (key: string) => Promise<boolean>
  getAllKeys: () => Promise<string[]>
  clear: () => Promise<boolean>
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
