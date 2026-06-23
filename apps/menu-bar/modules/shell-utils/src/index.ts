import { Platform } from 'react-native'

const isElectron = Platform.OS === 'web'

type ShellUtilsModuleType = {
  openInEditor: (path: string, editorCommand: string) => Promise<boolean>
  openInTerminal: (path: string, terminalCommand: string) => Promise<boolean>
  openInTerminalWithCommand: (path: string, terminalCommand: string, commandToRun: string) => Promise<boolean>
  openInFinder: (path: string) => Promise<boolean>
  openPathWithSystem: (path: string) => Promise<boolean>
  which: (binary: string) => Promise<string | null>
  fileExists: (path: string) => Promise<boolean>
  getFileIconDataUrl: (path: string) => Promise<string | null>
  loadLegacyTrayLinkData: () => Promise<Record<string, unknown> | null>
  removeFromDisk: (path: string) => Promise<boolean>
  isCliInstalled: () => Promise<boolean>
  installCli: () => Promise<CliInstallResult>
  uninstallCli: () => Promise<CliUninstallResult>
  installAppUpdate: (downloadUrl: string) => Promise<{ success: boolean; error?: string }>
}

export type CliInstallResult = {
  success: boolean
  error?: string
  alreadyInstalled?: boolean
  managedByHomebrew?: boolean
  path?: string
}

export type CliUninstallResult = {
  success: boolean
  error?: string
  managedByHomebrew?: boolean
  path?: string
  removed?: boolean
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
      openInTerminalWithCommand: async () => false,
      openInFinder: async () => false,
      openPathWithSystem: async () => false,
      which: async () => null,
      fileExists: async () => false,
      getFileIconDataUrl: async () => null,
      loadLegacyTrayLinkData: async () => null,
      removeFromDisk: async () => false,
      isCliInstalled: async () => false,
      installCli: async () => ({ success: false, error: 'Not available' }),
      uninstallCli: async () => ({ success: false, error: 'Not available' }),
      installAppUpdate: async () => ({ success: false, error: 'Not available' }),
    }
  }
}

export function openInEditor(path: string, editorCommand: string): Promise<boolean> {
  return ShellUtilsModule.openInEditor(path, editorCommand)
}

export function openInTerminal(path: string, terminalCommand: string): Promise<boolean> {
  return ShellUtilsModule.openInTerminal(path, terminalCommand)
}

export function openInTerminalWithCommand(
  path: string,
  terminalCommand: string,
  commandToRun: string,
): Promise<boolean> {
  return ShellUtilsModule.openInTerminalWithCommand(path, terminalCommand, commandToRun)
}

export function openInFinder(path: string): Promise<boolean> {
  return ShellUtilsModule.openInFinder(path)
}

export function openPathWithSystem(path: string): Promise<boolean> {
  return ShellUtilsModule.openPathWithSystem(path)
}

export function which(binary: string): Promise<string | null> {
  return ShellUtilsModule.which(binary)
}

export function fileExists(path: string): Promise<boolean> {
  return ShellUtilsModule.fileExists(path)
}

export function getFileIconDataUrl(path: string): Promise<string | null> {
  return ShellUtilsModule.getFileIconDataUrl(path)
}

export function loadLegacyTrayLinkData(): Promise<Record<string, unknown> | null> {
  return ShellUtilsModule.loadLegacyTrayLinkData()
}

export function removeFromDisk(path: string): Promise<boolean> {
  return ShellUtilsModule.removeFromDisk(path)
}

export function isCliInstalled(): Promise<boolean> {
  return ShellUtilsModule.isCliInstalled()
}

export function installCli(): Promise<CliInstallResult> {
  return ShellUtilsModule.installCli()
}

export function uninstallCli(): Promise<CliUninstallResult> {
  return ShellUtilsModule.uninstallCli()
}

export function installAppUpdate(downloadUrl: string): Promise<{ success: boolean; error?: string }> {
  return ShellUtilsModule.installAppUpdate(downloadUrl)
}
