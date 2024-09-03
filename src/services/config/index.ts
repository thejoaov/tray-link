import fs from 'fs'
import path from 'path'
import { app } from 'electron'
import { DefaultEditor, DefaultTerminal } from '../../constants/defaults.js'
import SettingsItem from '../../models/SettingsItem.js'
import Platform from '../../utils/platform.js'
import { SettingsSchema } from '../store/schema.js'
import { getFilteredSettingsList } from './utils.js'

if (!fs.existsSync(path.join(app.getPath('home'), '.tray-link'))) {
  fs.mkdirSync(path.join(app.getPath('home'), '.tray-link'))

  if (!fs.existsSync(path.join(app.getPath('home'), '.tray-link', 'logs'))) {
    fs.mkdirSync(path.join(app.getPath('home'), '.tray-link', 'logs'))
  }
}

export type Settings = {
  name: string
  command: string | null
  binary: string
  enableBinaryCheck: boolean
  enableCommonPathCheck: boolean
  commonFilepaths: string[] | null
}

export const terminalList: Settings[] = [
  {
    name: 'Hyper',
    command: 'hyper',
    binary: null,
    enableBinaryCheck: false,
    enableCommonPathCheck: true,
    commonFilepaths: ['/Applications/Hyper.app'],
  },
  {
    name: 'iTerm',
    binary: 'iTerm',
    enableCommonPathCheck: true,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/iTerm.app'],
      win32: null, // Not available
      linux: null, // Not available
    }),
    command: Platform.select({
      darwin: 'open -a iTerm',
      win32: null, // Not available
      linux: 'iterm2',
    }),
    enableBinaryCheck: Platform.select({
      darwin: false,
      win32: true,
      linux: true,
    }),
  },
  {
    name: 'Terminal',
    binary: 'Terminal',
    commonFilepaths: [
      '/Applications/Utilities/Terminal.app',
      '/System/Applications/Utilities/Terminal.app',
      '/System/Applications/Terminal.app',
      '/Applications/Terminal.app',
    ],
    enableCommonPathCheck: true, // Nearly pointless, but it is possible to uninstall it
    enableBinaryCheck: false, // As it is impossible due to the way it is installed
    command: Platform.select({
      darwin: 'open -a Terminal',
      win32: null, // Not available
      linux: null, // Not available
    }),
  },
  {
    name: 'CMD',
    binary: 'cmd',
    enableBinaryCheck: true, // Not sure if its possible to uninstall it anyway
    enableCommonPathCheck: false, // Not sure if its possible to uninstall it anyway
    commonFilepaths: Platform.select({
      darwin: null, // Not available
      win32: ['C:\\Windows\\System32\\cmd.exe'],
      linux: null, // Not available
    }),
    command: Platform.select({
      darwin: null, // Not available
      win32: 'cmd',
      linux: null, // Not available
    }),
  },
  {
    name: 'PowerShell',
    binary: 'PowerShell.exe',
    enableBinaryCheck: true,
    enableCommonPathCheck: false, // Not sure if its possible to uninstall it anyway
    commonFilepaths: Platform.select({
      darwin: null, // Not available
      win32: ['C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'],
      linux: null, // Not available
    }),
    command: Platform.select({
      darwin: 'powershell',
      win32: 'powershell.exe',
      linux: 'powershell',
    }),
  },
  {
    name: 'PowerShell 2',
    binary: 'PowerShell.exe',
    enableBinaryCheck: true,
    commonFilepaths: Platform.select({
      darwin: null, // Not available
      win32: ['C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'],
      linux: null, // Not available
    }),
    enableCommonPathCheck: false, // Not sure if its possible to uninstall it anyway
    command: Platform.select({
      darwin: 'powershell',
      win32: 'PowerShell.exe -Version 2',
      linux: 'powershell',
    }),
  },
  {
    name: 'Windows Terminal',
    binary: 'wt',
    enableBinaryCheck: true,
    commonFilepaths: Platform.select({
      darwin: null, // Not available
      win32: ['C:\\Windows\\System32\\wt.exe'],
      linux: null, // Not available
    }),
    enableCommonPathCheck: false, // Not needed
    command: Platform.select({
      darwin: null, // Not available
      win32: 'wt -d',
      linux: null, // Not available
    }),
  },
  {
    name: 'GNOME Terminal',
    binary: 'gnome-terminal',
    enableBinaryCheck: true,
    commonFilepaths: Platform.select({
      darwin: null, // Not available
      win32: null, // Not available
      linux: ['/usr/bin/gnome-terminal'],
    }),
    enableCommonPathCheck: false, // Not needed
    command: Platform.select({
      darwin: null, // Not available
      win32: null, // Not available
      linux: 'gnome-terminal',
    }),
  },
]

