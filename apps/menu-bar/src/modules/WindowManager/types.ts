import type { ComponentType } from 'react'

export enum WindowStyleMask {
  Borderless,
  Titled,
  Closable,
  Miniaturizable,
  Resizable,
  UnifiedTitleAndToolbar,
  FullScreen,
  FullSizeContentView,
  UtilityWindow,
  DocModalWindow,
  NonactivatingPanel,
}

export type WindowOptions = {
  title?: string
  windowStyle?: {
    mask?: WindowStyleMask[]
    height?: number
    width?: number
    titlebarAppearsTransparent?: boolean
  }
}

export type WindowsConfig = {
  [key: string]: {
    component: ComponentType<unknown>
    options?: WindowOptions
  }
}

export type WindowsManagerType = {
  openWindow: (window: string, options: WindowOptions) => Promise<void>
  closeWindow(window: string): void
}
