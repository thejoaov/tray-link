import { Menu, Tray } from 'electron'
import Project from '../../models/Project'
import getTranslation from '../../i18n'
import {
  moveBottom,
  moveDown,
  moveTop,
  moveUp,
  openEditor,
  openFolder,
  openGithubDesktop,
  openTerminal,
  openVscode,
} from './utils'
import { projectStore, settingsStore } from '../../services/store'
import renderer from '../renderer'
import Platform from '../../utils/platform'
import commandExists from 'command-exists'

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
      click: async () => {
        await openTerminal(project.path, settingsStore.getDefaultTerminal())
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
      submenu: settingsStore.getTerminalList().map((item) => ({
        label: item.name,
        click: async () => {
          await openTerminal(project.path, item)
        },
      })),
    },
    {
      label: getTranslation('openEditor'),
      submenu: settingsStore.getEditorList().map((item) => ({
        label: item.name,
        click: async () => {
          await openEditor(project.path, item)
        },
      })),
    },
    { type: 'separator' },
    {
      label: getTranslation('moveTop'),
      click: async () => {
        await moveTop(project)
        renderer(tray)
      },
    },
    {
      label: getTranslation('moveUp'),
      click: async () => {
        await moveUp(project)
        renderer(tray)
      },
    },
    {
      label: getTranslation('moveDown'),
      click: async () => {
        await moveDown(project)
        renderer(tray)
      },
    },

    {
      label: getTranslation('moveBottom'),
      click: async () => {
        await moveBottom(project)
        renderer(tray)
      },
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
