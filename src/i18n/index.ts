import { app } from 'electron'

import es from './locale/es'
import pt from './locale/pt'
import en from './locale/en'

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
