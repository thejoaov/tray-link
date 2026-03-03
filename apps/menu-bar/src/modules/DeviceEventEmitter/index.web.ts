import { requireElectronModule } from '@tray-link/rn-electron-modules'
import { DeviceEventEmitter as NativeDeviceEventEmitter } from 'react-native'

export const DeviceEventEmitter = requireElectronModule<typeof NativeDeviceEventEmitter>('DeviceEventEmitter')
