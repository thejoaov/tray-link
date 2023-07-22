import { Menu, Tray, app, dialog, shell } from 'electron'
import getTranslation from '../../i18n'
import { getTerminalList } from '../../services/detections'
import { settingsStore } from '../../services/store'
import SettingsItem from '../../models/SettingsItem'
import renderer from '../renderer'

export default function getSettingsMenu(tray: Tray): Menu {
  const terminals = getTerminalList()

  return Menu.buildFromTemplate([
    {
      label: getTranslation('about'),
      click: () => {
        dialog
          .showMessageBox({
            message: getTranslation('aboutMessage'),
            title: getTranslation('aboutTitle'),
            buttons: [
              getTranslation('closeAbout'), // 0
              getTranslation('checkUpdate'), // 1
              getTranslation('openGithubRepo'), // 2
            ],
            detail: app.getVersion(),
            noLink: true,
          })
          .then((value) => {
            if (value.response === 0) {
              return
            }

            if (value.response === 1) {
              shell.openExternal('https://github.com/thejoaov/tray-link/releases')
            }

            if (value.response === 2) {
              shell.openExternal('https://github.com/thejoaov/tray-link')
            }
          })
      },
    },
    { type: 'separator' },
    {
      label: getTranslation('setDefaultTerminal'),
      click: () => {
        dialog
          .showMessageBox({
            message: getTranslation('defaultTerminalMessage'),
            title: getTranslation('defaultTerminal'),
            buttons: terminals.map((terminal) => terminal.name),
            noLink: true,
          })
          .then((value) => {
            const terminal = terminals[value.response]

            settingsStore.save(
              'defaultTerminal',
              new SettingsItem({
                ...terminal,
                isDefault: true,
              }),
            )

            renderer(tray)
          })
      },
    },
    { type: 'separator' },
    {
      label: getTranslation('close'),
      click: () => {
        app.quit()
      },
    },
  ])
}
