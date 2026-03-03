import { requireElectronModule } from 'rn-electron-modules'

import { NativeFilePickerModule } from './types'

export default requireElectronModule<NativeFilePickerModule>('FilePicker')
