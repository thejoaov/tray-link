import React, { ComponentType } from 'react'
import { AppRegistry, Platform } from 'react-native'
import { FluentProvider } from '../providers/FluentProvider'
import { ThemeProvider } from '../providers/ThemeProvider'
import { i18n } from '../services/i18n'
import { CustomEditorWindow } from './CustomEditorWindow'
import { CustomTerminalWindow } from './CustomTerminalWindow'
import { RemoveProjectWindow } from './RemoveProjectWindow'
import { Settings } from './Settings'

export const WindowsList = [
  {
    name: 'Settings',
    component: Settings,
    options: { title: 'Settings', width: 400, height: 680, resizable: false },
  },
  {
    name: 'CustomEditorWindow',
    component: CustomEditorWindow,
    options: { title: i18n.t('addCustomEditor'), width: 420, height: 360, resizable: false },
  },
  {
    name: 'CustomTerminalWindow',
    component: CustomTerminalWindow,
    options: { title: i18n.t('addCustomTerminal'), width: 420, height: 360, resizable: false },
  },
  {
    name: 'RemoveProjectWindow',
    component: RemoveProjectWindow,
    options: { title: i18n.t('removeProjectTitle'), width: 420, height: 260, resizable: false },
  },
]

const WINDOW_OPTIONS_MAP = Object.fromEntries(WindowsList.map((w) => [w.name, w.options]))

function wrapWithProviders(Component: ComponentType) {
  return function WrappedWindow() {
    return React.createElement(
      ThemeProvider,
      { themePreference: 'no-preference', children: undefined },
      React.createElement(FluentProvider, null, React.createElement(Component)),
    )
  }
}

export const WindowsNavigator = {
  open: (windowName: string) => {
    if (Platform.OS === 'macos') {
      const { requireNativeModule } = require('expo-modules-core')
      try {
        const WindowNavigator = requireNativeModule('WindowNavigator')
        WindowNavigator.openWindow(windowName, {})
      } catch (e) {
        console.error(e)
      }
    } else {
      const { requireElectronModule } = require('@tray-link/rn-electron-modules')
      const WindowManager = requireElectronModule('WindowManager')
      const opts = WINDOW_OPTIONS_MAP[windowName]
      WindowManager.openWindow(
        windowName,
        opts
          ? {
              title: opts.title,
              windowStyle: {
                width: opts.width,
                height: opts.height,
              },
            }
          : undefined,
      )
    }
  },
  close: (windowName: string) => {
    if (Platform.OS === 'macos') {
      try {
        const { requireNativeModule } = require('expo-modules-core')
        const WindowNavigator = requireNativeModule('WindowNavigator')
        WindowNavigator.closeWindow(windowName)
      } catch (e) {
        console.error(e)
      }
    } else {
      const { requireElectronModule } = require('@tray-link/rn-electron-modules')
      const WindowManager = requireElectronModule('WindowManager')
      WindowManager.closeWindow(windowName)
    }
  },
}

// Register each window component so AppRegistry.runApplication can find them
// (used when Electron opens a child window with ?moduleName=X)
WindowsList.forEach((window) => {
  AppRegistry.registerComponent(window.name, () => wrapWithProviders(window.component))
})
