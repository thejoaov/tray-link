import { Registry } from 'rn-electron-modules';

import DeviceEventEmitter from './DeviceEventEmitter/preload';
import Linking from './Linking/preload';
import MenuBarModule from '../../modules/menu-bar/electron/preload';

export const PreloadModules: Registry = [
  MenuBarModule,
  DeviceEventEmitter,
  Linking,
];
