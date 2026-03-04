import { DefaultEditor, DefaultTerminal } from '../../constants/defaults'
import SettingsItem from '../../models/SettingsItem'
import Platform from '../../utils/platform'
import { getFilteredSettingsList } from './utils'

export type Settings = {
  name: string
  command: string | null
  binary: string | null
  enableBinaryCheck: boolean
  enableCommonPathCheck: boolean
  commonFilepaths: string[] | null
}

export const terminalList: Settings[] = [
  {
    name: 'Hyper',
    command: 'hyper',
    binary: 'hyper',
    enableBinaryCheck: true,
    enableCommonPathCheck: true,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Hyper.app'],
      linux: ['/opt/Hyper/hyper'],
      win32: ['C:\\Users\\%USERNAME%\\AppData\\Local\\hyper\\hyper.exe'],
    }),
  },
  {
    name: 'iTerm',
    command: 'open -a iTerm',
    binary: 'iterm',
    enableBinaryCheck: false,
    enableCommonPathCheck: true,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/iTerm.app'],
      linux: null,
      win32: null,
    }),
  },
  {
    name: 'Terminal',
    command: 'open -a Terminal',
    binary: 'terminal',
    enableBinaryCheck: false,
    enableCommonPathCheck: true,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Utilities/Terminal.app', '/System/Applications/Utilities/Terminal.app'],
      linux: null,
      win32: null,
    }),
  },
  {
    name: 'CMD',
    command: 'cmd.exe',
    binary: 'cmd.exe',
    enableBinaryCheck: false,
    enableCommonPathCheck: true,
    commonFilepaths: Platform.select({
      darwin: null,
      linux: null,
      win32: ['C:\\Windows\\System32\\cmd.exe'],
    }),
  },
  {
    name: 'PowerShell',
    command: 'powershell.exe',
    binary: 'powershell.exe',
    enableBinaryCheck: false,
    enableCommonPathCheck: true,
    commonFilepaths: Platform.select({
      darwin: null,
      linux: null,
      win32: ['C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'],
    }),
  },
  {
    name: 'Windows Terminal',
    command: 'wt.exe',
    binary: 'wt.exe',
    enableBinaryCheck: true,
    enableCommonPathCheck: true,
    commonFilepaths: Platform.select({
      darwin: null,
      linux: null,
      win32: ['C:\\Users\\%USERNAME%\\AppData\\Local\\Microsoft\\WindowsApps\\wt.exe'],
    }),
  },
  {
    name: 'GNOME Terminal',
    command: 'gnome-terminal',
    binary: 'gnome-terminal',
    enableBinaryCheck: true,
    enableCommonPathCheck: false,
    commonFilepaths: null,
  },
  {
    name: 'Warp',
    command: Platform.select({
      darwin: 'open -a Warp',
      linux: 'warp-terminal',
      win32: 'warp.exe',
    }),
    binary: 'warp',
    enableBinaryCheck: true,
    enableCommonPathCheck: true,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Warp.app'],
      linux: ['/usr/bin/warp-terminal'],
      win32: ['C:\\Users\\%USERNAME%\\AppData\\Local\\Warp\\warp.exe'],
    }),
  },
]

