import { IpcRendererEvent, ipcRenderer } from 'electron'
import type { DeviceEventEmitterStatic, EmitterSubscription } from 'react-native'

type Callback = (...args: unknown[]) => void
const localListeners: Map<string, Set<Callback>> = new Map()

const DeviceEventEmitter: {
  name: string
  addListener: DeviceEventEmitterStatic['addListener']
  emit: (event: string, ...args: unknown[]) => void
} = {
  name: 'DeviceEventEmitter',
  addListener: (event: string, callback: (...args: string[]) => void, _context) => {
    // Track locally so emit() can dispatch within the same window
    if (!localListeners.has(event)) localListeners.set(event, new Set())
    localListeners.get(event)!.add(callback as Callback)

    const listener = (_event: IpcRendererEvent, ...args: unknown[]) => {
      callback(...(args as string[]))
    }
    ipcRenderer.on(event, listener)

    return {
      remove: () => {
        localListeners.get(event)?.delete(callback as Callback)
        ipcRenderer.removeListener(event, listener)
      },
    } as EmitterSubscription
  },
  emit: (event: string, ...args: unknown[]) => {
    // Dispatch to listeners registered in the same window
    const callbacks = localListeners.get(event)
    if (callbacks) {
      callbacks.forEach((cb) => {
        try {
          cb(...args)
        } catch (e) {
          console.error('[DeviceEventEmitter] callback error:', e)
        }
      })
    }
  },
}

export default DeviceEventEmitter
