import execa from 'execa'
import { Settings } from './index.js'
import SettingsItem from '../../models/SettingsItem.js'
import fs from 'fs'
import { DefaultTerminal } from '../../constants/defaults.js'
import Platform from '../../utils/platform.js'

export function getFilteredSettingsList(settingsList: Settings[]): SettingsItem[] {
  const filteredList = settingsList
    .map((item) => {
      let path = ''
      let command = item.command ?? ''

      if (item.enableBinaryCheck) {
        path =
          execa.commandSync(
            Platform.select({
              darwin: `which -a ${item.binary}`,
              win32: `where.exe ${item.binary}`,
              linux: `which -a ${item.binary}`,
            }),
            {
              reject: false,
              detached: true,
            },
          ).stdout ?? ''
      } else if (item.enableCommonPathCheck && item.commonFilepaths?.length) {
        path = item.commonFilepaths.find((filepath) => {
          if (fs.existsSync(filepath)) return filepath
        })
      }

      if (!path?.length) {
        path =
          execa.commandSync(
            Platform.select({
              darwin: `which -a ${item.binary}`,
              win32: `where.exe ${item.binary}`,
              linux: `which -a ${item.binary}`,
            }),
            {
              reject: false,
              detached: true,
            },
          ).stdout ?? ''
      }

      if (item.command?.length) {
        command = item.command
      } else if (path) {
        command = path
      }

      const newItem = new SettingsItem({
        name: item.name,
        isDefault: item.name === DefaultTerminal.name,
        command,
        path,
      })

      return newItem
    })
    .filter((item) => item.command?.length && item.path?.length)

  return filteredList
}
