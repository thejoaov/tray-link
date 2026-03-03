import { requireElectronModule } from '@tray-link/rn-electron-modules'
import { Linking as NativeLinking } from 'react-native'

export const Linking = requireElectronModule<NativeLinking>('Linking')
