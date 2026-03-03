import { exposeElectronModules } from 'rn-electron-modules';

import { PreloadModules } from '../modules/preloadRegistry';

exposeElectronModules(PreloadModules);
