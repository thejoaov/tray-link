---
name: electron-tray-app
description: Use when building or extending an Electron system tray application. Covers tray window creation, smart window positioning relative to the tray icon (top/bottom/left/right detection, multi-monitor, Linux fallback), macOS Dock hiding, always-on-top pop-up window behavior, blur-to-hide with cursor-in-tray guard, right-click context menu, and IPC handles for programmatic show/hide. Trigger when the user asks about Electron tray, menu bar app, system tray window, popover window positioning, or macOS menu bar app.
---

# Electron Tray App

Patterns for building a system tray (menu bar) application in Electron. The central object is a `TrayGenerator` class that owns the tray icon, window lifecycle, and position calculation.

## References

```text
references/
  tray-generator.md    Full TrayGenerator class: positioning, toggle, blur guard, IPC, right-click menu
  window-setup.md      BrowserWindow flags for tray popover behavior (frameless, transparent, dock hide)
  icon-setup.md        Platform-specific icon selection (macOS template, Windows ICO, Linux PNG)
  config-recovery.md   Corrupt electron-store detection and backup pattern
```

## When to use

- Building a new Electron tray/menu-bar app from scratch
- Adding a tray popover window to an existing Electron app
- Debugging window positioning issues on multi-monitor or Linux setups
- Implementing auto-hide behavior when the user clicks outside the window

## Quick Reference

### TrayGenerator class skeleton

```typescript
import { app, BrowserWindow, ipcMain, Menu, nativeTheme, screen, Tray } from 'electron'

export class TrayGenerator {
  private tray: Tray | null = null
  constructor(private mainWindow: BrowserWindow) {}

  createTray() {
    this.tray = new Tray(getIconPath())
    nativeTheme.addListener('updated', () => this.tray?.setImage(getIconPath()))

    this.tray.setIgnoreDoubleClickEvents(true)
    this.tray.on('click', (_e, bounds) => this.toggleWindow(bounds))
    this.tray.on('right-click', () => this.rightClickMenu())

    // IPC handles so the renderer can open/close the popover
    ipcMain.handle('open-popover', () => this.showWindow())
    ipcMain.handle('close-popover', () => this.hideWindow())

    // Re-open on macOS open-url and second-instance events
    app.on('open-url', () => this.showWindow())
    app.on('second-instance', () => this.showWindow())

    // Blur guard: hide unless cursor is over the tray icon
    this.mainWindow.on('blur', () => {
      if (!this.tray) return
      const cursor = screen.getCursorScreenPoint()
      const trayBounds = this.tray.getBounds()
      const overTray =
        cursor.x >= trayBounds.x && cursor.x <= trayBounds.x + trayBounds.width &&
        cursor.y >= trayBounds.y && cursor.y <= trayBounds.y + trayBounds.height
      if (!overTray) this.hideWindow()
    })
  }
  // ... see references/tray-generator.md for full implementation
}
```

### Window position calculation

The key insight: detect which edge of the screen the tray icon is nearest to, then pin the window to that corner with padding.

```typescript
calculateWindowPosition(display: Display) {
  const windowBounds = this.mainWindow.getBounds()
  const trayBounds = this.tray!.getBounds()
  const { workArea } = display
  const PADDING = 12

  const trayCenterX = trayBounds.x + trayBounds.width / 2
  const isLeft = (trayCenterX - workArea.x) < (workArea.x + workArea.width - trayCenterX)

  const trayCenterY = trayBounds.y + trayBounds.height / 2
  let isTop = (trayCenterY - workArea.y) < (workArea.y + workArea.height - trayCenterY)

  // Linux: trayBounds may be an empty rectangle — force top-right
  if (process.platform === 'linux' && trayBounds.x === 0 && trayBounds.y === 0 &&
      trayBounds.width === 0 && trayBounds.height === 0) {
    isTop = true; // isLeft stays false → top-right
  }

  const x = isLeft
    ? workArea.x + PADDING
    : workArea.x + workArea.width - windowBounds.width - PADDING
  const y = isTop
    ? workArea.y + PADDING
    : workArea.y + workArea.height - windowBounds.height - PADDING

  return { x, y }
}
```

### Show window (macOS always-on-top)

```typescript
showWindow(bounds?: Rectangle) {
  const display = bounds
    ? screen.getDisplayMatching(bounds)
    : screen.getDisplayNearestPoint(screen.getCursorScreenPoint())

  const position = this.calculateWindowPosition(display)
  if (!position) return

  this.mainWindow.setPosition(position.x, position.y, false)

  if (process.platform === 'darwin') {
    // Appear above fullscreen apps and in all Spaces
    this.mainWindow.setAlwaysOnTop(true, 'pop-up-menu')
    this.mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  }

  this.mainWindow.show()
  this.mainWindow.moveTop()
}
```

### Hide the Dock icon (macOS)

Add to `Info.plist` (for packaged builds):
```xml
<key>LSUIElement</key>
<true/>
```

And in `main.ts` for dev mode:
```typescript
app.dock?.hide()
```

### BrowserWindow flags for a tray popover

```typescript
const mainWindow = new BrowserWindow({
  width: 360,
  height: 600,
  show: false,           // Hidden until tray click
  frame: false,          // No title bar
  resizable: false,
  transparent: true,     // Rounded corners via CSS
  alwaysOnTop: false,    // TrayGenerator handles this dynamically
  skipTaskbar: true,     // Don't show in taskbar/Alt+Tab
  webPreferences: {
    contextIsolation: true,
    nodeIntegration: false,
    preload: path.join(__dirname, 'preload.js'),
  },
})
```
