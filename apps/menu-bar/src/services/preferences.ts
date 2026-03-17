import { CustomTool } from '@tray-link/common-types'
import {
  getSupportedToolCatalog,
  isToolCatalogPlatform,
  SupportedToolCatalog,
  SupportedToolDefinition,
  ToolCatalogPlatform,
} from '@tray-link/tray-shared'
import { EmitterSubscription, Platform } from 'react-native'
import { z } from 'zod'
import { fileExists, getFileIconDataUrl, which } from '../../modules/shell-utils/src'
import { getItem, setItem } from '../../modules/storage-module/src'
import { DeviceEventEmitter } from '../modules/DeviceEventEmitter'
import MenuBarModule from '../modules/MenuBarModule'
import {
  defaultUserPreferences,
  getUserPreferences,
  migratePreferencesFromMMKV,
  saveUserPreferences,
  UserPreferences,
} from '../modules/Storage'

/** Generates a URL-safe slug from a tool name (local copy to avoid pulling Node-only tray-shared barrel). */
const generateSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

export type ToolOption = {
  label: string
  command: string
  slug: string
  iconName?: 'code-slash-outline' | 'terminal-outline'
  iconPath?: string | null
}

type DiscoverableTool = {
  label: string
  command: string
  binary?: string
  commonFilepaths?: string[]
  iconBasenames?: string[]
  alwaysAvailable?: boolean
}

const SUPPORTED_TOOL_CATALOG_STORAGE_KEY = 'supported-tool-catalog-cache-v1'
const REMOTE_SUPPORTED_TOOL_CATALOG_URL =
  'https://raw.githubusercontent.com/thejoaov/tray-link/main/packages/tray-shared/src/constants/supported-tool-catalog.json'

const supportedToolDefinitionSchema = z.object({
  name: z.string().min(1),
  command: z.string().min(1).nullable(),
  binary: z.string().min(1).nullable(),
  enableBinaryCheck: z.boolean(),
  enableCommonPathCheck: z.boolean(),
  commonFilepaths: z.array(z.string()),
  iconBasenames: z.array(z.string()),
  alwaysAvailable: z.boolean(),
})

const supportedToolCatalogSchema = z.object({
  editors: z.object({
    darwin: z.array(supportedToolDefinitionSchema),
    linux: z.array(supportedToolDefinitionSchema),
    win32: z.array(supportedToolDefinitionSchema),
  }),
  terminals: z.object({
    darwin: z.array(supportedToolDefinitionSchema),
    linux: z.array(supportedToolDefinitionSchema),
    win32: z.array(supportedToolDefinitionSchema),
  }),
})

const toFileUri = (filepath: string): string => {
  if (filepath.startsWith('file://')) {
    return filepath
  }

  return `file://${filepath}`
}

const stripAppExtension = (name: string): string => name.replace(/\.app$/i, '')

const unique = (values: Array<string | null | undefined>): string[] => {
  return [...new Set(values.filter((value): value is string => Boolean(value)))]
}

const resolveIconCandidatePaths = (tool: DiscoverableTool, filepath: string): string[] => {
  const appName = stripAppExtension(filepath.split('/').pop() ?? '')
  const normalized = appName.replace(/\s+/g, '')
  const iconBasenames = unique([
    ...(tool.iconBasenames ?? []),
    appName,
    normalized,
    `${normalized}2`,
    'AppIcon',
    'Electron',
    'app',
  ])

  return iconBasenames.flatMap((baseName) => [
    `${filepath}/Contents/Resources/${baseName}.icns`,
    `${filepath}/Contents/Resources/${baseName}.png`,
  ])
}

const resolveIconPath = async (tool: DiscoverableTool): Promise<string | null> => {
  for (const filepath of tool.commonFilepaths ?? []) {
    if (Platform.OS === 'web') {
      const iconDataUrl = await getFileIconDataUrl(filepath)
      if (iconDataUrl) {
        return iconDataUrl
      }
    }

    if (filepath.endsWith('.png') || filepath.endsWith('.ico') || filepath.endsWith('.icns')) {
      if (await fileExists(filepath)) {
        return toFileUri(filepath)
      }
    }

    if (filepath.endsWith('.app')) {
      const candidatePaths = resolveIconCandidatePaths(tool, filepath)

      for (const candidate of candidatePaths) {
        if (await fileExists(candidate)) {
          return toFileUri(candidate)
        }
      }
    }
  }

  return null
}

