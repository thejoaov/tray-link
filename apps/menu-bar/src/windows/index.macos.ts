import { NativeModules, AppRegistry } from 'react-native';
import { Settings } from './Settings';
import { CustomEditorWindow } from './CustomEditorWindow';
import { CustomTerminalWindow } from './CustomTerminalWindow';
import { RemoveProjectWindow } from './RemoveProjectWindow';

const WindowsManagerConstants = NativeModules.WindowsManager.getConstants();
const NON_RESIZABLE_MASK =
  WindowsManagerConstants.STYLE_MASK_TITLED |
  WindowsManagerConstants.STYLE_MASK_CLOSABLE;

const WINDOW_OPTIONS: Record<string, Record<string, unknown>> = {
  Settings: {
    title: 'Settings',
    windowStyle: {
      width: 600,
      height: 600,
      mask: NON_RESIZABLE_MASK,
    },
  },
  CustomEditorWindow: {
    title: 'Custom Editor',
    windowStyle: {
      width: 420,
      height: 360,
      mask: NON_RESIZABLE_MASK,
    },
  },
  CustomTerminalWindow: {
    title: 'Custom Terminal',
    windowStyle: {
      width: 420,
      height: 360,
      mask: NON_RESIZABLE_MASK,
    },
  },
  RemoveProjectWindow: {
    title: 'Remove Project',
    windowStyle: {
      width: 420,
      height: 260,
      mask: NON_RESIZABLE_MASK,
    },
  },
};

export const WindowsNavigator = {
  open: (windowName: string) => {
    try {
      NativeModules.WindowsManager.openWindow(windowName, WINDOW_OPTIONS[windowName] ?? {});
    } catch (e) {
      console.error('Error opening window via native module', e);
    }
  },
  close: (windowName: string) => {
    try {
      NativeModules.WindowsManager.closeWindow(windowName);
    } catch (e) {
      console.error('Error closing window via native module', e);
    }
  },
};

export const WindowsList = [
  {
    name: 'Settings',
    component: Settings,
    options: WINDOW_OPTIONS.Settings,
  },
  {
    name: 'CustomEditorWindow',
    component: CustomEditorWindow,
    options: WINDOW_OPTIONS.CustomEditorWindow,
  },
  {
    name: 'CustomTerminalWindow',
    component: CustomTerminalWindow,
    options: WINDOW_OPTIONS.CustomTerminalWindow,
  },
  {
    name: 'RemoveProjectWindow',
    component: RemoveProjectWindow,
    options: WINDOW_OPTIONS.RemoveProjectWindow,
  },
];

WindowsList.forEach(window => {
  AppRegistry.registerComponent(window.name, () => window.component);
});
