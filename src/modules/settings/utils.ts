import { MenuItemConstructorOptions, Tray, dialog } from 'electron'
import { getEditorList, getTerminalList } from '../../services/config'
import execa from 'execa'

export const getDevSettings = (tray: Tray): MenuItemConstructorOptions[] => {
  const menu: MenuItemConstructorOptions[] = [
    {
      label: 'Dev',
      submenu: [
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
