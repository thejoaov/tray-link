import { app } from 'electron'

import en from './locale/en.js'
import es from './locale/es.js'
import pt from './locale/pt.js'

export default function getTranslation(key: keyof typeof en): string {
  const locale = app.getLocale()

  const locales: Record<string, typeof en> = {
    'es-419': es,
    es: es,
    'pt-BR': pt,
    'pt-PT': pt,
    en: en,
  }

  return (locales[locale] || locales.en)[key] ?? key
}
