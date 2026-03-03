import { NativeModules } from 'react-native';

const isElectron = false; // TODO: Implement electron detection

type StorageModuleType = {
  setItem: (key: string, value: string) => Promise<boolean>;
  getItem: (key: string) => Promise<string | null>;
  removeItem: (key: string) => Promise<boolean>;
  getAllKeys: () => Promise<string[]>;
  clear: () => Promise<boolean>;
};

let StorageModule: StorageModuleType;

if (isElectron) {
  const { requireElectronModule } = require('rn-electron-modules') as {
    requireElectronModule: <T>(moduleName: string) => T;
  };
  StorageModule = requireElectronModule<StorageModuleType>('Storage');
} else {
  StorageModule = {
    setItem: async () => false,
    getItem: async () => null,
    removeItem: async () => false,
    getAllKeys: async () => [],
    clear: async () => false,
  };
}

export function setItem(key: string, value: string): Promise<boolean> {
  if (isElectron) return StorageModule.setItem(key, value);
  return Promise.resolve(false);
}

export function getItem(key: string): Promise<string | null> {
  if (isElectron) return StorageModule.getItem(key);
  return Promise.resolve(null);
}

export function removeItem(key: string): Promise<boolean> {
  if (isElectron) return StorageModule.removeItem(key);
  return Promise.resolve(false);
}

export function getAllKeys(): Promise<string[]> {
  if (isElectron) return StorageModule.getAllKeys();
  return Promise.resolve([]);
}

export function clear(): Promise<boolean> {
  if (isElectron) return StorageModule.clear();
  return Promise.resolve(false);
}
