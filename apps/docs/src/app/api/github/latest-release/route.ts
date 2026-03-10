import { NextResponse } from 'next/server'

const latestReleaseApiUrl = 'https://api.github.com/repos/thejoaov/tray-link/releases/latest'

function getGithubToken() {
  return process.env.GITHUB_API_KEY ?? process.env.GITHUB_TOKEN ?? process.env.GITHUB_API_TOKEN
}

export async function GET() {
  const token = getGithubToken()
  const response = await fetch(latestReleaseApiUrl, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    return NextResponse.json({ error: 'latest release request failed' }, { status: response.status })
  }

  const data = (await response.json()) as {
    tag_name?: string
    assets?: Array<{
      browser_download_url: string
      name: string
    }>
  }
  const tag = data.tag_name ?? ''
  const version = tag.replace(/^v/i, '')

  return NextResponse.json({ tag, version, assets: data.assets ?? [] })
}
