import { Settings } from '@tray-link/common-types'
import { getItem, setItem } from '../../modules/storage-module/src'

export const userPreferencesStorageKey = 'user-preferences'

export type UserPreferences = Settings

export const defaultUserPreferences: UserPreferences = {
  launchOnLogin: false,
  locale: 'en',
  defaultEditor: null,
  defaultTerminal: null,
  removeFromDiskByDefault: false,
  customEditors: [],
  customTerminals: [],
}

export const getUserPreferences = async (): Promise<UserPreferences> => {
  const stringValue = await getItem(userPreferencesStorageKey)
  const value = (stringValue ? JSON.parse(stringValue) : {}) as Partial<UserPreferences>
  return { ...defaultUserPreferences, ...value }
}

export const saveUserPreferences = async (preferences: UserPreferences): Promise<void> => {
  await setItem(userPreferencesStorageKey, JSON.stringify(preferences))
}

/**
 * One-time migration: if preferences were previously stored in MMKV but not yet
 * in config.json, move them over. Safe to call on every startup — it's a no-op
 * once the config.json key is present.
 */
export const migratePreferencesFromMMKV = async (): Promise<void> => {
  try {
    // Check if config.json already has preferences
    const existing = await getItem(userPreferencesStorageKey)
    if (existing) return // already migrated

    // Try to read from MMKV if it's available (package may not be installed)
    let mmkvValue: string | undefined
    try {
      const { MMKV } = require('react-native-mmkv') as typeof import('react-native-mmkv')
      const legacyStorage = new MMKV({ id: 'tray-link-settings' })
      mmkvValue = legacyStorage.getString(userPreferencesStorageKey)
    } catch {
      return // MMKV not available — nothing to migrate
    }

    if (mmkvValue) {
      await setItem(userPreferencesStorageKey, mmkvValue)
    }
  } catch {
    // Migration errors are non-fatal
  }
}
