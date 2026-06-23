import Platform from './platform'

const shellEscape = (value: string): string => {
  return `'${value.replace(/'/g, `'\\''`)}'`
}

const shellEscapeDoubleQuotes = (value: string): string => {
  return `"${value.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

const buildSessionCommand = (projectPath: string, commandToRun: string): string => {
  return `cd ${shellEscape(projectPath)} && ${commandToRun}`
}

const normalizeTerminalCommand = (terminalCommand: string): string => terminalCommand.trim().toLowerCase()

export const buildTerminalSpawnCommand = (
  projectPath: string,
  terminalCommand: string,
  commandToRun: string,
): string => {
  const sessionCommand = buildSessionCommand(projectPath, commandToRun)
  const normalizedTerminal = normalizeTerminalCommand(terminalCommand)
  const platform = Platform.OS

  if (platform === 'darwin') {
    if (normalizedTerminal.includes('iterm')) {
      const escapedSession = sessionCommand.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      return `osascript -e 'tell application "iTerm" to activate' -e 'tell application "iTerm" to tell current window to create tab with default profile' -e 'tell application "iTerm" to tell current session of current window to write text "${escapedSession}"'`
    }

    if (normalizedTerminal.includes('ghostty')) {
      return `open -a Ghostty --args -e bash -lc ${shellEscapeDoubleQuotes(sessionCommand)}`
    }

    if (normalizedTerminal.includes('warp')) {
      return `open -a Warp --args -e bash -lc ${shellEscapeDoubleQuotes(sessionCommand)}`
    }

    if (normalizedTerminal.includes('terminal')) {
      const escapedSession = sessionCommand.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      return `osascript -e 'tell application "Terminal" to activate' -e 'tell application "Terminal" to do script "${escapedSession}"'`
    }

    if (/^open\s+-a\s+['\"]?terminal\b/i.test(terminalCommand.trim())) {
      const escapedSession = sessionCommand.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
      return `osascript -e 'tell application "Terminal" to activate' -e 'tell application "Terminal" to do script "${escapedSession}"'`
    }

    return sessionCommand
  }

  if (platform === 'win32') {
    const winPath = projectPath.replace(/"/g, '""')

    if (normalizedTerminal.includes('wt.exe') || normalizedTerminal === 'wt') {
      return `start wt.exe -d ${shellEscapeDoubleQuotes(projectPath)} cmd /k ${shellEscapeDoubleQuotes(commandToRun)}`
    }

    if (normalizedTerminal.includes('powershell')) {
      const escapedPath = projectPath.replace(/'/g, "''")
      const escapedCommand = commandToRun.replace(/`/g, '``').replace(/"/g, '`"')
      return `start powershell.exe -NoExit -Command "Set-Location -LiteralPath '${escapedPath}'; ${escapedCommand}"`
    }

    if (normalizedTerminal.includes('cmd')) {
      return `start cmd.exe /k "cd /d ""${winPath}"" && ${commandToRun}"`
    }

    return `start cmd.exe /k "cd /d ""${winPath}"" && ${commandToRun}"`
  }

  if (normalizedTerminal.includes('gnome-terminal')) {
    return `gnome-terminal --working-directory=${shellEscapeDoubleQuotes(projectPath)} -- bash -lc ${shellEscapeDoubleQuotes(`${commandToRun}; exec bash`)}`
  }

  if (normalizedTerminal.includes('ghostty')) {
    return `ghostty --working-directory=${shellEscapeDoubleQuotes(projectPath)} -e bash -lc ${shellEscapeDoubleQuotes(commandToRun)}`
  }

  if (normalizedTerminal.includes('warp')) {
    return `warp-terminal --cwd ${shellEscapeDoubleQuotes(projectPath)} -e bash -lc ${shellEscapeDoubleQuotes(commandToRun)}`
  }

  return sessionCommand
}
