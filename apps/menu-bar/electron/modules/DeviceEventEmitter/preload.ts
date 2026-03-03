import { IpcRendererEvent, ipcRenderer } from 'electron';
import type { DeviceEventEmitterStatic, EmitterSubscription } from 'react-native';

const DeviceEventEmitter: {
  name: string;
  addListener: DeviceEventEmitterStatic['addListener'];
} = {
  name: 'DeviceEventEmitter',
  addListener: (event: string, callback: (...args: string[]) => void, _context) => {
    const listener = (_event: IpcRendererEvent, ...args: unknown[]) => {
      callback(...(args as string[]));
    };
    ipcRenderer.on(event, listener);

    return {
      remove: () => {
        ipcRenderer.removeListener(event, listener);
      },
    } as EmitterSubscription;
  },
};

export default DeviceEventEmitter;
