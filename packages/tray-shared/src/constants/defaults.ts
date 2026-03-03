import SettingsItem from '../models/SettingsItem'
import Platform from '../utils/platform'
import { SUPPORTED } from './detections'

const selectRequired = <T>(options: Partial<Record<NodeJS.Platform, T>>): T => {
  const value = Platform.select(options)

  if (value === null) {
    throw new Error(`Unsupported platform: ${Platform.OS}`)
  }

  return value
}

export const DefaultTerminal = new SettingsItem({
  name: selectRequired({
    darwin: SUPPORTED.TERMINALS.TERMINAL,
    win32: SUPPORTED.TERMINALS.CMD,
    linux: SUPPORTED.TERMINALS.GNOME_TERMINAL,
  }),
  command: selectRequired({
    darwin: 'open -a Terminal',
    win32: 'cmd',
    linux: 'gnome-terminal',
  }),
  isDefault: true,
  path: selectRequired({
    darwin: '/Applications/Utilities/Terminal.app',
    win32: '$(where cmd)',
    linux: '$(which gnome-terminal)',
  }),
})

export const DefaultEditor = new SettingsItem({
  name: selectRequired({
    darwin: SUPPORTED.EDITORS.VSCODE,
    win32: SUPPORTED.EDITORS.VSCODE,
    linux: SUPPORTED.EDITORS.VSCODE,
  }),
  command: selectRequired({
    darwin: 'code',
    win32: 'code',
    linux: 'code',
  }),
  isDefault: true,
  path: selectRequired({
    darwin: '$(which code)',
    win32: '$(where code)',
    linux: '$(which code)',
  }),
})
