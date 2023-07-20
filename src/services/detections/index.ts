import commandExists from 'command-exists'
import SettingsItem from '../../models/SettingsItem'
import execa from 'execa'
import Platform from '../../utils/platform'
import { getConfig } from '../config'

/**
 * Get a list of famous terminals installed on the system
 * @platform mac, windows, linux
 * - Hyper
 * - iTerm
 * @platform mac
 * - Terminal
 * @platform windows
 * - CMD
 * - PowerShell
 * - Windows Terminal
 * @platform linux
 * - GNOME Terminal
 */
export function getTerminalList(): Omit<SettingsItem, 'id'>[] {
  const terminalsByPlatform = Platform.select<string[]>({
    darwin: ['Hyper', 'iTerm', 'Terminal'],
    win32: ['CMD', 'PowerShell', 'Windows Terminal', 'Hyper', 'iTerm'],
    linux: ['GNOME Terminal', 'Hyper', 'iTerm'],
  })

  const list = [
    {
      name: 'Hyper',
      command: 'hyper',
    },
    {
      name: 'iTerm',
      command: Platform.select({
        darwin: 'open -a iTerm',
        win32: null,
        linux: 'iterm2',
      }),
    },
    {
      name: 'Terminal',
      command: Platform.select({
        darwin: 'open -a Terminal',
        win32: null,
        linux: null,
      }),
    },
    {
      name: 'CMD',
      command: Platform.select({
        darwin: null,
        win32: 'cmd',
        linux: null,
      }),
    },
    {
      name: 'PowerShell',
      command: Platform.select({
        darwin: null,
        win32: 'powershell',
        linux: 'powershell',
      }),
    },
    {
      name: 'Windows Terminal',
      command: Platform.select({
        darwin: null,
        win32: 'wt -d',
        linux: null,
      }),
    },
    {
      name: 'GNOME Terminal',
      command: Platform.select({
        darwin: null,
        win32: null,
        linux: 'gnome-terminal',
      }),
    },
  ]

  const filteredList = list
    .filter((item) => terminalsByPlatform.includes(item.name))
    .map((item) => {
      // if (commandExists.sync(item.command)) {
      const path = execa.commandSync(`which ${item.command}`, {
        reject: false,
      })

      if (!(item.name === 'Terminal') && (item.command === null || path.failed)) {
        return null
      }

      return new SettingsItem({
        command: item.command,
        name: item.name,
        path: path.stdout,
        isDefault: getConfig().defaultTerminal === item.name,
      })
      // }

      // return null;
    })
    .filter(Boolean)
    .filter((item) => item.path.length && item.command.length)

  return filteredList
}

/**
 * Get a list of famous IDES installed on the system
 * @platform mac, windows, linux
 * - Visual Studio Code
 * - Visual Studio
 * - Sublime Text
 * - Atom
 * - IntelliJ IDEA
 * - WebStorm
 * - PyCharm
 * - PhpStorm
 * - Android Studio
 * - Eclipse
 * - VIM
 * - Emacs
 * - Nano
 * - Geany
 * - GNU Text Editor
 * @platform windows
 * - Notepad++
 * - Notepad
 * @platform mac
 * - Xcode
 */
export function getEditorList(): Omit<SettingsItem, 'id'>[] {
  const list = [
    {
      name: 'Visual Studio Code',
      command: commandExists.sync('code') ? 'code' : null,
      shouldCheckCommand: true,
      shouldCheckPath: true,
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'Sublime Text',
      command: commandExists.sync('subl') ? 'subl' : null,
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'Atom',
      command: commandExists.sync('atom') ? 'atom' : null,
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'IntelliJ IDEA',
      command: Platform.select({
        darwin: "open -a 'IntelliJ IDEA'",
        win32: null,
        linux: commandExists.sync('intellij-idea') ? 'intellij-idea' : null,
      }),
    },
    {
      shouldCheckCommand: false,
      shouldCheckPath: false,
      name: 'IntelliJ IDEA CE',
      command: Platform.select({
        darwin: "open -a 'Intellij IDEA CE.app'",
        win32: null,
        linux: commandExists.sync('intellij-idea-community-edition') ? 'intellij-idea-community-edition' : null,
      }),
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'WebStorm',
      command: Platform.select({
        darwin: "open -a 'WebStorm'",
        win32: null,
        linux: commandExists.sync('webstorm') ? 'webstorm' : null,
      }),
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'PyCharm',
      command: Platform.select({
        darwin: "open -a 'PyCharm'",
        win32: null,
        linux: commandExists.sync('pycharm-community') ? 'pycharm-community' : null,
      }),
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'PhpStorm',
      command: Platform.select({
        darwin: "open -a 'PhpStorm'",
        win32: null,
        linux: commandExists.sync('phpstorm') ? 'phpstorm' : null,
      }),
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'Android Studio',
      command: Platform.select({
        darwin: "open -a 'Android Studio'",
        win32: null,
        linux: commandExists.sync('android-studio') ? 'android-studio' : null,
      }),
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'Xcode',
      command: Platform.select({
        darwin: "open -a 'Xcode'",
        win32: null,
        linux: null,
      }),
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'Eclipse',
      command: Platform.select({
        darwin: "open -a 'Eclipse'",
        win32: null,
        linux: commandExists.sync('eclipse') ? 'eclipse' : null,
      }),
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'Visual Studio',
      command: Platform.select({
        darwin: "open -a 'Visual Studio'",
        win32: commandExists.sync('visualstudio') ? 'visualstudio' : null,
        linux: null,
      }),
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'Notepad++',
      command: Platform.select({
        darwin: null,
        win32: commandExists.sync('notepad++') ? 'notepad++' : null,
        linux: null,
      }),
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'VIM',
      command: Platform.select({
        darwin: commandExists.sync('vim') ? "open -a 'VIM'" : null,
        win32: commandExists.sync('vim') ? 'vim' : null,
        linux: commandExists.sync('vim') ? 'vim' : null,
      }),
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'Emacs',
      command: Platform.select({
        darwin: commandExists.sync('emacs') ? 'emacs' : null,
        win32: commandExists.sync('emacs') ? 'emacs' : null,
        linux: commandExists.sync('emacs') ? 'emacs' : null,
      }),
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'Geany',
      command: Platform.select({
        darwin: null,
        win32: commandExists.sync('geany') ? 'geany' : null,
        linux: commandExists.sync('geany') ? 'geany' : null,
      }),
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'GNU Text Editor',
      command: Platform.select({
        darwin: null,
        win32: commandExists.sync('gedit') ? 'gedit' : null,
        linux: commandExists.sync('gedit') ? 'gedit' : null,
      }),
    },
    {
      shouldCheckCommand: true,
      shouldCheckPath: true,
      name: 'Notepad',
      command: Platform.select({
        darwin: null,
        win32: commandExists.sync('notepad') ? 'notepad' : null,
        linux: null,
      }),
    },
  ]

  const filteredList = list
    // .filter((item) => editorsByPlatform.includes(item.name))
    .map((item) => {
      const path = execa.commandSync(`which ${item.command}`, {
        reject: false,
      })

      if ((item.shouldCheckCommand && item.command === null) || (item.shouldCheckPath && path.failed)) {
        return null
      }

      return new SettingsItem({
        command: item.command,
        name: item.name,
        path: path.stdout,
        isDefault: getConfig().defaultEditor === item.name,
      })
    })
    .filter(Boolean)
    .filter((item) => item.path.length && item.command.length)

  return filteredList
}
