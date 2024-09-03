import { Menu, Tray, dialog } from 'electron'
import Project from '../../models/Project.js'
import getTranslation from '../../i18n/index.js'
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
} from './utils.js'
import { projectStore, settingsStore } from '../../services/store/index.js'
import renderer from '../renderer/index.js'
import Platform from '../../utils/platform.js'
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
        dialog
          .showMessageBox({
            type: 'warning',
            title: getTranslation('remove'),
            message: getTranslation('removeConfirm'),
            buttons: [getTranslation('cancel'), getTranslation('confirm')],
            defaultId: 0,
            cancelId: 0,
            noLink: true,
          })
          .then((res) => {
            if (res.response === 1) {
              projectStore.delete(project.id)
              renderer(tray)
            }
          })
          .catch((err) => {
            console.error(err)
          })
      },
    },
  ])

  return menu
}
