import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { docsLocaleCookieName, resolveDocsLocale } from '@/lib/docs-locale'

export default async function Page() {
  const cookieStore = await cookies()
  const requestHeaders = await headers()
  const locale = resolveDocsLocale({
    cookieLocale: cookieStore.get(docsLocaleCookieName)?.value,
    acceptLanguage: requestHeaders.get('accept-language'),
  })

  redirect(`/${locale}`)
}
