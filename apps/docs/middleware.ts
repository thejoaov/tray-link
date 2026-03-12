import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { docsLocaleCookieName, extractLocaleFromPathname, resolveDocsLocale } from '@/lib/docs-locale'

const oneYearInSeconds = 60 * 60 * 24 * 365

function stripUnsupportedLocalePrefix(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]

  if (!firstSegment) return pathname
  if (/^[a-z]{2}(?:-[a-z]{2})?$/i.test(firstSegment)) {
    const rest = segments.slice(1).join('/')
    return rest ? `/${rest}` : '/'
  }

  return pathname
}

function setLocaleCookie(response: NextResponse, locale: string) {
  response.cookies.set({
    name: docsLocaleCookieName,
    value: locale,
    path: '/',
    maxAge: oneYearInSeconds,
    sameSite: 'lax',
  })
}

export default function middleware(request: NextRequest) {
  const pathnameLocale = extractLocaleFromPathname(request.nextUrl.pathname)

  if (pathnameLocale) {
    const response = NextResponse.next()
    setLocaleCookie(response, pathnameLocale)
    return response
  }

  const locale = resolveDocsLocale({
    cookieLocale: request.cookies.get(docsLocaleCookieName)?.value,
    acceptLanguage: request.headers.get('accept-language'),
  })
  const redirectUrl = request.nextUrl.clone()
  const normalizedPathname = stripUnsupportedLocalePrefix(request.nextUrl.pathname)

  redirectUrl.pathname = normalizedPathname === '/' ? `/${locale}` : `/${locale}${normalizedPathname}`

  const response = NextResponse.redirect(redirectUrl)
  setLocaleCookie(response, locale)

  return response
}

export const config = {
  // Matcher ignoring `/_next/` and `/api/`
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|og|.*\\..*).*)'],
}
