import { exec } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import util from 'util'

const execAsync = util.promisify(exec)

const CLI_BINARY_NAME = 'tlink'

function getCliWrapperDir(): string {
  const platform = process.platform
  if (platform === 'win32') {
    return path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'), 'tray-link')
  }
  return path.join(os.homedir(), '.tray-link')
}

function getCliSymlinkPath(): string {
  if (process.platform === 'win32') {
    return path.join(getCliWrapperDir(), `${CLI_BINARY_NAME}.cmd`)
  }
  return `/usr/local/bin/${CLI_BINARY_NAME}`
}

function getCliJsPath(): string {
  // The Vite-built CLI JS lives at .vite/build/cli/index.js relative to __dirname
  return path.join(__dirname, './cli/index.js')
}

function createWrapperScript(): string {
  const wrapperDir = getCliWrapperDir()
  if (!fs.existsSync(wrapperDir)) {
    fs.mkdirSync(wrapperDir, { recursive: true })
  }

  const cliJs = getCliJsPath()
  const isWindows = process.platform === 'win32'

  if (isWindows) {
    // Windows batch wrapper — uses node from PATH at runtime
    const wrapperPath = path.join(wrapperDir, `${CLI_BINARY_NAME}.cmd`)
    const content = `@echo off\r\nnode "${cliJs}" %*\r\n`
    fs.writeFileSync(wrapperPath, content, { encoding: 'utf8' })
    return wrapperPath
  }

  // Unix shell wrapper — resolves node at runtime from user's PATH
  const wrapperPath = path.join(wrapperDir, CLI_BINARY_NAME)
  const content = [
    '#!/bin/sh',
    '# Tray Link CLI wrapper — requires Node.js in PATH',
    `CLI_PATH="${cliJs}"`,
    'if command -v node >/dev/null 2>&1; then',
    '  exec node "$CLI_PATH" "$@"',
    'fi',
    'echo "Error: Node.js is required but not found in PATH" >&2',
    'echo "Install Node.js from https://nodejs.org" >&2',
    'exit 1',
    '',
  ].join('\n')
  fs.writeFileSync(wrapperPath, content, { mode: 0o755, encoding: 'utf8' })
  return wrapperPath
}

