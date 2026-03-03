import { Registry } from 'rn-electron-modules';

import AlertModule from './Alert/main';
import AutoResizerRootViewManager from './AutoResizerRootViewManager/main';
import Linking from './Linking/main';
import WindowManager from './WindowManager/main';
import FilePickerModule from '../../modules/file-picker/electron/main';
import MenuBarModule from '../../modules/menu-bar/electron/main';
import { ShellUtilsMain } from '../../modules/shell-utils/electron/main';
import { StorageMain } from '../../modules/storage-module/electron/main';

export const MainModules: Registry = [
  MenuBarModule,
  Linking,
  AutoResizerRootViewManager,
  WindowManager,
  FilePickerModule,
  AlertModule,
  {
    name: 'ShellUtils',
    ...ShellUtilsMain
  },
  {
    name: 'Storage',
    ...StorageMain
  }
];
