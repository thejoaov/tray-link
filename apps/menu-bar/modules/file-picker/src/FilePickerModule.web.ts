import { requireElectronModule } from '@tray-link/rn-electron-modules'

import { NativeFilePickerModule } from './types'

export default requireElectronModule<NativeFilePickerModule>('FilePicker')
