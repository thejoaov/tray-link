import { CustomTool } from '@tray-link/common-types'
import { EmitterSubscription } from 'react-native'
import { fileExists, which } from '../../modules/shell-utils/src'
import { DeviceEventEmitter } from '../modules/DeviceEventEmitter'
import { defaultUserPreferences, getUserPreferences, saveUserPreferences, UserPreferences } from '../modules/Storage'

export type ToolOption = {
  label: string
  command: string
}

type DiscoverableTool = {
  label: string
  command: string
  binary?: string
  commonFilepaths?: string[]
  alwaysAvailable?: boolean
}

const EDITOR_CANDIDATES: DiscoverableTool[] = [
  {
    label: 'Visual Studio Code',
    command: 'code',
    binary: 'code',
    commonFilepaths: [
      '/Applications/Visual Studio Code.app',
      '/usr/share/code/bin/code',
      'C:\\Program Files\\Microsoft VS Code\\Code.exe',
      'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
    ],
  },
  {
    label: 'Visual Studio Code Insiders',
    command: 'code-insiders',
    binary: 'code-insiders',
    commonFilepaths: [
      '/Applications/Visual Studio Code - Insiders.app',
      '/usr/share/code-insiders/bin/code-insiders',
      'C:\\Program Files\\Microsoft VS Code Insiders\\Code - Insiders.exe',
      'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Microsoft VS Code Insiders\\Code - Insiders.exe',
    ],
  },
  {
    label: 'Visual Studio',
    command: 'open -a "Visual Studio"',
    binary: 'devenv.exe',
    commonFilepaths: [
      '/Applications/Visual Studio.app',
      'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community\\Common7\\IDE\\devenv.exe',
      'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Professional\\Common7\\IDE\\devenv.exe',
      'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Enterprise\\Common7\\IDE\\devenv.exe',
      'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\Common7\\IDE\\devenv.exe',
      'C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional\\Common7\\IDE\\devenv.exe',
      'C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise\\Common7\\IDE\\devenv.exe',
    ],
  },
  {
    label: 'Cursor',
    command: 'cursor',
    binary: 'cursor',
    commonFilepaths: [
      '/Applications/Cursor.app',
      '/usr/bin/cursor',
      'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Cursor\\Cursor.exe',
    ],
  },
  {
    label: 'Windsurf',
    command: 'windsurf',
    binary: 'windsurf',
    commonFilepaths: [
      '/Applications/Windsurf.app',
      '/usr/bin/windsurf',
      'C:\\Users\\%USERNAME%\\AppData\\Local\\Programs\\Windsurf\\Windsurf.exe',
    ],
  },
  {
    label: 'Sublime Text',
    command: 'subl',
    binary: 'subl',
    commonFilepaths: ['/Applications/Sublime Text.app', '/usr/bin/subl', 'C:\\Program Files\\Sublime Text 3\\subl.exe'],
  },
  {
    label: 'Atom',
    command: 'atom',
    binary: 'atom',
    commonFilepaths: [
      '/Applications/Atom.app',
      '/usr/bin/atom',
      'C:\\Users\\%USERNAME%\\AppData\\Local\\atom\\atom.exe',
    ],
  },
  {
    label: 'IntelliJ IDEA CE',
    command: 'open -a "IntelliJ IDEA CE"',
    commonFilepaths: [
      '/Applications/IntelliJ IDEA CE.app',
      '/usr/share/intellij-idea-ce/bin/idea.sh',
      'C:\\Program Files\\JetBrains\\IntelliJ IDEA Community Edition 2023.1.4\\bin\\idea64.exe',
    ],
  },
  {
    label: 'PyCharm CE',
    command: 'open -a PyCharm CE',
    commonFilepaths: [
      '/Applications/PyCharm CE.app',
      '/usr/share/pycharm/bin/pycharm.sh',
      'C:\\Program Files\\JetBrains\\PyCharm Community Edition 2023.1.4\\bin\\pycharm64.exe',
    ],
  },
  {
    label: 'PyCharm',
    command: 'pycharm',
    binary: 'pycharm',
    commonFilepaths: [
      '/Applications/PyCharm.app',
      '/usr/share/pycharm/bin/pycharm.sh',
      'C:\\Program Files\\JetBrains\\PyCharm\\bin\\pycharm64.exe',
    ],
  },
  {
    label: 'Android Studio',
    command: 'open -a "Android Studio"',
    commonFilepaths: [
      '/Applications/Android Studio.app',
      '/usr/share/android-studio/bin/studio.sh',
      'C:\\Program Files\\Android\\Android Studio\\bin\\studio64.exe',
    ],
  },
  {
    label: 'Xcode',
    command: 'xed -b',
    binary: 'xed',
    commonFilepaths: ['/Applications/Xcode.app'],
  },
  {
    label: 'Geany',
    command: 'open -a Geany',
    binary: 'geany',
    commonFilepaths: ['/usr/bin/geany'],
  },
  {
    label: 'Gedit',
    command: 'gedit',
    binary: 'gedit',
    commonFilepaths: ['/Applications/Gedit.app', '/usr/bin/gedit'],
  },
]

