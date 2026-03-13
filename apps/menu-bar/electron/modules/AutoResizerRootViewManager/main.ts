import type { IpcMainInvokeEvent } from 'electron'
import { BrowserWindow } from 'electron'

async function setPopoverSize(width: number, height: number, event: IpcMainInvokeEvent) {
  for (const window of BrowserWindow.getAllWindows()) {
    if (event.sender === window.webContents) {
      const [oldX, oldY] = window.getPosition()

      window.setBounds(
        {
          width,
          height,
          x: oldX,
          y: oldY,
        },
        true,
      )
    }
  }
}

const AutoResizerRootViewManager: {
  name: string
  setPopoverSize: (width: number, height: number, event: IpcMainInvokeEvent) => void
} = {
  name: 'AutoResizerRootViewManager',
  setPopoverSize,
}

export default AutoResizerRootViewManager
