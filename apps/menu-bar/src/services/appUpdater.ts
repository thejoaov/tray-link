import { EmitterSubscription, Platform } from 'react-native'
import { installAppUpdate } from '../../modules/shell-utils/src'
import { getItem, setItem } from '../../modules/storage-module/src'
import MenuBarModule from '../modules/MenuBarModule'

const RELEASES_API_URL = 'https://api.github.com/repos/thejoaov/tray-link/releases/latest'
const UPDATE_STATE_STORAGE_KEY = 'app-updater-state'
const AUTO_CHECK_DELAY_MS = 4000
const isElectron = Platform.OS === 'web'
const isMacOS =
  Platform.OS === 'macos' || (isElectron && typeof navigator !== 'undefined' && /mac/i.test(navigator.userAgent))

type ReleaseAsset = {
  name: string
  browser_download_url: string
}

type GitHubRelease = {
  html_url?: string
  name?: string | null
  published_at?: string | null
  tag_name: string
  assets?: ReleaseAsset[]
}

export type AppUpdaterStatus = 'idle' | 'checking' | 'available' | 'upToDate' | 'installing' | 'installed' | 'error'

export type AppUpdaterState = {
  currentVersion: string
  downloadUrl: string | null
  error: string | null
  isSupported: boolean
  lastCheckedAt: string | null
  latestVersion: string | null
  releasePageUrl: string | null
  status: AppUpdaterStatus
}

type PersistedUpdaterState = Pick<AppUpdaterState, 'lastCheckedAt' | 'latestVersion' | 'releasePageUrl'>

type Listener = (state: AppUpdaterState) => void

const listeners = new Set<Listener>()

let initializePromise: Promise<void> | null = null
let checkPromise: Promise<AppUpdaterState> | null = null
let autoCheckTimer: ReturnType<typeof setTimeout> | null = null

let state: AppUpdaterState = {
  currentVersion: normalizeVersion(MenuBarModule.appVersion || '0.0.0'),
  downloadUrl: null,
  error: null,
  isSupported: isMacOS,
  lastCheckedAt: null,
  latestVersion: null,
  releasePageUrl: null,
  status: 'idle',
}

function emitState() {
  listeners.forEach((listener) => listener(state))
}

function setState(next: Partial<AppUpdaterState>) {
  state = { ...state, ...next }
  emitState()
}

function toPersistedState(value: AppUpdaterState): PersistedUpdaterState {
  return {
    lastCheckedAt: value.lastCheckedAt,
    latestVersion: value.latestVersion,
    releasePageUrl: value.releasePageUrl,
  }
}

function serializePersistedState(value: AppUpdaterState): string {
  return JSON.stringify(toPersistedState(value))
}

async function persistState() {
  await setItem(UPDATE_STATE_STORAGE_KEY, serializePersistedState(state))
}

async function hydrateState() {
  const raw = await getItem(UPDATE_STATE_STORAGE_KEY)
  if (!raw) {
    return
  }

  try {
    const persisted = JSON.parse(raw) as Partial<PersistedUpdaterState>
    setState({
      lastCheckedAt: typeof persisted.lastCheckedAt === 'string' ? persisted.lastCheckedAt : null,
      latestVersion: typeof persisted.latestVersion === 'string' ? persisted.latestVersion : null,
      releasePageUrl: typeof persisted.releasePageUrl === 'string' ? persisted.releasePageUrl : null,
    })
  } catch {
    setState({
      lastCheckedAt: null,
      latestVersion: null,
      releasePageUrl: null,
    })
  }
}

function normalizeVersion(version: string): string {
  return version
    .replace(/^tray-link-v/i, '')
    .replace(/^v/i, '')
    .trim()
}

function compareVersions(left: string, right: string): number {
  const leftParts = normalizeVersion(left)
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0)
  const rightParts = normalizeVersion(right)
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0)
  const length = Math.max(leftParts.length, rightParts.length)

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftParts[index] ?? 0
    const rightPart = rightParts[index] ?? 0

    if (leftPart > rightPart) {
      return 1
    }

    if (leftPart < rightPart) {
      return -1
    }
  }

  return 0
}