export const resolveCustomToolIconPath = async (filepath?: string | null): Promise<string | null> => {
  if (!filepath) {
    return null
  }

  return resolveIconPath({
    label: 'Custom Tool',
    command: filepath,
    commonFilepaths: [filepath],
  })
}

export const PREFERENCES_CHANGED_EVENT = 'preferencesChanged'

let discoveredEditorOptions: ToolOption[] = []
let discoveredTerminalOptions: ToolOption[] = []
let supportedToolCatalog: SupportedToolCatalog = getSupportedToolCatalog()
let refreshSupportedToolCatalogPromise: Promise<void> | null = null

const serializeSupportedToolCatalog = (value: SupportedToolCatalog): string => JSON.stringify(value)

const parseSupportedToolCatalog = (value: unknown): SupportedToolCatalog => {
  return supportedToolCatalogSchema.parse(value) as SupportedToolCatalog
}

const loadCachedSupportedToolCatalog = async (): Promise<SupportedToolCatalog | null> => {
  try {
    const raw = await getItem(SUPPORTED_TOOL_CATALOG_STORAGE_KEY)
    if (!raw) {
      return null
    }

    return parseSupportedToolCatalog(JSON.parse(raw))
  } catch {
    return null
  }
}

const persistSupportedToolCatalog = async (value: SupportedToolCatalog): Promise<void> => {
  await setItem(SUPPORTED_TOOL_CATALOG_STORAGE_KEY, serializeSupportedToolCatalog(value))
}

const resolveCatalogPlatform = (): ToolCatalogPlatform => {
  if (Platform.OS === 'macos') {
    return 'darwin'
  }

  if (Platform.OS === 'windows') {
    return 'win32'
  }

  if (Platform.OS === 'web' && typeof navigator !== 'undefined') {
    const userAgent = navigator.userAgent.toLowerCase()
    if (userAgent.includes('win')) {
      return 'win32'
    }
    if (userAgent.includes('linux')) {
      return 'linux'
    }
    return 'darwin'
  }

  if (isToolCatalogPlatform(Platform.OS)) {
    return Platform.OS
  }

  return 'darwin'
}

const toDiscoverableTool = (definition: SupportedToolDefinition): DiscoverableTool | null => {
  if (!definition.command) {
    return null
  }

  return {
    label: definition.name,
    command: definition.command,
    binary: definition.binary ?? undefined,
    commonFilepaths: definition.commonFilepaths,
    iconBasenames: definition.iconBasenames,
    alwaysAvailable: definition.alwaysAvailable,
  }
}

const getDiscoverableTools = (type: keyof SupportedToolCatalog): DiscoverableTool[] => {
  const platform = resolveCatalogPlatform()
  return (supportedToolCatalog[type][platform] ?? [])
    .map(toDiscoverableTool)
    .filter((item): item is DiscoverableTool => item !== null)
}

