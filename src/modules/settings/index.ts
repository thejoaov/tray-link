import path from 'path'
import { Menu, Tray, app, dialog, nativeImage, shell } from 'electron'
import { STORE_KEYS } from '../../constants/store.js'
import getTranslation from '../../i18n/index.js'
import SettingsItem from '../../models/SettingsItem.js'
import { settingsStore } from '../../services/store/index.js'
import renderer from '../renderer/index.js'
import { getDevSettings } from './utils.js'

export default function getSettingsMenu(tray: Tray): Menu {
  const terminals = settingsStore.get(STORE_KEYS.TERMINAL_LIST) as SettingsItem[]
  const editors = settingsStore.get(STORE_KEYS.EDITOR_LIST) as SettingsItem[]

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
              shell.openExternal('https://github.com/thejoaov/tray-link/releases/latest')
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
            icon: nativeImage.createFromPath(path.join(__dirname, '../../../assets/icon@5x.png')),
            noLink: true,
          })
          .then((value) => {
            const terminal = terminals[value.response]

            settingsStore.save(
              STORE_KEYS.DEFAULT_TERMINAL,
              new SettingsItem({
                ...terminal,
                isDefault: true,
              }),
            )

            renderer(tray)
          })
      },
    },
    {
      label: getTranslation('setDefaultEditor'),
      click: () => {
        dialog
          .showMessageBox({
            message: getTranslation('defaultEditorMessage'),
            title: getTranslation('defaultEditor'),
            buttons: editors.map((editor) => editor.name),
            icon: nativeImage.createFromPath(path.join(__dirname, '../../../assets/icon@5x.png')),
            noLink: true,
          })
          .then((value) => {
            const editor = editors[value.response]

            settingsStore.save(
              STORE_KEYS.DEFAULT_EDITOR,
              new SettingsItem({
                ...editor,
                isDefault: true,
              }),
            )

            renderer(tray)
          })
      },
    },
    { type: 'separator' },
    {
      label: getTranslation('reloadList'),
      click: async () => {
        await dialog
          .showMessageBox({
            message: getTranslation('reloadListMessage'),
            title: getTranslation('reloadList'),
            buttons: [getTranslation('cancel'), getTranslation('reset')],
          })
          .then((value) => {
            if (value.response === 1) {
              settingsStore.reloadEditorTerminalList()
              renderer(tray)
            }
          })
      },
    },
    {
      label: getTranslation('resetDefaults'),
      click: async () => {
        await dialog
          .showMessageBox({
            message: getTranslation('resetDefaultsMessage'),
            title: getTranslation('resetDefaults'),
            buttons: [getTranslation('cancel'), getTranslation('reset')],
          })
          .then((value) => {
            if (value.response === 1) {
              settingsStore.resetDefaults()
              renderer(tray)
            }
          })
      },
    },
    ...getDevSettings(tray),
    { type: 'separator' },
    {
      label: getTranslation('close'),
      click: () => {
        app.quit()
      },
    },
  ])
}
