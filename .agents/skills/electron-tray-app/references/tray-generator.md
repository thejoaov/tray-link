# TrayGenerator: Full Reference Implementation

## Complete class

```typescript
import {
  app, BrowserWindow, Display, ipcMain, Menu,
  MenuItemConstructorOptions, nativeTheme, Rectangle, screen, Tray,
} from 'electron'
import path from 'path'

export class TrayGenerator {
  private tray: Tray | null = null

  constructor(private mainWindow: BrowserWindow) {}

  calculateWindowPosition(display: Display) {
    if (!this.tray) return
    const windowBounds = this.mainWindow.getBounds()
    const trayBounds = this.tray.getBounds()
    const { workArea } = display
    const PADDING = 12

    const trayCenterX = trayBounds.x + trayBounds.width / 2
    const isLeft = (trayCenterX - workArea.x) < (workArea.x + workArea.width - trayCenterX)

    const trayCenterY = trayBounds.y + trayBounds.height / 2
    let isTop = (trayCenterY - workArea.y) < (workArea.y + workArea.height - trayCenterY)

    // Linux: trayBounds may return an empty Rectangle — force top-right
    const zeroTray = trayBounds.x === 0 && trayBounds.y === 0 &&
      trayBounds.width === 0 && trayBounds.height === 0
    if (process.platform === 'linux' && zeroTray) {
      isTop = true
    }

    return {
      x: isLeft
        ? workArea.x + PADDING
        : workArea.x + workArea.width - windowBounds.width - PADDING,
      y: isTop
        ? workArea.y + PADDING
        : workArea.y + workArea.height - windowBounds.height - PADDING,
    }
  }

  showWindow(bounds?: Rectangle) {
    const display = bounds
      ? screen.getDisplayMatching(bounds)
      : screen.getDisplayNearestPoint(screen.getCursorScreenPoint())

    const { height, width } = display.size
    // Notify renderer of screen size so it can adjust layout if needed
    this.mainWindow.webContents.send('popoverFocused', { screenSize: { height, width } })

    const position = this.calculateWindowPosition(display)
    if (!position) return

    this.mainWindow.setPosition(position.x, position.y, false)

    if (process.platform === 'darwin') {
      this.mainWindow.setAlwaysOnTop(true, 'pop-up-menu')
      this.mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    }

    this.mainWindow.show()
    this.mainWindow.moveTop()
  }

  hideWindow() {
    this.mainWindow.hide()
  }

  toggleWindow(_e: KeyboardEvent, bounds: Rectangle) {
    if (this.mainWindow.isVisible()) {
      this.hideWindow()
    } else {
      this.showWindow(bounds)
    }
  }

  rightClickMenu() {
    const menu: MenuItemConstructorOptions[] = [
      {
        label: 'Settings...',
        click: () => {
          // Open your settings window here
        },
      },
      { role: 'quit', accelerator: 'Command+Q' },
    ]
    this.tray?.popUpContextMenu(Menu.buildFromTemplate(menu))
  }

  createTray() {
    this.tray = new Tray(getIconPath())

    // Update icon when system theme changes (macOS dark/light mode)
    nativeTheme.addListener('updated', () => this.tray?.setImage(getIconPath()))

    // Prevent double-click from registering as two single clicks on macOS
    this.tray.setIgnoreDoubleClickEvents(true)

    this.tray.on('click', (_e, bounds) => this.toggleWindow(_e as unknown as KeyboardEvent, bounds))
    this.tray.on('right-click', () => this.rightClickMenu())

    // IPC: renderer can open/close the popover programmatically
    ipcMain.handle('open-popover', () => this.showWindow())
    ipcMain.handle('close-popover', () => this.hideWindow())

    // Re-open on protocol URL and second app instance
    app.on('open-url', () => this.showWindow())
    app.on('second-instance', () => this.showWindow())

    // Blur guard: hide only when cursor is NOT over the tray icon
    // (prevents the window from closing when the user clicks the tray icon to close it,
    //  which would otherwise cause a flicker: hide-on-blur → show-on-click)
    this.mainWindow.on('blur', () => {
      if (!this.tray) return
      const cursor = screen.getCursorScreenPoint()
      const tb = this.tray.getBounds()
      if (
        cursor.x >= tb.x && cursor.x <= tb.x + tb.width &&
        cursor.y >= tb.y && cursor.y <= tb.y + tb.height
      ) return
      this.hideWindow()
    })
  }
}

function getIconPath() {
  const iconName = process.platform === 'darwin'
    ? 'iconTemplate.png'    // Template image: macOS inverts for dark mode automatically
    : process.platform === 'win32'
      ? 'icon.ico'
      : 'icon.png'

  return path.join(
    path.dirname(__dirname),
    `${app.isPackaged ? '../..' : '..'}/assets/images/tray/${iconName}`,
  )
}
```

## Notes

- **Template images on macOS**: Name the icon `iconTemplate.png` and macOS will automatically invert it for dark/light mode. No `nativeTheme` listener needed for basic light/dark switching — but if you want to swap between multiple icon variants, keep the listener.
- **The blur guard**: Without it, clicking the tray icon to close the popover causes: (1) blur fires → window hides, (2) click fires → `isVisible()` returns `false` → window shows again. The guard prevents this by checking if the cursor is still over the tray bounds when blur fires.
- **`setIgnoreDoubleClickEvents(true)`**: On macOS, without this, a double-click opens the Finder/default handler instead of toggling the window.
