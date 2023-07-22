import SettingsItem from '../../models/SettingsItem'

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
}
