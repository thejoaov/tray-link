import { Menu, Tray, app, dialog, shell } from 'electron'
import getTranslation from '../../i18n'

export default function getSettingsMenu(tray: Tray): Menu {
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
    {
      label: getTranslation('close'),
      click: () => {
        app.quit()
      },
    },
  ])
}
