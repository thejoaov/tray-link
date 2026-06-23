import { exec } from 'child_process'
import { app } from 'electron'
import fs from 'fs'
import os from 'os'
import path from 'path'
import util from 'util'
import { buildTerminalSpawnCommand } from '../../../../../packages/tray-shared/src/utils/terminalSpawn'

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
    const wrapperPath = path.join(wrapperDir, `${CLI_BINARY_NAME}.cmd`)
    const content = `@echo off\r\nnode "${cliJs}" %*\r\n`
    fs.writeFileSync(wrapperPath, content, { encoding: 'utf8' })
    return wrapperPath
  }

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

function getBundleResourceIconCandidates(appPath: string, iconName?: string | null): string[] {
  const resourcesDir = path.join(appPath, 'Contents', 'Resources')
  const normalizedIconName = iconName ? iconName.replace(/\.icns$/i, '') : null
  const basenames = [normalizedIconName, 'AppIcon', 'app', path.basename(appPath, '.app')].filter(
    (value): value is string => Boolean(value),
  )

  return [
    ...new Set(
      basenames.flatMap((basename) => [
        path.join(resourcesDir, `${basename}.icns`),
        path.join(resourcesDir, `${basename}.png`),
      ]),
    ),
  ]
}

function toDataUrl(mimeType: string, buffer: Buffer): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`
}

async function getImageFileDataUrl(iconPath: string): Promise<string | null> {
  try {
    const extension = path.extname(iconPath).toLowerCase()

    if (extension === '.png') {
      return toDataUrl('image/png', fs.readFileSync(iconPath))
    }

    if (extension === '.icns') {
      const outputPath = path.join(
        os.tmpdir(),
        `tray-link-icon-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2)}.png`,
      )

      try {
        await execAsync(
          `sips -s format png "${iconPath.replace(/"/g, '\\"')}" --out "${outputPath.replace(/"/g, '\\"')}"`,
        )
        if (!fs.existsSync(outputPath)) {
          return null
        }

        return toDataUrl('image/png', fs.readFileSync(outputPath))
      } finally {
        if (fs.existsSync(outputPath)) {
          fs.rmSync(outputPath, { force: true })
        }
      }
    }
  } catch {
    return null
  }

  return null
}

async function getMacOSBundleIconName(appPath: string): Promise<string | null> {
  const plistPath = path.join(appPath, 'Contents', 'Info.plist')
  if (!fs.existsSync(plistPath)) {
    return null
  }

  try {
    const { stdout } = await execAsync(`plutil -convert json -o - "${plistPath.replace(/"/g, '\\"')}"`)
    const plist = JSON.parse(stdout) as {
      CFBundleIconFile?: string
      CFBundleIconName?: string
    }

    return plist.CFBundleIconFile || plist.CFBundleIconName || null
  } catch {
    return null
  }
}

async function getMacOSBundleIconDataUrl(appPath: string): Promise<string | null> {
  try {
    const iconName = await getMacOSBundleIconName(appPath)
    const candidates = getBundleResourceIconCandidates(appPath, iconName)

    for (const candidate of candidates) {
      if (!fs.existsSync(candidate)) {
        continue
      }

      const dataUrl = await getImageFileDataUrl(candidate)
      if (dataUrl) {
        return dataUrl
      }
    }
  } catch {
    return null
  }

  return null
}

async function downloadFile(downloadUrl: string, destinationPath: string): Promise<void> {
  await execAsync(`curl -L "${downloadUrl.replace(/"/g, '\\"')}" -o "${destinationPath.replace(/"/g, '\\"')}"`)
}

async function unzipArchive(zipPath: string, destinationPath: string): Promise<void> {
  fs.mkdirSync(destinationPath, { recursive: true })
  await execAsync(`ditto -x -k "${zipPath.replace(/"/g, '\\"')}" "${destinationPath.replace(/"/g, '\\"')}"`)
}

