'use client'

import { useQuery } from '@tanstack/react-query'
import { buttonVariants } from 'fumadocs-ui/components/ui/button'
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button'
import { Check, Copy, Download, TerminalSquare } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { IconType } from 'react-icons'
import { FaWindows } from 'react-icons/fa6'
import { SiApple, SiDebian, SiDotnet, SiFedora, SiHomebrew, SiMacos } from 'react-icons/si'
import { cn } from '@/lib/cn'

export type InstallMethodOption = {
  id: string
  label: string
  description: string
  steps: string[]
  filename?: string
  command?: string
  assetPattern?: string
  releaseUrl?: string
}

type GithubLatestRelease = {
  assets: Array<{
    browser_download_url: string
    name: string
  }>
}

type GithubLatestReleaseVersion = {
  tag: string
  version: string
  assets: GithubLatestRelease['assets']
}

const VERSION_PLACEHOLDER = '{version}'

const MATRIX_ROWS = [
  '01110100 01110010 01100001 01111001 00101101 01101100 01101001 01101110 01101011',
  '$ syncing latest release metadata...',
  '> resolving github tag_name',
  '> compiling platform install commands',
  '> matching release asset patterns',
  '████████████████████████████████████',
] as const

const installMethodIcons: Record<string, IconType> = {
  'homebrew-macos': SiHomebrew,
  'linux-fedora': SiFedora,
  'linux-debian': SiDebian,
  'macos-intel': SiMacos,
  'macos-arm64': SiApple,
  'windows-setup': FaWindows,
  'windows-nuget': SiDotnet,
}

function InstallMethodIcon({ methodId, size = 16 }: { methodId: string; size?: number }) {
  const Icon = installMethodIcons[methodId]

  if (!Icon) {
    return null
  }

  return <Icon size={size} className="shrink-0" aria-hidden />
}

function patternToRegex(pattern: string) {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return new RegExp(`^${escaped.replace(/\\\{version\\\}/g, '.+')}$`, 'i')
}