const fetchRemoteSupportedToolCatalog = async (): Promise<SupportedToolCatalog> => {
  const response = await fetch(`${REMOTE_SUPPORTED_TOOL_CATALOG_URL}?ts=${Date.now()}`, {
    headers: {
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`Supported tool catalog request failed with status ${response.status}`)
  }

  return parseSupportedToolCatalog(await response.json())
}

const refreshSupportedToolCatalog = async (): Promise<void> => {
  if (refreshSupportedToolCatalogPromise) {
    return refreshSupportedToolCatalogPromise
  }

  refreshSupportedToolCatalogPromise = (async () => {
    const bundledCatalog = getSupportedToolCatalog()

    try {
      const remoteCatalog = await fetchRemoteSupportedToolCatalog()
      supportedToolCatalog = remoteCatalog
      await persistSupportedToolCatalog(remoteCatalog)
    } catch {
      const cachedCatalog = await loadCachedSupportedToolCatalog()
      supportedToolCatalog = cachedCatalog ?? supportedToolCatalog ?? bundledCatalog
    } finally {
      refreshSupportedToolCatalogPromise = null
    }
  })()

  return refreshSupportedToolCatalogPromise
}

export const loadPreferences = async (): Promise<UserPreferences> => {
  const stored = await getUserPreferences()
  return { ...defaultUserPreferences, ...stored }
}

const syncLaunchOnLoginPreference = async (preferences: UserPreferences): Promise<void> => {
  await MenuBarModule.setLoginItemEnabled(Boolean(preferences.launchOnLogin))
}

export const persistPreferences = async (next: UserPreferences): Promise<void> => {
  await saveUserPreferences(next)
  await syncLaunchOnLoginPreference(next)
  DeviceEventEmitter.emit(PREFERENCES_CHANGED_EVENT)
}

/**
 * Run once on app startup: migrates MMKV preferences to config.json,
 * then kicks off tool detection.
 */
export const initializePreferences = async (): Promise<void> => {
  await migratePreferencesFromMMKV()
  const preferences = await loadPreferences()
  await syncLaunchOnLoginPreference(preferences)
  await reloadToolOptions()
}

export const subscribePreferencesChange = (listener: () => void): EmitterSubscription => {
  return DeviceEventEmitter.addListener(PREFERENCES_CHANGED_EVENT, listener)
}

const isToolInstalled = async (tool: DiscoverableTool): Promise<boolean> => {
  if (tool.alwaysAvailable) {
    return true
  }

  try {
    if (tool.binary) {
      const binaryPath = await which(tool.binary)
      if (binaryPath) {
        return true
      }
    }

    if (tool.commonFilepaths?.length) {
      for (const filepath of tool.commonFilepaths) {
        if (await fileExists(filepath)) {
          return true
        }
      }
    }
  } catch {
    // IPC or native module call failed — treat tool as not installed
  }

  return false
}

const discoverTools = async (
  candidates: DiscoverableTool[],
  iconName: ToolOption['iconName'],
): Promise<ToolOption[]> => {
  const discovered: ToolOption[] = []

  for (const tool of candidates) {
    const installed = await isToolInstalled(tool)
    if (installed) {
      const iconPath = await resolveIconPath(tool)
      discovered.push({
        label: tool.label,
        command: tool.command,
        slug: generateSlug(tool.label),
        iconName,
        iconPath,
      })
    }
  }

  return discovered
}

export const reloadToolOptions = async () => {
  await refreshSupportedToolCatalog()

  try {
    const [editors, terminals] = await Promise.all([
      discoverTools(getDiscoverableTools('editors'), 'code-slash-outline'),
      discoverTools(getDiscoverableTools('terminals'), 'terminal-outline'),
    ])

    discoveredEditorOptions = dedupeOptions(editors)
    discoveredTerminalOptions = dedupeOptions(terminals)
  } catch {
    // Tool discovery failed — keep whatever was previously discovered
  }
  DeviceEventEmitter.emit(PREFERENCES_CHANGED_EVENT)
}

export const initializeToolOptions = async () => {
  if (discoveredEditorOptions.length || discoveredTerminalOptions.length) {
    return
  }

  await reloadToolOptions()
}

export const getEditorOptions = (customEditors: CustomTool[] = []): ToolOption[] => {
  const custom = customEditors.map((item) => ({
    label: item.name,
    command: item.command,
    slug: generateSlug(item.name),
    iconName: 'code-slash-outline' as const,
    iconPath: item.iconPath ?? null,
  }))
  return dedupeOptions([...discoveredEditorOptions, ...custom])
}

export const getTerminalOptions = (customTerminals: CustomTool[] = []): ToolOption[] => {
  const custom = customTerminals.map((item) => ({
    label: item.name,
    command: item.command,
    slug: generateSlug(item.name),
    iconName: 'terminal-outline' as const,
    iconPath: item.iconPath ?? null,
  }))
  return dedupeOptions([...discoveredTerminalOptions, ...custom])
}

const dedupeOptions = (options: ToolOption[]) => {
  const map = new Map<string, ToolOption>()
  options.forEach((option) => map.set(option.command, option))
  return [...map.values()]
}
