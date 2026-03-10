import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import Image from 'next/image'
import { i18n } from '@/lib/i18n'

export const gitConfig = {
  user: 'thejoaov',
  repo: 'tray-link',
  branch: 'main',
}

export function baseOptions(locale: string): BaseLayoutProps {
  return {
    i18n,
    nav: {
      title: (
        <div className="flex items-center gap-2">
          <Image src="/tray-link.svg" alt="Tray Link" width={24} height={24} className="rounded-md" />
          <span>Tray Link</span>
        </div>
      ),
      url: `/${locale}`,
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      {
        icon: <Image src="/tray-link.svg" alt="Tray Link" width={16} height={16} className="rounded-sm" />,
        text: 'Docs',
        url: `/${locale}/docs`,
      },
      {
        text: 'Releases',
        url: `https://github.com/${gitConfig.user}/${gitConfig.repo}/releases`,
      },
    ],
  }
}
