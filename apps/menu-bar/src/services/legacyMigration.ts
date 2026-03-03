import { Project } from 'common-types';

import {
  defaultUserPreferences,
  storage,
} from '../modules/Storage';
import { loadLegacyTrayLinkData } from '../../modules/shell-utils/src';
import { loadPreferences, persistPreferences } from './preferences';
import { projectStore } from './projectStore';

const LEGACY_MIGRATION_DONE_KEY = 'legacy-tray-link-migration-done';

type LegacySettingsItem = {
  command?: string;
};

type LegacySettings = {
  locale?: string;
  defaultEditor?: LegacySettingsItem;
  defaultTerminal?: LegacySettingsItem;
};

type LegacyProject = {
  id?: string;
  name?: string;
  path?: string;
  position?: number;
  isFavorite?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type LegacyMigrationPreview = {
  projectsCount: number;
  hasSettings: boolean;
};

const normalizeLocale = (locale?: string): 'en' | 'pt' | 'es' => {
  if (!locale) {
    return 'en';
  }

  const normalized = locale.toLowerCase();
  if (normalized.startsWith('pt')) {
    return 'pt';
  }
  if (normalized.startsWith('es')) {
    return 'es';
  }
  return 'en';
};

const normalizeLegacyProjects = (items: LegacyProject[] = []): Project[] => {
  const now = new Date().toISOString();

  return items
    .filter(item => Boolean(item.path && item.name))
    .map((item, index) => ({
      id: item.id || `${Date.now()}-${index}`,
      name: item.name || 'Project',
      path: item.path || '',
      position: typeof item.position === 'number' ? item.position : index,
      isFavorite: Boolean(item.isFavorite),
      migrated: true,
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now,
    }))
    .sort((a, b) => a.position - b.position)
    .map((item, index) => ({ ...item, position: index }));
};

const migratePreferencesIfNeeded = (legacySettings?: LegacySettings): boolean => {
  if (!legacySettings) {
    return false;
  }

  const current = loadPreferences();
  const next = { ...current };
  let changed = false;

  if (current.locale === defaultUserPreferences.locale && legacySettings.locale) {
    next.locale = normalizeLocale(legacySettings.locale);
    changed = true;
  }

  const legacyDefaultEditor = legacySettings.defaultEditor?.command ?? null;
  if (current.defaultEditor === defaultUserPreferences.defaultEditor && legacyDefaultEditor) {
    next.defaultEditor = legacyDefaultEditor;
    changed = true;
  }

  const legacyDefaultTerminal = legacySettings.defaultTerminal?.command ?? null;
  if (
    current.defaultTerminal === defaultUserPreferences.defaultTerminal &&
    legacyDefaultTerminal
  ) {
    next.defaultTerminal = legacyDefaultTerminal;
    changed = true;
  }

  if (changed) {
    persistPreferences(next);
  }

  return changed;
};

export const hasLegacyMigrationCompleted = () => {
  return Boolean(storage.getBoolean(LEGACY_MIGRATION_DONE_KEY));
};

export const runLegacyMigration = async (): Promise<boolean> => {
  const alreadyMigrated = storage.getBoolean(LEGACY_MIGRATION_DONE_KEY);
  if (alreadyMigrated) {
    return false;
  }

  const legacyData = await loadLegacyTrayLinkData();
  if (!legacyData) {
    return false;
  }

  const root = legacyData as { settings?: LegacySettings; projects?: LegacyProject[] };

  const preferencesMigrated = migratePreferencesIfNeeded(root.settings);

  let projectsMigrated = false;
  const existingProjects = await projectStore.getProjects();
  if (!existingProjects.length) {
    const normalizedProjects = normalizeLegacyProjects(root.projects || []);
    if (normalizedProjects.length) {
      await projectStore.saveProjects(normalizedProjects);
      projectsMigrated = true;
    }
  }

  if (preferencesMigrated || projectsMigrated) {
    storage.set(LEGACY_MIGRATION_DONE_KEY, true);
    return true;
  }

  return false;
};

export const getLegacyMigrationPreview = async (): Promise<LegacyMigrationPreview | null> => {
  const legacyData = await loadLegacyTrayLinkData();
  if (!legacyData) {
    return null;
  }

  const root = legacyData as { settings?: LegacySettings; projects?: LegacyProject[] };
  const projectsCount = normalizeLegacyProjects(root.projects || []).length;
  const hasSettings = Boolean(
    root.settings?.locale ||
      root.settings?.defaultEditor?.command ||
      root.settings?.defaultTerminal?.command,
  );

  return {
    projectsCount,
    hasSettings,
  };
};
