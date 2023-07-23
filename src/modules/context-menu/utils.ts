import { dialog, shell } from 'electron'
import Platform from '../../utils/platform'
import execa from 'execa'
import commandExists from 'command-exists'
import getTranslation from '../../i18n'
import SettingsItem from '../../models/SettingsItem'
import { spawn } from 'child_process'

export async function openFolder(path: string): Promise<void> {
  await shell.openPath(path)
}

export function openVscode(path: string): void {
  const isCodeInPath = commandExists.sync('code')

  const open = Platform.select({
    darwin: () => {
      isCodeInPath ? execa.commandSync(`code ${path}`, { detached: true }) : shell.openExternal('vscode://file' + path)
    },
    win32: () => {
      if (isCodeInPath) {
        execa.commandSync(`code ${path}`, { detached: true })
      } else {
        dialog.showErrorBox('Error', getTranslation('vscodeNotFound') + path)
        shell.openPath(path)
      }
    },
    linux: () => {
      if (isCodeInPath) {
        execa.commandSync(`code ${path}`, { detached: true })
      } else {
        dialog.showErrorBox('Error', getTranslation('vscodeNotFound') + path)
        shell.openPath(path)
      }
    },
  })

  open()
}

export async function openTerminal(path: string, terminal: SettingsItem): Promise<void> {
  try {
    await execa.command(`${terminal.command ?? terminal.path} ${path}`, {
      detached: true,
      shell: true,
    })
  } catch (error) {
    try {
      await execa.command(`${terminal.command ?? terminal.path} ${path}`, {
        detached: true,
      })
    } catch (error2) {
      dialog.showErrorBox(
        'Error',
        `${terminal.command ?? terminal.path} ${path}

        ${error2}
        `,
      )
    }
  }
}

export async function openEditor(path: string, editor: SettingsItem): Promise<void> {
  try {
    await execa.command(`${editor.command ?? editor.path} ${path}`, {
      detached: true,
      shell: true,
    })
  } catch (error) {
    try {
      await execa.command(`${editor.command ?? editor.path} ${path}`, {
        detached: true,
      })
    } catch (error2) {
      dialog.showErrorBox(
        'Error',
        `${editor.command ?? editor.path} ${path}

        ${error2}
        `,
      )
    }
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

    execa.commandSync(`${command} ${path}`, { detached: true })
  }
}
