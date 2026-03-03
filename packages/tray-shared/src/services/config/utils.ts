import { execaCommand } from 'execa'
import fs from 'fs'
import { DefaultTerminal } from '../../constants/defaults'
import SettingsItem from '../../models/SettingsItem'
import Platform from '../../utils/platform'
import { Settings } from './index'

export function getFilteredSettingsList(settingsList: Settings[]): SettingsItem[] {
  const filteredList = settingsList
    .map((item) => {
      let path = ''
      let command = item.command ?? ''

      if (item.enableBinaryCheck) {
        execaCommand(
          Platform.select({
            darwin: `which -a ${item.binary}`,
            win32: `where.exe ${item.binary}`,
            linux: `which -a ${item.binary}`,
          }) as string,
          {
            reject: false,
            detached: true,
          },
        ).then((result) => {
          if (result.stdout?.length) path = result.stdout
        })
      } else if (item.enableCommonPathCheck && item.commonFilepaths?.length) {
        path = item.commonFilepaths.find((filepath) => {
          if (fs.existsSync(filepath)) return filepath
        }) || ''
      }

      if (!path?.length) {
        execaCommand(
          Platform.select({
            darwin: `which -a ${item.binary}`,
            win32: `where.exe ${item.binary}`,
            linux: `which -a ${item.binary}`,
          }) as string,
          {
            reject: false,
            detached: true,
          },
        ).then((result) => {
          if (result.stdout?.length) path = result.stdout
        })
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
