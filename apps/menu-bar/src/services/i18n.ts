import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { EmitterSubscription } from 'react-native'

import { defaultUserPreferences, UserPreferences } from '../modules/Storage'
import { loadPreferences, subscribePreferencesChange } from './preferences'
import { en } from './translations/en'
import { es } from './translations/es'
import { pt } from './translations/pt'

type Locale = NonNullable<UserPreferences['locale']>

type TranslationKey = keyof typeof en

export const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  en,
  pt,
  es,
}

export const resolveLocale = (): Locale => {
  // Synchronous fallback at module init time — language will be updated
  // asynchronously via syncI18nLanguageFromPreferences() once prefs are loaded.
  const locale = defaultUserPreferences.locale
  if (locale === 'pt' || locale === 'es') {
    return locale
  }
  return 'en'
}

const resources = {
  en: { translation: dictionaries.en },
  pt: { translation: dictionaries.pt },
  es: { translation: dictionaries.es },
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    compatibilityJSON: 'v4',
    resources,
    lng: resolveLocale(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  })
}

export const syncI18nLanguageFromPreferences = async () => {
  const prefs = await loadPreferences()
  const locale = prefs.locale
  const nextLanguage = locale === 'pt' || locale === 'es' ? locale : 'en'
  if (i18n.language !== nextLanguage) {
    i18n.changeLanguage(nextLanguage)
  }
}

export const subscribeLanguageSync = (): EmitterSubscription => {
  return subscribePreferencesChange(() => {
    // biome-ignore lint/suspicious/noEmptyBlockStatements: fail silently if syncing language from preferences fails for any reason, to avoid breaking other prefs functionality
    syncI18nLanguageFromPreferences().catch(() => {})
  })
}

export type { TranslationKey }
export { i18n }