function findAppBundle(rootPath: string): string | null {
  const entries = fs.readdirSync(rootPath, { withFileTypes: true })

  for (const entry of entries) {
    const entryPath = path.join(rootPath, entry.name)

    if (entry.isDirectory() && entry.name.endsWith('.app')) {
      return entryPath
    }

    if (entry.isDirectory()) {
      const nested = findAppBundle(entryPath)
      if (nested) {
        return nested
      }
    }
  }

  return null
}

function getCurrentAppBundlePath(): string {
  return path.resolve(path.dirname(app.getPath('exe')), '../..')
}

function createInstallerScript(sourceAppPath: string, targetAppPath: string, currentProcessId: number): string {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tray-link-electron-update-script-'))
  const scriptPath = path.join(tempRoot, 'install-update.sh')
  const script = `#!/bin/sh
while kill -0 ${currentProcessId} 2>/dev/null; do
  sleep 1
done
rm -rf "${targetAppPath.replace(/"/g, '\\"')}"
ditto "${sourceAppPath.replace(/"/g, '\\"')}" "${targetAppPath.replace(/"/g, '\\"')}"
open "${targetAppPath.replace(/"/g, '\\"')}"
`

  fs.writeFileSync(scriptPath, script, { mode: 0o755, encoding: 'utf8' })
  return scriptPath
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
  openInTerminalWithCommand: async (path: string, terminalCommand: string, commandToRun: string) => {
    try {
      const spawnCommand = buildTerminalSpawnCommand(path, terminalCommand, commandToRun)
      await execAsync(spawnCommand)
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
      if (isWindows) {
        const { stdout } = await execAsync(`where ${binary}`)
        return stdout.trim().split('\n')[0] || null
      }

      const home = process.env.HOME ?? ''
      const candidatePaths = [
        `/opt/homebrew/bin/${binary}`,
        `/usr/local/bin/${binary}`,
        `${home}/.local/bin/${binary}`,
        `${home}/.cursor/bin/${binary}`,
        `${home}/.npm-global/bin/${binary}`,
        `${home}/.cargo/bin/${binary}`,
      ]

      for (const candidate of candidatePaths) {
        if (candidate && fs.existsSync(candidate)) {
          return candidate
        }
      }

      const pathPrefix = [
        '/opt/homebrew/bin',
        '/usr/local/bin',
        `${home}/.local/bin`,
        `${home}/.cursor/bin`,
        `${home}/.npm-global/bin`,
        `${home}/.cargo/bin`,
      ]
        .filter(Boolean)
        .join(':')

      const { stdout } = await execAsync(`/bin/zsh -lc 'export PATH="${pathPrefix}:$PATH"; command -v ${binary}'`)
      return stdout.trim() || null
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
  getFileIconDataUrl: async (targetPath: string) => {
    try {
      if (!fs.existsSync(targetPath)) {
        return null
      }

      if (process.platform === 'darwin' && targetPath.endsWith('.app')) {
        const bundleIcon = await getMacOSBundleIconDataUrl(targetPath)
        if (bundleIcon) {
          return bundleIcon
        }
      }

      const icon = await app.getFileIcon(targetPath, { size: 'small' })
      if (icon.isEmpty()) {
        return null
      }

      return icon.toDataURL()
    } catch {
      return null
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
  installAppUpdate: async (downloadUrl: string): Promise<{ success: boolean; error?: string }> => {
    if (process.platform !== 'darwin') {
      return {
        success: false,
        error: 'In-app updates are only available on macOS',
      }
    }

    try {
      const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'tray-link-electron-update-'))
      const zipPath = path.join(tempRoot, 'update.zip')
      const extractedPath = path.join(tempRoot, 'extracted')

      await downloadFile(downloadUrl, zipPath)
      await unzipArchive(zipPath, extractedPath)

      const appBundlePath = findAppBundle(extractedPath)
      if (!appBundlePath) {
        return { success: false, error: 'Could not find the application bundle in the downloaded archive' }
      }

      const targetAppPath = getCurrentAppBundlePath()
      const installerScriptPath = createInstallerScript(appBundlePath, targetAppPath, process.pid)
      await execAsync(`nohup "${installerScriptPath.replace(/"/g, '\\"')}" >/dev/null 2>&1 &`)

      return { success: true }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      return { success: false, error: message }
    }
  },
}