const TERMINAL_CANDIDATES: DiscoverableTool[] = [
  {
    label: 'Terminal',
    command: 'open -a Terminal',
    alwaysAvailable: true,
    commonFilepaths: ['/Applications/Utilities/Terminal.app', '/System/Applications/Utilities/Terminal.app'],
  },
  {
    label: 'iTerm',
    command: 'open -a iTerm',
    binary: 'iterm',
    commonFilepaths: ['/Applications/iTerm.app'],
  },
  {
    label: 'Warp',
    command: 'open -a Warp',
    binary: 'warp',
    commonFilepaths: ['/Applications/Warp.app'],
  },
  {
    label: 'Hyper',
    command: 'hyper',
    binary: 'hyper',
    commonFilepaths: ['/Applications/Hyper.app'],
  },
  {
    label: 'CMD',
    command: 'cmd.exe',
    binary: 'cmd.exe',
    commonFilepaths: ['C:\\Windows\\System32\\cmd.exe'],
  },
  {
    label: 'PowerShell',
    command: 'powershell.exe',
    binary: 'powershell.exe',
    commonFilepaths: ['C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'],
  },
  {
    label: 'Windows Terminal',
    command: 'wt.exe',
    binary: 'wt.exe',
    commonFilepaths: ['C:\\Users\\%USERNAME%\\AppData\\Local\\Microsoft\\WindowsApps\\wt.exe'],
  },
  {
    label: 'GNOME Terminal',
    command: 'gnome-terminal',
    binary: 'gnome-terminal',
  },
]

export const PREFERENCES_CHANGED_EVENT = 'preferencesChanged'

let discoveredEditorOptions: ToolOption[] = []
let discoveredTerminalOptions: ToolOption[] = []

export const loadPreferences = (): UserPreferences => {
  return { ...defaultUserPreferences, ...getUserPreferences() }
}

export const persistPreferences = (next: UserPreferences) => {
  saveUserPreferences(next)
  DeviceEventEmitter.emit(PREFERENCES_CHANGED_EVENT)
}

export const subscribePreferencesChange = (listener: () => void): EmitterSubscription => {
  return DeviceEventEmitter.addListener(PREFERENCES_CHANGED_EVENT, listener)
}

const isToolInstalled = async (tool: DiscoverableTool): Promise<boolean> => {
  if (tool.alwaysAvailable) {
    return true
  }

  if (tool.binary) {
    const binaryPath = await which(tool.binary)
    if (binaryPath) {
      return true
    }
  }

  if (tool.commonFilepaths?.length) {
    for (const filepath of tool.commonFilepaths) {
      if (await fileExists(filepath)) {
        return true
      }
    }
  }

  return false
}

const discoverTools = async (candidates: DiscoverableTool[]): Promise<ToolOption[]> => {
  const discovered: ToolOption[] = []

  for (const tool of candidates) {
    const installed = await isToolInstalled(tool)
    if (installed) {
      discovered.push({ label: tool.label, command: tool.command })
    }
  }

  return discovered
}

export const reloadToolOptions = async () => {
  const [editors, terminals] = await Promise.all([discoverTools(EDITOR_CANDIDATES), discoverTools(TERMINAL_CANDIDATES)])

  discoveredEditorOptions = dedupeOptions(editors)
  discoveredTerminalOptions = dedupeOptions(terminals)
  DeviceEventEmitter.emit(PREFERENCES_CHANGED_EVENT)
}

export const initializeToolOptions = async () => {
  if (discoveredEditorOptions.length || discoveredTerminalOptions.length) {
    return
  }

  await reloadToolOptions()
}

export const getEditorOptions = (customEditors: CustomTool[] = []): ToolOption[] => {
  const custom = customEditors.map((item) => ({ label: item.name, command: item.command }))
  return dedupeOptions([...discoveredEditorOptions, ...custom])
}

export const getTerminalOptions = (customTerminals: CustomTool[] = []): ToolOption[] => {
  const custom = customTerminals.map((item) => ({ label: item.name, command: item.command }))
  return dedupeOptions([...discoveredTerminalOptions, ...custom])
}

const dedupeOptions = (options: ToolOption[]) => {
  const map = new Map<string, ToolOption>()
  options.forEach((option) => map.set(option.command, option))
  return [...map.values()]
}
