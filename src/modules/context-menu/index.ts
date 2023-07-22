import { Menu, Tray } from 'electron'
import Project from '../../models/Project'
import getTranslation from '../../i18n'
import { openEditor, openFolder, openGithubDesktop, openTerminal, openVscode } from './utils'
import { projectStore, settingsStore } from '../../services/store'
import renderer from '../renderer'
import Platform from '../../utils/platform'
import commandExists from 'command-exists'
import SettingsItem from '../../models/SettingsItem'

export default function getContextMenu(tray: Tray, project: Project): Menu {
  const menu = Menu.buildFromTemplate([
    {
      label: project.path,
      enabled: false,
    },
    {
      label: getTranslation('openFolder'),
      click: async () => {
        await openFolder(project.path)
        renderer(tray)
      },
    },
    {
      type: 'separator',
    },
    {
      label: getTranslation('openCode'),
      click: () => {
        openVscode(project.path)
      },
    },
    {
      label: getTranslation('openDefaultTerminal') + ' (' + settingsStore.getDefaultTerminal().name + ')',
      click: () => {
        openTerminal(project.path)
      },
    },
    {
      label: getTranslation('openGithub'),
      click: () => {
        openGithubDesktop(project.path)
      },
      visible: Platform.select({
        darwin: commandExists.sync('github'),
        win32: commandExists.sync('github'),
        linux: commandExists.sync('github-desktop'),
      }),
    },
    { type: 'separator' },
    {
      label: getTranslation('openTerminal'),
      submenu: (settingsStore.get('terminalList') as SettingsItem[]).map((item) => ({
        label: item.name,
        click: () => {
          openTerminal(project.path, new SettingsItem(item))
        },
      })),
    },
    {
      label: getTranslation('openEditor'),
      submenu: (settingsStore.get('editorList') as SettingsItem[]).map((item) => ({
        label: item.name,
        click: () => {
          openEditor(project.path, item)
        },
      })),
    },
    { type: 'separator' },
    {
      label: getTranslation('remove'),
      click: () => {
        projectStore.delete(project.id)
        renderer(tray)
      },
    },
  ])

  return menu
}
