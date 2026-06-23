import { DefaultEditor, DefaultTerminal } from '../../constants/defaults'
import {
  getSupportedToolDefinitions,
  SupportedToolDefinition,
  ToolCatalogPlatform,
} from '../../constants/supportedTools'
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

const resolveCatalogPlatform = (): ToolCatalogPlatform | null => {
  if (Platform.OS === 'darwin' || Platform.OS === 'linux' || Platform.OS === 'win32') {
    return Platform.OS
  }

  return null
}

const toSettings = (definition: SupportedToolDefinition): Settings => ({
  name: definition.name,
  command: definition.command,
  binary: definition.binary,
  enableBinaryCheck: definition.enableBinaryCheck,
  enableCommonPathCheck: definition.enableCommonPathCheck,
  commonFilepaths: definition.commonFilepaths.length ? definition.commonFilepaths : null,
})

const resolveSettingsList = (type: 'editors' | 'terminals' | 'aiTools'): Settings[] => {
  const platform = resolveCatalogPlatform()
  if (!platform) {
    return []
  }

  return getSupportedToolDefinitions(type, platform).map(toSettings)
}

export const terminalList: Settings[] = resolveSettingsList('terminals')

export const editorList: Settings[] = resolveSettingsList('editors')

export const aiToolList: Settings[] = resolveSettingsList('aiTools')

export function getTerminalList(): Promise<SettingsItem[]> {
  return getFilteredSettingsList(terminalList)
}

export function getEditorList(): Promise<SettingsItem[]> {
  return getFilteredSettingsList(editorList)
}

export function getAiToolList(): Promise<SettingsItem[]> {
  return getFilteredSettingsList(aiToolList)
}

export const defaultConfig = {
  editorList,
  terminalList,
  defaultTerminal: DefaultTerminal,
  defaultEditor: DefaultEditor,
}

export default defaultConfig
