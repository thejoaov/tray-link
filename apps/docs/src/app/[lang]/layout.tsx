import { defineI18nUI } from 'fumadocs-ui/i18n'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { Inter } from 'next/font/google'
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
      displayName: 'Português',
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

  return (
    <div className={inter.className}>
      <RootProvider i18n={provider(lang)}>{children}</RootProvider>
    </div>
  )
}
