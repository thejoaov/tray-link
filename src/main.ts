// import updater from 'update-electron-app'
import * as path from 'path'
import { app, Tray, nativeImage } from 'electron'
import renderer from './modules/renderer'
import { setConfig } from './services/config'
import config from './config'

// updater({
//   notifyUser: true,
//   repo: 'thejoaov/tray-link',
// })

export let tray: Tray

app.whenReady().then(() => {
  setConfig(config)

  if (app.dock) {
    app.dock.hide()
  }

  const appIcon = nativeImage.createFromPath(path.join(__dirname, '../assets/icon.png'))

  tray = new Tray(appIcon)

  renderer(tray)
})
