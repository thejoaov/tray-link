import { Linking as NativeLinking } from 'react-native'
import { requireElectronModule } from 'rn-electron-modules'

export const Linking = requireElectronModule<NativeLinking>('Linking')
