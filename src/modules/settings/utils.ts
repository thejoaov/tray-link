import { MenuItemConstructorOptions, Tray, dialog } from 'electron'
import execa from 'execa'
import { getEditorList, getTerminalList } from '../../services/config/index.js'
import { projectStore } from '../../services/store/index.js'

export const getDevSettings = (_tray: Tray): MenuItemConstructorOptions[] => {
  const menu: MenuItemConstructorOptions[] = [
    {
      label: 'Dev',
      submenu: [
        {
          label: 'Reset projects positions',
          click: () => {
            projectStore.resetPosition()
          },
        },
        {
          label: 'EditorList',
          submenu: getEditorList().map((item) => ({
            label: item.name,
            click: () => {
              dialog.showMessageBox({
                title: item.name,
                message: `
                Path: ${item.path}

                Command: ${item.command}`,
                buttons: ['OK'],
              })
            },
          })),
        },
        {
          label: 'TerminalList',
          submenu: getTerminalList().map((item) => ({
            label: item.name,
            click: () => {
              dialog
                .showMessageBox({
                  title: item.name,
                  message: `
                Path: ${item.path}

                Command: ${item.command}`,
                  buttons: ['OK', 'Test'],
                })
                .then((value) => {
                  if (value.response === 1) {
                    execa.commandSync(`${item.command} ~/`, {
                      detached: true,
                    })
                  }
                })
            },
          })),
        },
      ],
    },
  ]

  if (process.env.NODE_ENV !== 'development') {
    return [
      {
        type: 'separator',
      },
    ]
  }

  return menu
}
