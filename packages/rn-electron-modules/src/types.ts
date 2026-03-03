export type ElectronModule = {
  name: string
  [key: string]:
    | number
    | string
    | boolean
    // biome-ignore lint/suspicious/noExplicitAny: Any is necessary for dynamic function types
    | ((...args: any[]) => Promise<unknown> | unknown)
    | { [key: string]: number | string | boolean }
}

export type Registry = ElectronModule[]

export type IpcMainModules = {
  [moduleName: string]: { functions: string[]; values: string[] }
}
