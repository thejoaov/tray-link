import SettingsItem from '../models/SettingsItem.js'
import Platform from '../utils/platform.js'
import { SUPPORTED } from './detections.js'

export const DefaultTerminal = new SettingsItem({
  name: Platform.select({
    darwin: SUPPORTED.TERMINALS.TERMINAL,
    win32: SUPPORTED.TERMINALS.CMD,
    linux: SUPPORTED.TERMINALS.GNOME_TERMINAL,
  }),
  command: Platform.select({
    darwin: 'open -a Terminal',
    win32: 'cmd',
    linux: 'gnome-terminal',
  }),
  isDefault: true,
  path: Platform.select({
    darwin: '/Applications/Utilities/Terminal.app',
    win32: '$(where cmd)',
    linux: '$(which gnome-terminal)',
  }),
})

export const DefaultEditor = new SettingsItem({
  name: Platform.select({
    darwin: SUPPORTED.EDITORS.VSCODE,
    win32: SUPPORTED.EDITORS.VSCODE,
    linux: SUPPORTED.EDITORS.VSCODE,
  }),
  command: Platform.select({
    darwin: 'code',
    win32: 'code',
    linux: 'code',
  }),
  isDefault: true,
  path: Platform.select({
    darwin: '$(which code)',
    win32: '$(where code)',
    linux: '$(which code)',
  }),
})
