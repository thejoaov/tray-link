import { v4 as uuidv4 } from 'uuid'

export default class SettingsItem {
  id: string
  name: string
  path: string | null = null
  command: string | null = null
  isDefault = false

  constructor({ name, path, command, isDefault }: Omit<SettingsItem, 'id'>) {
    this.id = uuidv4()
    this.name = name
    this.path = path
    this.command = command
    this.isDefault = isDefault
  }
}
