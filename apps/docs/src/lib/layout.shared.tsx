import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
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
      title: 'Tray Link',
    },
    githubUrl: `https://github.com/${gitConfig.user}/${gitConfig.repo}`,
    links: [
      {
        text: 'Releases',
        url: `https://github.com/${gitConfig.user}/${gitConfig.repo}/releases`,
      },
    ],
  }
}
