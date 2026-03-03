import { Platform } from 'react-native';
import { MMKV } from 'react-native-mmkv';
import { Settings } from 'common-types';

export const userPreferencesStorageKey = 'user-preferences';

export type UserPreferences = Settings;

export const defaultUserPreferences: UserPreferences = {
  launchOnLogin: false,
  locale: 'en',
  defaultEditor: null,
  defaultTerminal: null,
  removeFromDiskByDefault: false,
  customEditors: [],
  customTerminals: [],
};

export const getUserPreferences = () => {
  const stringValue = storage.getString(userPreferencesStorageKey);
  const value = (stringValue ? JSON.parse(stringValue) : {}) as UserPreferences;
  return { ...defaultUserPreferences, ...value };
};

export const saveUserPreferences = (preferences: UserPreferences) => {
  storage.set(userPreferencesStorageKey, JSON.stringify(preferences));
};

export const resetStorage = () => {
  storage.clearAll();
};

export const storage = new MMKV({
  id: 'tray-link-settings'
});
