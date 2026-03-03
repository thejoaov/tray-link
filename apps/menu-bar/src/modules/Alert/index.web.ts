import { AlertButton, Alert as RNAlert } from 'react-native'
import { requireElectronModule } from 'rn-electron-modules'

const ElectronAlert = requireElectronModule<{
  alert(title: string, message?: string, buttons?: AlertButton[]): void
}>('Alert')

const Alert = {
  ...RNAlert,
  alert(title: string, message?: string, buttons?: AlertButton[]) {
    ElectronAlert.alert(title, message, buttons)
  },
}

export default Alert
