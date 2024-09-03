import { Menu, MenuItem, Tray } from 'electron'
import getTranslation from '../../i18n/index.js'
import { projectStore, settingsStore } from '../../services/store/index.js'
import getContextMenu from '../context-menu/index.js'
import renderer from '../renderer/index.js'
import getSettingsMenu from '../settings/index.js'
import { onClickAddProjects } from './utils.js'

export default function getMainMenu(tray: Tray): Menu {
  const projects = projectStore.getAll()
  settingsStore.reloadEditorTerminalList()

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
    ...projects.map((project, index) => {
      const menuItem = new MenuItem({
        label: `${index + 1} - ${project.name}`,
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
