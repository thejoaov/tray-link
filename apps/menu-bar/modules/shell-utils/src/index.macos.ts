import { requireNativeModule } from 'expo-modules-core'
import { NativeModules } from 'react-native'

const ShellUtilsModule = requireNativeModule('ShellUtils')

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

export function isCliInstalled(): Promise<boolean> {
  return ShellUtilsModule.isCliInstalled()
}

export function installCli(): Promise<{ success: boolean; error?: string }> {
  return ShellUtilsModule.installCli()
}

export function uninstallCli(): Promise<{ success: boolean; error?: string }> {
  return ShellUtilsModule.uninstallCli()
}
