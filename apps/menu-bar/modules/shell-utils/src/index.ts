import { Platform } from 'react-native'

const isElectron = Platform.OS === 'web'

type ShellUtilsModuleType = {
  openInEditor: (path: string, editorCommand: string) => Promise<boolean>
  openInTerminal: (path: string, terminalCommand: string) => Promise<boolean>
  openInFinder: (path: string) => Promise<boolean>
  which: (binary: string) => Promise<string | null>
  fileExists: (path: string) => Promise<boolean>
  loadLegacyTrayLinkData: () => Promise<Record<string, unknown> | null>
  removeFromDisk: (path: string) => Promise<boolean>
}

let ShellUtilsModule: ShellUtilsModuleType

if (isElectron) {
  const { requireElectronModule } = require('@tray-link/rn-electron-modules') as {
    requireElectronModule: <T>(moduleName: string) => T
  }
  ShellUtilsModule = requireElectronModule<ShellUtilsModuleType>('ShellUtils')
} else {
  try {
    const { requireNativeModule } = require('expo-modules-core')
    ShellUtilsModule = requireNativeModule('ShellUtils') as ShellUtilsModuleType
  } catch {
    // Fallback no-op for environments where native modules are unavailable
    ShellUtilsModule = {
      openInEditor: async () => false,
      openInTerminal: async () => false,
      openInFinder: async () => false,
      which: async () => null,
      fileExists: async () => false,
      loadLegacyTrayLinkData: async () => null,
      removeFromDisk: async () => false,
    }
  }
}

export function openInEditor(path: string, editorCommand: string): Promise<boolean> {
  return ShellUtilsModule.openInEditor(path, editorCommand)
}

export function openInTerminal(path: string, terminalCommand: string): Promise<boolean> {
  return ShellUtilsModule.openInTerminal(path, terminalCommand)
}

export function openInFinder(path: string): Promise<boolean> {
  return ShellUtilsModule.openInFinder(path)
}

export function which(binary: string): Promise<string | null> {
  return ShellUtilsModule.which(binary)
}

export function fileExists(path: string): Promise<boolean> {
  return ShellUtilsModule.fileExists(path)
}

export function loadLegacyTrayLinkData(): Promise<Record<string, unknown> | null> {
  return ShellUtilsModule.loadLegacyTrayLinkData()
}

export function removeFromDisk(path: string): Promise<boolean> {
  return ShellUtilsModule.removeFromDisk(path)
}
