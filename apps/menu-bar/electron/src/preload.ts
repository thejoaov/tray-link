import { exposeElectronModules } from '@tray-link/rn-electron-modules'

import { PreloadModules } from '../modules/preloadRegistry'

exposeElectronModules(PreloadModules)
