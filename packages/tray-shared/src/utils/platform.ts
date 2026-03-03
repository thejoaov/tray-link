const Platform = {
  get: (): NodeJS.Platform => {
    return process.platform
  },
  select: <T>(options: Partial<Record<NodeJS.Platform, T>>): T | null => {
    const value = options[process.platform]
    if (value === undefined) {
      return null;
    }
    return value;
  },
  OS: process.platform,
}

export default Platform
