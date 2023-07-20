import { Menu, Tray } from 'electron'
import Project from '../../models/Project'
import getTranslation from '../../i18n'
import { openEditor, openFolder, openGithubDesktop, openTerminal, openVscode } from './utils'
import { deleteProject } from '../../services/store'
import renderer from '../renderer'
import { getEditorList, getTerminalList } from '../../services/detections'
import { getConfig } from '../../services/config'
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
    // TODO: Open in VSCode
    {
      label: getTranslation('openCode'),
      click: () => {
        openVscode(project.path)
      },
    },
    {
      label:
        getTranslation('openDefaultTerminal') +
        ' (' +
        getTerminalList().find((item) => item.name === getConfig().defaultTerminal)?.name +
        ')',
      click: () => {
        openTerminal(project.path, null)
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
      submenu: getTerminalList().map((item) => ({
        label: item.name,
        click: () => {
          openTerminal(project.path, item)
        },
      })),
    },
    {
      label: getTranslation('openEditor'),
      submenu: getEditorList().map((item) => ({
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
        deleteProject(project.id)
        renderer(tray)
      },
    },
  ])

  return menu
}