function getReleaseAsset(assets: ReleaseAsset[] = []): ReleaseAsset | null {
  if (isElectron) {
    return (
      assets.find(
        (asset) =>
          /tray[-_. ]?link/i.test(asset.name) &&
          /darwin/i.test(asset.name) &&
          /\.zip$/i.test(asset.name) &&
          !/tray[-_. ]?link[-_. ]?macos[-_. ]?universal/i.test(asset.name),
      ) ??
      assets.find(
        (asset) =>
          /darwin/i.test(asset.name) &&
          /\.zip$/i.test(asset.name) &&
          !/tray[-_. ]?link[-_. ]?macos[-_. ]?universal/i.test(asset.name),
      ) ??
      null
    )
  }

  return (
    assets.find(
      (asset) => /tray[-_. ]?link[-_. ]?macos[-_. ]?universal/i.test(asset.name) && /\.zip$/i.test(asset.name),
    ) ??
    assets.find((asset) => /(mac|darwin|osx|universal)/i.test(asset.name) && /\.zip$/i.test(asset.name)) ??
    null
  )
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Unknown updater error'
}

async function fetchLatestRelease(): Promise<GitHubRelease> {
  const response = await fetch(RELEASES_API_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
  })

  if (!response.ok) {
    throw new Error(`GitHub releases request failed with status ${response.status}`)
  }

  return (await response.json()) as GitHubRelease
}

async function finalizeCheck(nextState: Partial<AppUpdaterState>) {
  setState({
    currentVersion: normalizeVersion(MenuBarModule.appVersion || state.currentVersion),
    ...nextState,
  })
  await persistState()
}

export function getUpdaterState(): AppUpdaterState {
  return state
}

export function subscribeUpdater(listener: Listener): EmitterSubscription {
  listeners.add(listener)
  listener(state)

  return {
    remove() {
      listeners.delete(listener)
    },
  } as EmitterSubscription
}

export async function initializeUpdater(): Promise<void> {
  if (initializePromise) {
    return initializePromise
  }

  initializePromise = (async () => {
    setState({
      currentVersion: normalizeVersion(MenuBarModule.appVersion || state.currentVersion),
      isSupported: isMacOS,
    })

    await hydrateState()

    if (!state.isSupported) {
      return
    }

    if (autoCheckTimer) {
      clearTimeout(autoCheckTimer)
    }

    autoCheckTimer = setTimeout(() => {
      void checkForUpdates({ silent: true })
    }, AUTO_CHECK_DELAY_MS)
  })()

  return initializePromise
}

export async function checkForUpdates(options: { silent?: boolean } = {}): Promise<AppUpdaterState> {
  if (!state.isSupported) {
    setState({ error: null, status: 'idle' })
    return state
  }

  if (checkPromise) {
    return checkPromise
  }

  const previousStatus = state.status
  setState({ error: null, status: 'checking' })

  checkPromise = (async () => {
    try {
      const release = await fetchLatestRelease()
      const latestVersion = normalizeVersion(release.tag_name || release.name || state.currentVersion)
      const asset = getReleaseAsset(release.assets)

      if (!asset) {
        throw new Error('No macOS update asset was found in the latest release')
      }

      const isAvailable = compareVersions(latestVersion, state.currentVersion) > 0

      await finalizeCheck({
        downloadUrl: asset.browser_download_url,
        error: null,
        lastCheckedAt: new Date().toISOString(),
        latestVersion,
        releasePageUrl: release.html_url ?? null,
        status: isAvailable ? 'available' : 'upToDate',
      })
    } catch (error) {
      await finalizeCheck({
        error: getErrorMessage(error),
        lastCheckedAt: new Date().toISOString(),
        status: options.silent && previousStatus !== 'checking' ? previousStatus : 'error',
      })
    } finally {
      checkPromise = null
    }

    return state
  })()

  return checkPromise
}

export async function installLatestUpdate(): Promise<AppUpdaterState> {
  if (!state.isSupported) {
    setState({ error: 'In-app updates are only available on macOS', status: 'error' })
    return state
  }

  if (!state.downloadUrl) {
    setState({ error: 'No update is ready to install', status: 'error' })
    return state
  }

  setState({ error: null, status: 'installing' })

  const result = await installAppUpdate(state.downloadUrl)
  if (!result.success) {
    setState({ error: result.error || 'Failed to install the update', status: 'error' })
    return state
  }

  setState({ error: null, status: 'installed' })
  setTimeout(() => {
    MenuBarModule.exitApp()
  }, 1000)

  return state
}
