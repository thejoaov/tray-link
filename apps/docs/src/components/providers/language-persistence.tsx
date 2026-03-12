'use client'

import { useEffect } from 'react'
import { type DocsLocale, docsLocaleCookieName } from '@/lib/docs-locale'

const oneYearInSeconds = 60 * 60 * 24 * 365

export function LanguagePersistence({ lang }: { lang: DocsLocale }) {
  useEffect(() => {
    document.cookie = `${docsLocaleCookieName}=${lang}; path=/; max-age=${oneYearInSeconds}; samesite=lax`

    try {
      window.localStorage.setItem(docsLocaleCookieName, lang)
    } catch {
      return
    }
  }, [lang])

  return null
}
