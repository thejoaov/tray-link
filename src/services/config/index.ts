import { app } from 'electron'
import defaultConfig from '../../config'
import fs from 'fs'
import path from 'path'

export function getConfig(): typeof defaultConfig {
  const configPath = path.join(app.getPath('home'), '.tray-link.config.json')

  let configOnDisk: string

  try {
    configOnDisk = fs.readFileSync(configPath, 'utf-8')
  } catch (error) {
    // No need to handle this error
  }

  return configOnDisk ? JSON.parse(configOnDisk) : defaultConfig
}

export function setConfig(config: typeof defaultConfig): void {
  const configPath = path.join(app.getPath('home'), '.tray-link.config.json')
  fs.writeFileSync(configPath, JSON.stringify(config))
}
