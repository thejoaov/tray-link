import SettingsItem from '../../models/SettingsItem.js'

export type ProjectSchema = {
  id: string
  name: string
  path: string
  // color: string;
  position: number
  isFavorite: boolean
}

export type SettingsSchema = {
  locale: string
  defaultEditor: SettingsItem
  defaultTerminal: SettingsItem
  editorList: SettingsItem[]
  terminalList: SettingsItem[]
  aditionalCommands: string[]
}
