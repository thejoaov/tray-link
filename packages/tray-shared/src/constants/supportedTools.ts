import supportedToolCatalogJson from './supported-tool-catalog.json'

export type ToolCatalogPlatform = 'darwin' | 'linux' | 'win32'

export type SupportedToolDefinition = {
  name: string
  command: string | null
  binary: string | null
  enableBinaryCheck: boolean
  enableCommonPathCheck: boolean
  commonFilepaths: string[]
  iconBasenames: string[]
  alwaysAvailable: boolean
}

export type SupportedToolCatalog = {
  editors: Record<ToolCatalogPlatform, SupportedToolDefinition[]>
  terminals: Record<ToolCatalogPlatform, SupportedToolDefinition[]>
  aiTools: Record<ToolCatalogPlatform, SupportedToolDefinition[]>
}

const supportedToolCatalog = supportedToolCatalogJson as SupportedToolCatalog

const platformOrder: ToolCatalogPlatform[] = ['darwin', 'linux', 'win32']

export const getSupportedToolCatalog = (): SupportedToolCatalog => supportedToolCatalog

export const getSupportedToolCatalogJson = (): string => JSON.stringify(supportedToolCatalog)

export const isToolCatalogPlatform = (value: string): value is ToolCatalogPlatform => {
  return platformOrder.includes(value as ToolCatalogPlatform)
}

export const getSupportedToolDefinitions = (
  type: keyof SupportedToolCatalog,
  platform: ToolCatalogPlatform,
): SupportedToolDefinition[] => {
  return supportedToolCatalog[type][platform] ?? []
}