export const editorList: Settings[] = [
  {
    name: 'Visual Studio Code',
    binary: 'code',
    enableBinaryCheck: true,
    enableCommonPathCheck: true,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Visual Studio Code.app'],
      linux: ['/usr/share/code/bin/code'],
      win32: [
        'C:\\Program Files\\Microsoft VS Code\\Code.exe',
        'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
      ],
    }),
    command: Platform.select({
      darwin: 'code',
      linux: 'code',
      win32: 'code.cmd',
    }),
  },
  {
    name: 'Visual Studio Code Insiders',
    binary: 'code-insiders',
    enableBinaryCheck: true,
    enableCommonPathCheck: true,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Visual Studio Code - Insiders.app'],
      linux: ['/usr/share/code-insiders/bin/code-insiders'],
      win32: [
        'C:\\Program Files\\Microsoft VS Code Insiders\\Code - Insiders.exe',
        'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Microsoft VS Code Insiders\\Code - Insiders.exe',
      ],
    }),
    command: Platform.select({
      darwin: 'code-insiders',
      linux: 'code-insiders',
      win32: 'code-insiders.cmd',
    }),
  },
  {
    name: 'Visual Studio',
    command: Platform.select({
      darwin: 'open -a "Visual Studio"',
      linux: null,
      win32: 'devenv.exe',
    }),
    binary: 'devenv.exe',
    enableBinaryCheck: true,
    enableCommonPathCheck: true,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Visual Studio.app'],
      linux: null,
      win32: [
        'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\Common7\\IDE\\devenv.exe',
        'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Professional\\Common7\\IDE\\devenv.exe',
        'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Enterprise\\Common7\\IDE\\devenv.exe',
        'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\Common7\\IDE\\devenv.exe',
        'C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional\\Common7\\IDE\\devenv.exe',
        'C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\Common7\\IDE\\devenv.exe',
      ],
    }),
  },
  {
    name: 'Cursor',
    binary: 'cursor',
    enableBinaryCheck: true,
    enableCommonPathCheck: false,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Cursor.app'],
      linux: ['/usr/bin/cursor'],
      win32: ['C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Cursor\\Cursor.exe'],
    }),
    command: Platform.select({
      darwin: 'cursor',
      linux: 'cursor',
      win32: 'cursor.exe',
    }),
  },
  {
    name: 'Windsurf',
    binary: 'windsurf',
    enableBinaryCheck: true,
    enableCommonPathCheck: false,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Windsurf.app'],
      linux: ['/usr/bin/windsurf'],
      win32: ['C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Windsurf\\Windsurf.exe'],
    }),
    command: Platform.select({
      darwin: 'windsurf',
      linux: 'windsurf',
      win32: 'windsurf.exe',
    }),
  },
  {
    name: 'Sublime Text',
    command: 'subl',
    binary: 'subl',
    enableBinaryCheck: true,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Sublime Text.app'],
      win32: ['C:\\Program Files\\Sublime Text 3\\subl.exe'],
      linux: ['/usr/bin/subl'],
    }),
    enableCommonPathCheck: false,
  },
  {
    name: 'Atom',
    command: 'atom',
    binary: 'atom',
    enableBinaryCheck: true,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Atom.app'],
      win32: ['C:\\Users\\%USERNAME%\\AppData\\Local\\atom\\atom.exe'],
      linux: ['/usr/bin/atom'],
    }),
    enableCommonPathCheck: false,
  },
  {
    binary: null,
    name: 'IntelliJ IDEA CE',
    enableBinaryCheck: false,
    command: Platform.select({
      darwin: 'open -a "IntelliJ IDEA CE"',
      linux: 'idea.sh',
      win32: 'idea64.exe',
    }),
    enableCommonPathCheck: true,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/IntelliJ IDEA CE.app'],
      linux: ['/usr/share/intellij-idea-ce/bin/idea.sh'],
      win32: ['C:\\Program Files\\JetBrains\\IntelliJ IDEA Community Edition 2023.1.4\\bin\\idea64.exe'],
    }),
  },
  {
    name: 'PyCharm CE',
    binary: null,
    enableBinaryCheck: false,
    enableCommonPathCheck: true,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/PyCharm CE.app'],
      linux: ['/usr/share/pycharm/bin/pycharm.sh'],
      win32: ['C:\\Program Files\\JetBrains\\PyCharm Community Edition 2023.1.4\\bin\\pycharm64.exe'],
    }),
    command: Platform.select({
      darwin: 'open -a PyCharm CE',
      linux: null,
      win32: null,
    }),
  },
  {
    name: 'PyCharm',
    binary: 'pycharm',
    enableBinaryCheck: true,
    enableCommonPathCheck: true,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/PyCharm.app'],
      linux: ['/usr/share/pycharm/bin/pycharm.sh'],
      win32: ['C:\\Program Files\\JetBrains\\PyCharm\\bin\\pycharm64.exe'],
    }),
    command: Platform.select({
      darwin: 'pycharm',
      linux: null,
      win32: null,
    }),
  },
  {
    name: 'Android Studio',
    binary: null,
    enableBinaryCheck: false,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Android Studio.app'],
      linux: ['/usr/share/android-studio/bin/studio.sh'],
      win32: ['C:\\Program Files\\Android\\Android Studio\\bin\\studio64.exe'],
    }),
    enableCommonPathCheck: true,
    command: Platform.select({
      darwin: `open -a "Android Studio"`,
      linux: null,
      win32: null,
    }),
  },
  {
    name: 'Xcode',
    binary: 'xed',
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Xcode.app'],
      linux: null,
      win32: null,
    }),
    enableBinaryCheck: false,
    enableCommonPathCheck: true,
    command: Platform.select({
      darwin: 'xed -b',
      linux: null,
      win32: null,
    }),
  },
  {
    name: 'Geany',
    binary: 'geany',
    enableBinaryCheck: true,
    enableCommonPathCheck: false,
    commonFilepaths: Platform.select({
      darwin: null,
      linux: ['/usr/bin/geany'],
      win32: null,
    }),
    command: Platform.select({
      darwin: 'open -a Geany',
      linux: 'geany',
      win32: null,
    }),
  },
  {
    name: 'Gedit',
    binary: 'gedit',
    enableBinaryCheck: true,
    enableCommonPathCheck: false,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Gedit.app'],
      linux: ['/usr/bin/gedit'],
      win32: null,
    }),
    command: Platform.select({
      darwin: 'gedit',
      linux: 'gedit',
      win32: null,
    }),
  },
]

export function getTerminalList(): SettingsItem[] {
  return getFilteredSettingsList(terminalList)
}

export function getEditorList(): SettingsItem[] {
  return getFilteredSettingsList(editorList)
}

export const defaultConfig = {
  editorList: getEditorList(),
  terminalList: getTerminalList(),
  defaultTerminal: DefaultTerminal,
  defaultEditor: DefaultEditor,
}

export default defaultConfig
