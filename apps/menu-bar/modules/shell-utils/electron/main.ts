import { ipcMain } from 'electron';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';

const execAsync = util.promisify(exec);

export const ShellUtilsMain = {
  openInEditor: async (path: string, editorCommand: string) => {
    try {
      await execAsync(`${editorCommand} "${path}"`);
      return true;
    } catch {
      return false;
    }
  },
  openInTerminal: async (path: string, terminalCommand: string) => {
    try {
      await execAsync(`cd "${path}" && ${terminalCommand}`);
      return true;
    } catch {
      return false;
    }
  },
  openInFinder: async (path: string) => {
    try {
      const { shell } = require('electron');
      await shell.openPath(path);
      return true;
    } catch {
      return false;
    }
  },
  which: async (binary: string) => {
    try {
      const isWindows = process.platform === 'win32';
      const command = isWindows ? `where ${binary}` : `which ${binary}`;
      const { stdout } = await execAsync(command);
      return stdout.trim();
    } catch {
      return null;
    }
  },
  fileExists: async (path: string) => {
    try {
      return fs.existsSync(path);
    } catch {
      return false;
    }
  },
  loadLegacyTrayLinkData: async () => {
    try {
      const home = os.homedir();
      const candidates = [
        path.join(home, 'Library', 'Application Support', 'tray-link', 'config.json'),
        path.join(home, 'Library', 'Application Support', 'Tray Link', 'config.json'),
        path.join(home, 'Library', 'Application Support', 'vs-tray', 'config.json'),
      ];

      const source = candidates.find(candidate => fs.existsSync(candidate));
      if (!source) {
        return null;
      }

      const raw = fs.readFileSync(source, 'utf8');
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return null;
    }
  },
  removeFromDisk: async (path: string) => {
    try {
      const isWindows = process.platform === 'win32';
      const command = isWindows
        ? `powershell -NoProfile -Command "Remove-Item -LiteralPath '${path.replace(/'/g, "''")}' -Recurse -Force"`
        : `rm -rf "${path.replace(/"/g, '\\"')}"`;
      await execAsync(command);
      return true;
    } catch {
      return false;
    }
  }
};
