import { DeviceEventEmitter as NativeDeviceEventEmitter } from 'react-native'
import { requireElectronModule } from 'rn-electron-modules'

export const DeviceEventEmitter = requireElectronModule<typeof NativeDeviceEventEmitter>('DeviceEventEmitter')