function triggerBrowserDownload(url: string) {
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = ''
  anchor.rel = 'noreferrer'
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

function methodNeedsResolvedVersion(method: InstallMethodOption) {
  return [method.filename, method.assetPattern, method.command].some((value) => value?.includes(VERSION_PLACEHOLDER))
}

function replaceVersionPlaceholder(value: string | undefined, version?: string) {
  if (!value || !version) {
    return value
  }

  return value.replaceAll(VERSION_PLACEHOLDER, version)
}

async function fetchLatestReleaseVersion() {
  const response = await fetch('/api/github/latest-release')

  if (!response.ok) {
    throw new Error('latest release version request failed')
  }

  return (await response.json()) as GithubLatestReleaseVersion
}

function TerminalMatrixLoader() {
  return (
    <div className="relative flex h-full min-h-88 flex-col overflow-hidden rounded-3xl border border-emerald-400/10 bg-black/95 px-5 py-5 font-mono text-xs text-emerald-300/70 shadow-[0_0_40px_rgba(16,185,129,0.08)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_42%),linear-gradient(180deg,rgba(16,185,129,0.08),transparent_35%,rgba(16,185,129,0.04))]" />
      <div className="absolute inset-x-0 top-0 h-16 animate-[pulse_1.8s_ease-in-out_infinite] bg-[linear-gradient(180deg,rgba(52,211,153,0.18),transparent)]" />
      <div className="absolute inset-y-0 left-0 w-px bg-emerald-300/10" />

      <div className="relative flex items-center gap-2 border-b border-emerald-400/10 pb-3 text-[11px] uppercase tracking-[0.28em] text-emerald-200/72">
        <span className="inline-flex h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.7)]" />
        <span>Terminal Sync</span>
      </div>

      <div className="relative mt-4 space-y-3">
        {MATRIX_ROWS.map((row, index) => (
          <p
            key={`${row}-${index}`}
            className="animate-pulse whitespace-pre-wrap break-all leading-6"
            style={{ animationDelay: `${index * 140}ms` }}
          >
            {row}
          </p>
        ))}
      </div>

      <div className="relative mt-auto pt-4 text-[11px] uppercase tracking-[0.22em] text-emerald-200/46">
        Preparing version-aligned install instructions
      </div>
    </div>
  )
}

function TerminalCommand({
  command,
  copyLabel,
  copiedLabel,
}: {
  command: string
  copyLabel: string
  copiedLabel: string
}) {
  const [checked, onClick] = useCopyButton(() => navigator.clipboard.writeText(command))

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-[0_0_30px_rgba(15,23,42,0.35)]">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_14px_rgba(167,139,250,0.9)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
          </div>
        </div>

        <button
          type="button"
          className={cn(
            buttonVariants({
              color: 'secondary',
              size: 'sm',
              className:
                'h-8 gap-2 rounded-full border border-white/10 bg-white/5 px-3 text-xs text-white/78 backdrop-blur-xl hover:bg-white/10 hover:text-white [&_svg]:size-3.5 [&_svg]:text-white/70',
            }),
          )}
          onClick={onClick}
        >
          {checked ? <Check /> : <Copy />}
          {checked ? copiedLabel : copyLabel}
        </button>
      </div>

      <div className="px-4 pb-4">
        <div className="overflow-x-auto rounded-2xl border border-white/8 bg-black/35 px-4 py-4 font-mono text-sm leading-7 text-white/82">
          {command.split('\n').map((line, index) => (
            <div key={`${line}-${index}`} className="flex gap-3 whitespace-pre">
              <span className="select-none text-emerald-300/85">$</span>
              <span>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function InstallTerminals({
  eyebrow,
  title,
  description,
  methods,
  copyLabel,
  copiedLabel,
  downloadLabel,
  downloadingLabel,
  instructionsLabel,
  assetNotFoundLabel,
}: {
  eyebrow: string
  title: string
  description: string
  methods: InstallMethodOption[]
  copyLabel: string
  copiedLabel: string
  downloadLabel: string
  downloadingLabel: string
  instructionsLabel: string
  assetNotFoundLabel: string
}) {
  const [selectedMethodId, setSelectedMethodId] = useState(methods[0]?.id)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [showVersionLoadingOverlay, setShowVersionLoadingOverlay] = useState(false)

  const requiresVersionData = useMemo(() => methods.some((method) => methodNeedsResolvedVersion(method)), [methods])

  const { data: latestReleaseVersion, isLoading: isVersionLoading } = useQuery({
    queryKey: ['github-latest-release-version'],
    queryFn: fetchLatestReleaseVersion,
    enabled: requiresVersionData,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  })

  const resolvedMethods = useMemo(() => {
    if (!requiresVersionData || !latestReleaseVersion?.version) {
      return methods
    }

    return methods.map((method) => ({
      ...method,
      filename: replaceVersionPlaceholder(method.filename, latestReleaseVersion.version),
      assetPattern: replaceVersionPlaceholder(method.assetPattern, latestReleaseVersion.version),
      command: replaceVersionPlaceholder(method.command, latestReleaseVersion.version),
    }))
  }, [latestReleaseVersion?.version, methods, requiresVersionData])

  const selectedMethod = resolvedMethods.find((method) => method.id === selectedMethodId) ?? resolvedMethods[0]

  useEffect(() => {
    if (!requiresVersionData) {
      return
    }

    if (isVersionLoading) {
      setShowVersionLoadingOverlay(true)
      return
    }

    const timeout = window.setTimeout(() => {
      setShowVersionLoadingOverlay(false)
    }, 450)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [isVersionLoading, requiresVersionData])

  if (!selectedMethod) return null

  async function handleDownload() {
    if (!selectedMethod.assetPattern || !selectedMethod.releaseUrl || isDownloading) {
      return
    }

    setDownloadError(null)
    setIsDownloading(true)

    try {
      const release = latestReleaseVersion

      if (!release) {
        throw new Error('latest release version request failed')
      }

      const matcher = patternToRegex(selectedMethod.assetPattern)
      const asset = release.assets.find((item) => matcher.test(item.name))

      if (!asset) {
        setDownloadError(assetNotFoundLabel)
        return
      }

      triggerBrowserDownload(asset.browser_download_url)
    } catch {
      setDownloadError(assetNotFoundLabel)
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div className="homepage-float relative w-full rounded-4xl border border-white/12 bg-white/7 p-6 shadow-[0_0_80px_rgba(15,23,42,0.65)] backdrop-blur-2xl">
      <div className="absolute inset-0 rounded-4xl bg-[linear-gradient(135deg,rgba(59,130,246,0.16),rgba(139,92,246,0.1)_50%,rgba(16,185,129,0.12))]" />

      <div className="relative space-y-5 min-[600px]:space-y-6">
        <div className="rounded-3xl border border-white/10 bg-black/30 px-5 py-4">
          <div className="flex items-center gap-3 text-cyan-300">
            <TerminalSquare className="h-5 w-5" />
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">{eyebrow}</p>
          </div>
          <h3 className="mt-3 text-xl font-semibold text-white">{title}</h3>
          <p className="mt-2 text-sm leading-7 text-white/62">{description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {methods.map((method) => (
            <button
              key={method.id}
              type="button"
              onClick={() => setSelectedMethodId(method.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-left text-xs font-medium tracking-[0.16em] uppercase transition-all duration-300',
                selectedMethod.id === method.id
                  ? 'border-cyan-300/55 bg-cyan-400/12 text-white shadow-[0_0_24px_rgba(34,211,238,0.16)]'
                  : 'border-white/10 bg-white/5 text-white/56 hover:border-white/20 hover:bg-white/10 hover:text-white/82',
              )}
            >
              <InstallMethodIcon methodId={method.id} />
              {method.label}
            </button>
          ))}
        </div>

        <div
          className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30"
          aria-busy={isVersionLoading}
        >
          {showVersionLoadingOverlay ? (
            <div
              aria-hidden
              className={cn(
                'pointer-events-none absolute inset-0 z-10 transition-opacity duration-500',
                isVersionLoading ? 'opacity-100' : 'opacity-0',
              )}
            >
              <TerminalMatrixLoader />
            </div>
          ) : null}

          <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 min-[600px]:flex-row min-[600px]:items-start min-[600px]:justify-between">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-cyan-300/85">
                <InstallMethodIcon methodId={selectedMethod.id} size={18} />
                <span>{selectedMethod.label}</span>
              </p>
              <p className="mt-2 text-sm leading-7 text-white/62">{selectedMethod.description}</p>
            </div>

            {selectedMethod.assetPattern && selectedMethod.releaseUrl ? (
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading || isVersionLoading}
                className={cn(
                  buttonVariants({
                    color: 'secondary',
                    size: 'sm',
                    className:
                      'h-9 shrink-0 gap-2 rounded-full border border-white/10 bg-white/5 px-4 text-xs text-white/82 backdrop-blur-xl hover:bg-white/10 hover:text-white [&_svg]:size-3.5 [&_svg]:text-white/72',
                  }),
                )}
              >
                <Download />
                {isDownloading ? downloadingLabel : downloadLabel}
              </button>
            ) : null}
          </div>

          {downloadError ? (
            <div className="border-b border-white/10 px-5 py-3 text-xs text-amber-200/88">{downloadError}</div>
          ) : null}

          <div className="grid gap-5 px-5 py-5">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-white/42">{instructionsLabel}</p>
              <ol className="mt-3 space-y-3">
                {selectedMethod.steps.map((step, index) => (
                  <li
                    key={`${selectedMethod.id}-${index}`}
                    className="flex items-start gap-3 text-sm leading-7 text-white/72"
                  >
                    <span className="mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/6 text-xs text-white/62">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {selectedMethod.command ? (
              <TerminalCommand command={selectedMethod.command} copyLabel={copyLabel} copiedLabel={copiedLabel} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
