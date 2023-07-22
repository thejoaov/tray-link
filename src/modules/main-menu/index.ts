import { Menu, MenuItem, Tray } from 'electron'
import getTranslation from '../../i18n'
import { onClickAddProjects } from './utils'
import getContextMenu from '../context-menu'
import { projectStore } from '../../services/store'
import renderer from '../renderer'
import getSettingsMenu from '../settings'

export default function getMainMenu(tray: Tray): Menu {
  const projects = projectStore.getAll()

  const menu = Menu.buildFromTemplate([
    {
      label: getTranslation('addProject'),
      click: async () => {
        await onClickAddProjects()
        renderer(tray)
      },
    },
    {
      type: 'separator',
    },
    ...projects.map((project) => {
      const menuItem = new MenuItem({
        label: project.name,
        submenu: getContextMenu(tray, project),
      })

      return menuItem
    }),
    {
      type: 'separator',
    },
    {
      label: getTranslation('settings'),
      submenu: getSettingsMenu(tray),
    },
  ])

  return menu
}
