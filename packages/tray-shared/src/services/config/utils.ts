import { execaCommand } from 'execa'
import fs from 'fs'
import { DefaultTerminal } from '../../constants/defaults'
import SettingsItem from '../../models/SettingsItem'
import Platform from '../../utils/platform'
import { generateSlug } from '../../utils/slug'
import { Settings } from './index'

export async function getFilteredSettingsList(settingsList: Settings[]): Promise<SettingsItem[]> {
  const results = await Promise.all(
    settingsList.map(async (item) => {
      const command = item.command ?? ''
      if (!command) return null

      let path = ''

      if (item.enableBinaryCheck && item.binary) {
        try {
          const result = await execaCommand(
            Platform.select({
              darwin: `which -a ${item.binary}`,
              win32: `where.exe ${item.binary}`,
              linux: `which -a ${item.binary}`,
            }) as string,
            { reject: false },
          )
          if (result.stdout?.trim().length) {
            path = result.stdout.trim().split('\n')[0]
          }
        } catch {
          // binary not found — fall through to path check
        }
      }

      if (!path && item.enableCommonPathCheck && item.commonFilepaths?.length) {
        const found = item.commonFilepaths.find((filepath) => {
          try {
            return fs.existsSync(filepath)
          } catch {
            return false
          }
        })
        if (found) path = found
      }

      if (!path) return null

      return new SettingsItem({
        name: item.name,
        slug: generateSlug(item.name),
        isDefault: item.name === DefaultTerminal.name,
        command,
        path,
      })
    }),
  )

  return results.filter((item): item is SettingsItem => item !== null)
}
