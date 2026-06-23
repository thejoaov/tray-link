import { requireNativeModule } from 'expo-modules-core'

type CliInstallResult = {
  success: boolean
  error?: string
  alreadyInstalled?: boolean
  managedByHomebrew?: boolean
  path?: string
}

type CliUninstallResult = {
  success: boolean
  error?: string
  managedByHomebrew?: boolean
  path?: string
  removed?: boolean
}

const ShellUtilsModule = requireNativeModule('ShellUtils')

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

export function getFileIconDataUrl(_path: string): Promise<string | null> {
  return Promise.resolve(null)
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
