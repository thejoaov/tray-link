import { app, dialog, BrowserWindow } from 'electron';
import type { IpcMainInvokeEvent } from 'electron';
import path from 'path';

import spawnCliAsync from './spawnCliAsync';
import { ElectronMainMenuBarModule } from '../src/types';

const runCli = async (
  command: string,
  args: string[],
  listenerId: number,
  event: IpcMainInvokeEvent
) => {
  const webContents = BrowserWindow.getAllWindows().find(
    (window) => window.webContents === event.sender
  )?.webContents;

  const cliPath = path.join(__dirname, './cli/index');

  const commandOutput = await spawnCliAsync(
    cliPath,
    command,
    args,
    listenerId,
    {},
    (event) => {
      webContents?.postMessage('onCLIOutput', event);
    }
  );
  return commandOutput;
};

const MenuBarModule: ElectronMainMenuBarModule = {
  name: 'MenuBar',
  appVersion: app.getVersion(),
  runCli,
  exitApp() {
    app.quit();
  },
  setLoginItemEnabled(enabled: boolean) {
    app.setLoginItemSettings({ openAtLogin: enabled });
    return Promise.resolve();
  },
  showMultiOptionAlert: async (title: string, message: string, _options: string[]) => {
    const { response } = await dialog.showMessageBox({
      title,
      message: title,
      detail: message,
      type: 'question',
      buttons: ['Cancel', 'OK'],
    });

    return response;
  },
  setEnvVars(_envVars) {
    //
  },
};

export default MenuBarModule;
