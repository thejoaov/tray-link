const Platform = {
  get: (): NodeJS.Platform => {
    return process.platform
  },
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  select: <T = any>(options: Partial<Record<NodeJS.Platform, T>>): T => {
    return options[process.platform]
  },
  OS: process.platform,
}

export default Platform
