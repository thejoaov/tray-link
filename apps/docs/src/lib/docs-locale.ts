export const docsLocales = ['en', 'pt', 'es'] as const

export type DocsLocale = (typeof docsLocales)[number]

export const defaultDocsLocale: DocsLocale = 'en'
export const docsLocaleCookieName = 'tray_link_docs_lang'

export function isDocsLocale(value: string | null | undefined): value is DocsLocale {
  return docsLocales.includes((value ?? '') as DocsLocale)
}

export function normalizeDocsLocale(value: string | null | undefined): DocsLocale | undefined {
  const normalized = value?.trim().toLowerCase()

  if (!normalized) return undefined
  if (!isDocsLocale(normalized)) return undefined

  return normalized
}

function mapLanguageTagToLocale(tag: string): DocsLocale | undefined {
  const normalized = tag.trim().toLowerCase()

  if (normalized.startsWith('pt')) return 'pt'
  if (normalized.startsWith('es')) return 'es'
  if (normalized.startsWith('en')) return 'en'

  return undefined
}

function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return []

  return header
    .split(',')
    .map((part, index) => {
      const [tagPart, ...params] = part.trim().split(';')
      const qParam = params.find((param) => param.trim().startsWith('q='))
      const qValue = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1

      return {
        index,
        q: Number.isFinite(qValue) ? qValue : 0,
        tag: tagPart.trim(),
      }
    })
    .filter((entry) => entry.tag.length > 0)
    .sort((a, b) => {
      if (b.q !== a.q) return b.q - a.q
      return a.index - b.index
    })
    .map((entry) => entry.tag)
}

export function resolveDocsLocale(input: { cookieLocale?: string | null; acceptLanguage?: string | null }): DocsLocale {
  const savedLocale = normalizeDocsLocale(input.cookieLocale)

  if (savedLocale) return savedLocale

  const browserLocale = parseAcceptLanguage(input.acceptLanguage)
    .map(mapLanguageTagToLocale)
    .find((locale): locale is DocsLocale => locale !== undefined)

  return browserLocale ?? defaultDocsLocale
}

export function extractLocaleFromPathname(pathname: string): DocsLocale | undefined {
  const segment = pathname.split('/').filter(Boolean)[0]

  return normalizeDocsLocale(segment)
}
