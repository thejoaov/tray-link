import { defineI18nUI } from 'fumadocs-ui/i18n'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { Inter } from 'next/font/google'
import { LanguagePersistence } from '@/components/providers/language-persistence'
import { QueryProvider } from '@/components/providers/query-provider'
import { defaultDocsLocale, normalizeDocsLocale } from '@/lib/docs-locale'
import { i18n } from '@/lib/i18n'

const inter = Inter({
  subsets: ['latin'],
})

const { provider } = defineI18nUI(i18n, {
  translations: {
    en: {
      displayName: 'English',
    },
    pt: {
      displayName: 'Português (Brasil)',
      search: 'Pesquisar',
    },
    es: {
      displayName: 'Español',
      search: 'Buscar',
    },
  },
})

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>
  children: React.ReactNode
}) {
  const { lang } = await params
  const locale = normalizeDocsLocale(lang) ?? defaultDocsLocale

  return (
    <div className={inter.className}>
      <QueryProvider>
        <RootProvider i18n={provider(locale)}>
          <LanguagePersistence lang={locale} />
          {children}
        </RootProvider>
      </QueryProvider>
    </div>
  )
}
