// import updater from 'update-electron-app'

import { app, nativeImage, Tray } from 'electron'
import fixPath from 'fix-path'
import * as path from 'path'
import renderer from './modules/renderer/index.js'

fixPath()

// updater({
//   notifyUser: true,
//   repo: 'thejoaov/tray-link',
// })

export let tray: Tray

app.whenReady().then(() => {
  if (app.dock) {
    app.dock.hide()
  }

  const appIcon = nativeImage.createFromPath(path.join(__dirname, '../assets/icon.png'))

  tray = new Tray(appIcon)

  renderer(tray)
})