export const ShellUtilsMain = {
  openInEditor: async (path: string, editorCommand: string) => {
    try {
      await execAsync(`${editorCommand} "${path}"`)
      return true
    } catch {
      return false
    }
  },
  openInTerminal: async (path: string, terminalCommand: string) => {
    try {
      await execAsync(`cd "${path}" && ${terminalCommand}`)
      return true
    } catch {
      return false
    }
  },
  openInFinder: async (path: string) => {
    try {
      const { shell } = require('electron')
      await shell.openPath(path)
      return true
    } catch {
      return false
    }
  },
  which: async (binary: string) => {
    try {
      const isWindows = process.platform === 'win32'
      const command = isWindows ? `where ${binary}` : `which ${binary}`
      const { stdout } = await execAsync(command)
      return stdout.trim()
    } catch {
      return null
    }
  },
  fileExists: async (path: string) => {
    try {
      return fs.existsSync(path)
    } catch {
      return false
    }
  },
  loadLegacyTrayLinkData: async () => {
    try {
      const home = os.homedir()
      const candidates = [
        path.join(home, 'Library', 'Application Support', 'tray-link', 'config.json'),
        path.join(home, 'Library', 'Application Support', 'Tray Link', 'config.json'),
        path.join(home, 'Library', 'Application Support', 'vs-tray', 'config.json'),
      ]

      const source = candidates.find((candidate) => fs.existsSync(candidate))
      if (!source) {
        return null
      }

      const raw = fs.readFileSync(source, 'utf8')
      return JSON.parse(raw) as Record<string, unknown>
    } catch {
      return null
    }
  },
  removeFromDisk: async (path: string) => {
    try {
      const isWindows = process.platform === 'win32'
      const command = isWindows
        ? `powershell -NoProfile -Command "Remove-Item -LiteralPath '${path.replace(/'/g, "''")}' -Recurse -Force"`
        : `rm -rf "${path.replace(/"/g, '\\"')}"`
      await execAsync(command)
      return true
    } catch {
      return false
    }
  },
  isCliInstalled: async (): Promise<boolean> => {
    try {
      if (process.platform === 'win32') {
        // On Windows, check if our wrapper cmd exists
        return fs.existsSync(getCliSymlinkPath())
      }
      const { stdout } = await execAsync(`which ${CLI_BINARY_NAME}`)
      return stdout.trim().length > 0
    } catch {
      return false
    }
  },
  installCli: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const wrapperPath = createWrapperScript()
      const platform = process.platform

      if (platform === 'win32') {
        // On Windows the wrapper is placed directly in the wrapper dir.
        // Add that directory to the user's PATH if not already present.
        const wrapperDir = getCliWrapperDir()
        try {
          const { stdout: currentPath } = await execAsync(
            `powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('Path', 'User')"`,
          )
          if (!currentPath.includes(wrapperDir)) {
            const newPath = currentPath.trimEnd().replace(/;$/, '') + ';' + wrapperDir
            await execAsync(
              `powershell -NoProfile -Command "[Environment]::SetEnvironmentVariable('Path', '${newPath.replace(/'/g, "''")}', 'User')"`,
            )
          }
        } catch {
          // If PATH update fails, the cmd file is still usable from the directory
        }
        return { success: true }
      }

      if (platform === 'darwin') {
        // macOS: use osascript to get admin privileges for symlinking to /usr/local/bin
        const symlinkPath = getCliSymlinkPath()
        const cmd = `ln -sf "${wrapperPath}" "${symlinkPath}"`
        await execAsync(`osascript -e 'do shell script "${cmd.replace(/"/g, '\\"')}" with administrator privileges'`)
        return { success: true }
      }

      // Linux: use pkexec for admin privileges
      const symlinkPath = getCliSymlinkPath()
      try {
        await execAsync(`pkexec ln -sf "${wrapperPath}" "${symlinkPath}"`)
      } catch {
        // Fallback: try without elevation (works if /usr/local/bin is writable)
        await execAsync(`ln -sf "${wrapperPath}" "${symlinkPath}"`)
      }
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, error: message }
    }
  },
  uninstallCli: async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const platform = process.platform

      if (platform === 'win32') {
        const wrapperPath = getCliSymlinkPath()
        if (fs.existsSync(wrapperPath)) {
          fs.unlinkSync(wrapperPath)
        }
        // Clean up PATH
        const wrapperDir = getCliWrapperDir()
        try {
          const { stdout: currentPath } = await execAsync(
            `powershell -NoProfile -Command "[Environment]::GetEnvironmentVariable('Path', 'User')"`,
          )
          if (currentPath.includes(wrapperDir)) {
            const newPath = currentPath
              .split(';')
              .filter((p) => p.trim() !== wrapperDir)
              .join(';')
            await execAsync(
              `powershell -NoProfile -Command "[Environment]::SetEnvironmentVariable('Path', '${newPath.replace(/'/g, "''")}', 'User')"`,
            )
          }
        } catch {
          // PATH cleanup is best-effort
        }
        return { success: true }
      }

      const symlinkPath = getCliSymlinkPath()
      if (!fs.existsSync(symlinkPath)) {
        return { success: true }
      }

      if (platform === 'darwin') {
        const cmd = `rm -f "${symlinkPath}"`
        await execAsync(`osascript -e 'do shell script "${cmd.replace(/"/g, '\\"')}" with administrator privileges'`)
        return { success: true }
      }

      // Linux
      try {
        await execAsync(`pkexec rm -f "${symlinkPath}"`)
      } catch {
        await execAsync(`rm -f "${symlinkPath}"`)
      }
      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, error: message }
    }
  },
}
