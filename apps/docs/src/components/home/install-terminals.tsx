'use client'

import { buttonVariants } from 'fumadocs-ui/components/ui/button'
import { useCopyButton } from 'fumadocs-ui/utils/use-copy-button'
import { Check, Copy, Download, TerminalSquare } from 'lucide-react'
import { useState } from 'react'
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

function TerminalCommand({
  command,
  copyLabel,
  copiedLabel,
  commandLabel,
}: {
  command: string
  copyLabel: string
  copiedLabel: string
  commandLabel: string
}) {
  const [checked, onClick] = useCopyButton(() => navigator.clipboard.writeText(command))

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-[0_0_30px_rgba(15,23,42,0.35)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-violet-400 shadow-[0_0_14px_rgba(167,139,250,0.9)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.9)]" />
          </div>
          <p className="text-xs uppercase tracking-[0.24em] text-white/45">{commandLabel}</p>
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

      <div className="px-4 py-4">
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
  commandLabel,
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
  commandLabel: string
  assetNotFoundLabel: string
}) {
  const [selectedMethodId, setSelectedMethodId] = useState(methods[0]?.id)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const selectedMethod = methods.find((method) => method.id === selectedMethodId) ?? methods[0]

  if (!selectedMethod) return null

  async function handleDownload() {
    if (!selectedMethod.assetPattern || !selectedMethod.releaseUrl || isDownloading) {
      return
    }

    setDownloadError(null)
    setIsDownloading(true)

    try {
      const response = await fetch(selectedMethod.releaseUrl, {
        headers: {
          Accept: 'application/vnd.github+json',
        },
      })

      if (!response.ok) {
        throw new Error('latest release request failed')
      }

      const release = (await response.json()) as GithubLatestRelease
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
                'rounded-full border px-3 py-2 text-left text-xs font-medium tracking-[0.16em] uppercase transition-all duration-300',
                selectedMethod.id === method.id
                  ? 'border-cyan-300/55 bg-cyan-400/12 text-white shadow-[0_0_24px_rgba(34,211,238,0.16)]'
                  : 'border-white/10 bg-white/5 text-white/56 hover:border-white/20 hover:bg-white/10 hover:text-white/82',
              )}
            >
              {method.label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/30">
          <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 min-[600px]:flex-row min-[600px]:items-start min-[600px]:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.24em] text-cyan-300/85">{selectedMethod.label}</p>
              <p className="mt-2 text-sm leading-7 text-white/62">{selectedMethod.description}</p>
            </div>

            {selectedMethod.assetPattern && selectedMethod.releaseUrl ? (
              <button
                type="button"
                onClick={handleDownload}
                disabled={isDownloading}
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
              <TerminalCommand
                command={selectedMethod.command}
                copyLabel={copyLabel}
                copiedLabel={copiedLabel}
                commandLabel={commandLabel}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
