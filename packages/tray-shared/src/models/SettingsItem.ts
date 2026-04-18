import { generateSlug } from '../utils/slug'

function createUUID(): string {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replaceAll(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === 'x' ? random : (random & 0x3) | 0x8

    return value.toString(16)
  })
}

type ISettingsItem = {
  name: string
  path: string
  command: string
  isDefault?: boolean
  slug?: string
}

export default class SettingsItem implements ISettingsItem {
  id: string
  name: string
  path: string
  command: string
  isDefault: boolean
  slug: string

  constructor(data: ISettingsItem) {
    this.id = createUUID()
    this.name = data.name
    this.path = data.path
    this.command = data.command
    this.isDefault = data.isDefault ?? false
    this.slug = data.slug ?? generateSlug(data.name)
  }
}
