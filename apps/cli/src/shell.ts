import { buildTerminalSpawnCommand } from '@tray-link/tray-shared'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

/**
 * Open a project path in the given editor.
 * Mirrors the logic in apps/menu-bar/modules/shell-utils/electron/main.ts
 */
export async function openInEditor(projectPath: string, editorCommand: string): Promise<void> {
  await execAsync(`${editorCommand} "${projectPath}"`)
}

/**
 * Open a terminal in the given project path.
 * Mirrors the logic in apps/menu-bar/modules/shell-utils/electron/main.ts
 */
export async function openInTerminal(projectPath: string, terminalCommand: string): Promise<void> {
  await execAsync(`cd "${projectPath}" && ${terminalCommand}`)
}

/**
 * Open a terminal in the given project path and run a command (e.g. an AI agent CLI).
 */
export async function openInTerminalWithCommand(
  projectPath: string,
  terminalCommand: string,
  commandToRun: string,
): Promise<void> {
  const spawnCommand = buildTerminalSpawnCommand(projectPath, terminalCommand, commandToRun)
  await execAsync(spawnCommand)
}
