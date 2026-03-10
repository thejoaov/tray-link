import { defineConfig } from 'vite'

export default defineConfig(({ forgeConfigSelf }: { forgeConfigSelf: { name?: string } }) => {
  const name = forgeConfigSelf.name ?? 'main_window'

  return {
    root: './dist',
    base: './',
    build: {
      outDir: `../.vite/renderer/${name}`,
    },
  }
})
