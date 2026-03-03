import { Platform } from 'react-native'
import { CustomEditorWindow } from './CustomEditorWindow'
import { CustomTerminalWindow } from './CustomTerminalWindow'
import { RemoveProjectWindow } from './RemoveProjectWindow'
import { Settings } from './Settings'

export const WindowsNavigator = {
  open: (windowName: string) => {
    if (Platform.OS === 'macos') {
      const { requireNativeModule } = require('expo-modules-core')
      try {
        const WindowNavigator = requireNativeModule('WindowNavigator')
        WindowNavigator.openWindow(windowName, {})
      } catch (e) {
        console.error('Error opening window via native module', e)
      }
    } else {
      const { requireElectronModule } = require('@tray-link/rn-electron-modules')
      const WindowManager = requireElectronModule('WindowManager')
      WindowManager.openWindow(windowName)
    }
  },
  close: (windowName: string) => {
    if (Platform.OS === 'macos') {
      try {
        const { requireNativeModule } = require('expo-modules-core')
        const WindowNavigator = requireNativeModule('WindowNavigator')
        WindowNavigator.closeWindow(windowName)
      } catch (e) {
        console.error('Error closing window via native module', e)
      }
    } else {
      const { requireElectronModule } = require('@tray-link/rn-electron-modules')
      const WindowManager = requireElectronModule('WindowManager')
      WindowManager.closeWindow(windowName)
    }
  },
}

export const WindowsList = [
  {
    name: 'Settings',
    component: Settings,
    options: { title: 'Settings', width: 400, height: 500, resizable: false },
  },
  {
    name: 'CustomEditorWindow',
    component: CustomEditorWindow,
    options: { title: 'Custom Editor', width: 420, height: 360, resizable: false },
  },
  {
    name: 'CustomTerminalWindow',
    component: CustomTerminalWindow,
    options: { title: 'Custom Terminal', width: 420, height: 360, resizable: false },
  },
  {
    name: 'RemoveProjectWindow',
    component: RemoveProjectWindow,
    options: { title: 'Remove Project', width: 420, height: 260, resizable: false },
  },
]
