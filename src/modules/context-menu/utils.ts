import { dialog, shell } from 'electron'
import Platform from '../../utils/platform'
import { commandSync } from 'execa'
import commandExists from 'command-exists'
import getTranslation from '../../i18n'
import { getConfig } from '../../services/config'
import { getEditorList, getTerminalList } from '../../services/detections'
import SettingsItem from '../../models/SettingsItem'

export async function openFolder(path: string): Promise<void> {
  await shell.openPath(path)
}

export function openVscode(path: string): void {
  const isCodeInPath = commandExists.sync('code')

  const open = Platform.select({
    darwin: () => {
      isCodeInPath ? commandSync(`code ${path}`) : shell.openExternal('vscode://file' + path)
    },
    win32: () => {
      if (isCodeInPath) {
        commandSync(`code ${path}`)
      } else {
        dialog.showErrorBox('Error', getTranslation('vscodeNotFound') + path)
        shell.openPath(path)
      }
    },
    linux: () => {
      if (isCodeInPath) {
        commandSync(`code ${path}`)
      } else {
        dialog.showErrorBox('Error', getTranslation('vscodeNotFound') + path)
        shell.openPath(path)
      }
    },
  })

  open()
}

export function openTerminal(path: string, terminal: Omit<SettingsItem, 'id'>): void {
  const config = getConfig()

  const openDefault = getTerminalList().find((item) => item.name === config.defaultTerminal)?.command

  if (terminal) {
    commandSync(`${terminal.command} ${path}`)
  } else {
    commandSync(`${openDefault} ${path}`)
  }
}

export function openEditor(path: string, editor: Omit<SettingsItem, 'id'>): void {
  const config = getConfig()

  const openDefault = getEditorList().find((item) => item.name === config.defaultEditor)?.command

  if (editor) {
    commandSync(`${editor.command} ${path}`)
  } else {
    commandSync(`${openDefault} ${path}`)
  }
}

export function openGithubDesktop(path: string): void {
  const isGithubDesktopInPath = commandExists.sync('github-desktop')

  if (isGithubDesktopInPath) {
    const command = Platform.select({
      darwin: 'github',
      win32: 'github',
      linux: 'github-desktop',
    })

    commandSync(`${command} ${path}`)
  }
}
