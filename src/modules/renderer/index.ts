import { Tray } from 'electron'
import getMainMenu from '../main-menu'

export default function renderer(tray: Tray): void {
  const menu = getMainMenu(tray)
  tray.setContextMenu(menu)
}