export const editorList: Settings[] = [
  {
    name: 'Visual Studio Code',
    command: 'code',
    binary: 'code',
    enableBinaryCheck: Platform.OS !== 'win32',
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Visual Studio Code.app'],
      win32: [
        'C:\\Program Files\\Microsoft VS Code\\Code.exe',
        'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
      ],
      linux: ['/usr/share/code/code'],
    }),
    enableCommonPathCheck: false, // Checking for binary is enough
  },
  {
    name: 'Zed',
    binary: 'zed',
    enableBinaryCheck: true,
    enableCommonPathCheck: false,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Zed.app'],
      linux: ['/usr/bin/zed'],
      win32: null, // Not available
    }),
    command: Platform.select({
      darwin: 'zed',
      linux: 'zed',
      win32: null, // Not available
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
      win32: null, // Not available
    }),
    command: Platform.select({
      darwin: 'cursor',
      linux: 'cursor',
      win32: null, // Not available
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
    enableCommonPathCheck: false, // Checking for binary is enough
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
    enableCommonPathCheck: false, // Checking for binary is enough
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
      win32: [
        // 2020
        'C:\\Program Files\\JetBrains\\IntelliJ IDEA Community Edition 2020.1.4\\bin\\idea64.exe',
        'C:\\Program Files\\JetBrains\\IntelliJ IDEA Community Edition 2020.2.4\\bin\\idea64.exe',
        'C:\\Program Files\\JetBrains\\IntelliJ IDEA Community Edition 2020.3.4\\bin\\idea64.exe',
        // 2021
        'C:\\Program Files\\JetBrains\\IntelliJ IDEA Community Edition 2021.1.3\\bin\\idea64.exe',
        'C:\\Program Files\\JetBrains\\IntelliJ IDEA Community Edition 2021.2.4\\bin\\idea64.exe',
        'C:\\Program Files\\JetBrains\\IntelliJ IDEA Community Edition 2021.3.3\\bin\\idea64.exe',
        // 2022
        'C:\\Program Files\\JetBrains\\IntelliJ IDEA Community Edition 2022.1.4\\bin\\idea64.exe',
        'C:\\Program Files\\JetBrains\\IntelliJ IDEA Community Edition 2022.2.5\\bin\\idea64.exe',
        'C:\\Program Files\\JetBrains\\IntelliJ IDEA Community Edition 2022.3.3\\bin\\idea64.exe',
        // 2023
        'C:\\Program Files\\JetBrains\\IntelliJ IDEA Community Edition 2023.1.4\\bin\\idea64.exe',
      ],
    }),
  },
  {
    name: 'PyCharm',
    binary: null,
    enableBinaryCheck: false,
    enableCommonPathCheck: true,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/PyCharm.app'],
      linux: ['/usr/share/pycharm/bin/pycharm.sh'],
      win32: [
        //2020
        'C:\\Program Files\\JetBrains\\PyCharm Community Edition 2020.1.5\\bin\\pycharm64.exe',
        'C:\\Program Files\\JetBrains\\PyCharm Community Edition 2020.2.5\\bin\\pycharm64.exe',
        'C:\\Program Files\\JetBrains\\PyCharm Community Edition 2020.3.5\\bin\\pycharm64.exe',
        // 2021
        'C:\\Program Files\\JetBrains\\PyCharm Community Edition 2021.1.3\\bin\\pycharm64.exe',
        'C:\\Program Files\\JetBrains\\PyCharm Community Edition 2021.2.4\\bin\\pycharm64.exe',
        'C:\\Program Files\\JetBrains\\PyCharm Community Edition 2021.3.3\\bin\\pycharm64.exe',
        // 2022
        'C:\\Program Files\\JetBrains\\PyCharm Community Edition 2022.1.4\\bin\\pycharm64.exe',
        'C:\\Program Files\\JetBrains\\PyCharm Community Edition 2022.2.5\\bin\\pycharm64.exe',
        'C:\\Program Files\\JetBrains\\PyCharm Community Edition 2022.3.3\\bin\\pycharm64.exe',
        // 2023
        'C:\\Program Files\\JetBrains\\PyCharm Community Edition 2023.1.4\\bin\\pycharm64.exe',
      ],
    }),
    command: Platform.select({
      darwin: 'open -a PyCharm',
      linux: null, // TODO: find command
      win32: null, // TODO: find command
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
      linux: null, // TODO: find command
      win32: null, // TODO: find command
    }),
  },
  {
    name: 'Android Studio',
    binary: null,
    enableBinaryCheck: false,
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Android Studio.app'],
      linux: ['/usr/share/android-studio/bin/studio.sh'],
      win32: [
        // 2020
        'C:\\Program Files\\Android\\Android Studio\\bin\\studio64.exe',
      ],
    }),
    enableCommonPathCheck: true,
    command: Platform.select({
      darwin: `open -a "Android Studio"`,
      linux: null, // TODO: find command
      win32: null, // TODO: find command
    }),
  },
  {
    name: 'Xcode',
    binary: 'xed',
    commonFilepaths: Platform.select({
      darwin: ['/Applications/Xcode.app'],
      linux: null, // Not available
      win32: null, // Not available
    }),
    enableBinaryCheck: false,
    enableCommonPathCheck: true,
    command: Platform.select({
      darwin: 'xed -b',
      linux: null, // Not available
      win32: null, // Not available
    }),
  },
  {
    name: 'Geany',
    binary: 'geany',
    enableBinaryCheck: true,
    enableCommonPathCheck: false,
    commonFilepaths: Platform.select({
      darwin: null, // Not available
      linux: ['/usr/bin/geany'],
      win32: null, // Not available
    }),
    command: Platform.select({
      darwin: 'open -a Geany',
      linux: 'geany',
      win32: null, // TODO: find command
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
      win32: null, // Not available
    }),
    command: Platform.select({
      darwin: 'gedit',
      linux: 'gedit',
      win32: null, // TODO: find command
    }),
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
export function getTerminalList(): SettingsItem[] {
  const buildTerminalList = getFilteredSettingsList(terminalList)

  fs.writeFileSync(
    path.join(app.getPath('home'), '.tray-link', 'logs', 'buildTerminalList.json'),
    JSON.stringify(buildTerminalList),
  )
  fs.writeFileSync(
    path.join(app.getPath('home'), '.tray-link', 'logs', 'terminalList.json'),
    JSON.stringify(terminalList),
  )

  return buildTerminalList
}

/**
 * Get a list of famous IDES installed on the system
 * @platform mac, windows, linux
 * - Visual Studio Code
 * - Visual Studio
 * - Sublime Text
 * - Atom
 * - IntelliJ IDEA
 * - Android Studio
 * - Geany
 * @platform mac
 * - Xcode
 */
export function getEditorList(): SettingsItem[] {
  const buildEditorList = getFilteredSettingsList(editorList)

  fs.writeFileSync(
    path.join(app.getPath('home'), '.tray-link', 'logs', 'buildEditorList.json'),
    JSON.stringify(buildEditorList),
  )
  fs.writeFileSync(
    // Debug only
    path.join(app.getPath('home'), '.tray-link', 'logs', 'editorList.json'),
    JSON.stringify(editorList),
  )

  return buildEditorList
}

const defaultConfig = {
  editorList: getEditorList(),
  terminalList: getTerminalList(),
  defaultTerminal: DefaultTerminal,
  defaultEditor: DefaultEditor,
} as SettingsSchema

export default defaultConfig
