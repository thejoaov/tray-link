import { AppRegistry } from 'react-native'
import { requireElectronModule } from 'rn-electron-modules'
import { withFluentProvider } from '../../providers/FluentProvider'
import { withThemeProvider } from '../../utils/useExpoTheme'
import { WindowsConfig, WindowsManagerType } from './types'
import { withWindowProvider } from './WindowProvider'

export { WindowStyleMask } from './types'

export const WindowManager = requireElectronModule<WindowsManagerType>('WindowManager')

export function createWindowsNavigator<T extends WindowsConfig>(config: T) {
  Object.entries(config).forEach(([key, value]) => {
    AppRegistry.registerComponent(key, () =>
      withWindowProvider(withFluentProvider(withThemeProvider(value.component)), key),
    )
  })

  return {
    open: (windowName: keyof T) => {
      WindowManager.openWindow(String(windowName), config[windowName].options || {})
    },
    close: (window: keyof T) => {
      WindowManager.closeWindow(String(window))
    },
  }
}
