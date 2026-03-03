import { Registry } from '@tray-link/rn-electron-modules'
import MenuBarModule from '../../modules/menu-bar/electron/preload'
import DeviceEventEmitter from './DeviceEventEmitter/preload'
import Linking from './Linking/preload'

export const PreloadModules: Registry = [MenuBarModule, DeviceEventEmitter, Linking]
