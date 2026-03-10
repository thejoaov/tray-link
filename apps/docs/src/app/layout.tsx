import './global.css'

import type { Metadata } from 'next'

export const metadata: Metadata = {
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/tray-link.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className="flex flex-col min-h-screen">{children}</body>
    </html>
  )
}
