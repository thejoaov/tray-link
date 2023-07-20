export type SubmenuItem = {
  label: string
  click?: () => void
  enabled?: boolean
}

export type SubmenuSeparator = {
  type: 'separator'
}

export type Submenu = SubmenuItem | SubmenuSeparator
