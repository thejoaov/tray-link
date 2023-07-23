import { v4 as uuidv4 } from 'uuid'

type ISettingsItem = {
  name: string
  path: string
  command: string
  isDefault?: boolean
}

export default class SettingsItem implements ISettingsItem {
  id: string
  name: string
  path: string
  command: string
  isDefault: boolean

  constructor(data: ISettingsItem) {
    this.id = uuidv4()
    this.name = data.name
    this.path = data.path
    this.command = data.command
    this.isDefault = data.isDefault
  }
}
