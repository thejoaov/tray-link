import Platform from '../../utils/platform'
import SettingsItem from '../../models/SettingsItem'
import execa from 'execa'
import { DefaultEditor, DefaultTerminal } from '../../constants/defaults'
import { SettingsSchema } from '../store/schema'

export type Settings = {
  name: string
  command: string
}

export const terminalList: Settings[] = [
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

export const editorList: Settings[] = [
  {
    name: 'Visual Studio Code',
    command: 'code',
  },
  {
    name: 'Sublime Text',
    command: 'subl',
  },
  {
    name: 'Atom',
    command: 'atom',
  },
  {
    name: 'IntelliJ IDEA',
    command: 'command',
  },
  {
    name: 'IntelliJ IDEA CE',
    command: 'command',
  },
  {
    name: 'WebStorm',
    command: 'command',
  },
  {
    name: 'PyCharm',
    command: 'command',
  },
  {
    name: 'PhpStorm',
    command: 'command',
  },
  {
    name: 'Android Studio',
    command: 'command',
  },
  {
    name: 'Xcode',
    command: 'command',
  },
  {
    name: 'Eclipse',
    command: 'command',
  },
  {
    name: 'Visual Studio',
    command: 'command',
  },
  {
    name: 'Notepad++',
    command: 'command',
  },
  {
    name: 'VIM',
    command: 'command',
  },
  {
    name: 'Emacs',
    command: 'command',
  },
  {
    name: 'Geany',
    command: 'command',
  },
  {
    name: 'GNU Text Editor',
    command: 'command',
  },
  {
    name: 'Notepad',
    command: 'command',
  },
]

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
  const filteredList = terminalList
    .map((item) => {
      const path = execa.commandSync(`which ${item.command}`, {
        reject: false,
      })

      return new SettingsItem({
        command: item.command,
        name: item.name,
        path: path.stdout ?? '',
        isDefault: item.name === DefaultTerminal.name,
      })
    })
    .filter((item) => item.command)

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
 * - Geany
 * - GNU Text Editor
 * @platform windows
 * - Notepad++
 * - Notepad
 * @platform mac
 * - Xcode
 */
export function getEditorList(): Omit<SettingsItem, 'id'>[] {
  const filteredList = editorList
    .map((item) => {
      const path = execa.commandSync(`which ${item.command}`, {
        reject: false,
      })

      return new SettingsItem({
        command: item.command,
        name: item.name,
        path: path.stdout ?? '',
        isDefault: item.name === DefaultEditor.name,
      })
    })
    .filter(Boolean)
    .filter((item) => item.command)

  return filteredList
}

const defaultConfig = {
  editorList: getEditorList(),
  terminalList: getTerminalList(),
  defaultTerminal: DefaultTerminal,
  defaultEditor: DefaultEditor,
} as SettingsSchema

export default defaultConfig
