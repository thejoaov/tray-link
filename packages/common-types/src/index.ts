export interface Project {
  id: string;
  name: string;
  path: string;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  position: number;
  isFavorite: boolean;
  migrated?: boolean;
}

export type Platform = 'darwin' | 'win32' | 'linux';

export interface EditorConfig {
  name: string;
  binary: string;
  detectionPaths: Record<Platform, string[]>;
  openCommand: (path: string, executable: string) => string[];
}

export interface TerminalConfig {
  name: string;
  binary: string;
  detectionPaths: Record<Platform, string[]>;
  openCommand: (path: string, executable: string) => string[];
}

export interface CustomTool {
  id: string;
  name: string;
  binary: string;
  command: string;
}

export interface Settings {
  locale: 'en' | 'pt' | 'es';
  defaultEditor: string | null;
  defaultTerminal: string | null;
  launchOnLogin: boolean;
  removeFromDiskByDefault: boolean;
  customEditors: CustomTool[];
  customTerminals: CustomTool[];
}
