import { Menu, MenuItem, Tray } from 'electron'
import getTranslation from '../../i18n/index.js'
import { projectStore } from '../../services/store/index.js'
import getContextMenu from '../context-menu/index.js'
import renderer from '../renderer/index.js'
import getSettingsMenu from '../settings/index.js'
import { onClickAddProjects } from './utils.js'

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
