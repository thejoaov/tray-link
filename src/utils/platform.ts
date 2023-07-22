const Platform = {
  get: (): NodeJS.Platform => {
    return process.platform
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  select: <T = any>(options: Partial<Record<NodeJS.Platform, T>>): T => {
    return options[process.platform]
  },
  OS: process.platform,
}

export default Platform
