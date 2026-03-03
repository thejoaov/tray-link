import { MakerDeb } from '@electron-forge/maker-deb'
import { MakerDebConfigOptions } from '@electron-forge/maker-deb/dist/Config'
import { MakerRpm } from '@electron-forge/maker-rpm'
import { MakerRpmConfigOptions } from '@electron-forge/maker-rpm/dist/Config'
import { MakerSquirrel } from '@electron-forge/maker-squirrel'
import { MakerZIP } from '@electron-forge/maker-zip'
import { VitePlugin } from '@electron-forge/plugin-vite'
import type { ForgeConfig } from '@electron-forge/shared-types'
import { spawn } from 'child_process'
import path from 'path'

type CommonParams<T, U> = {
  [K in keyof T & keyof U]?: T[K] extends U[K] ? T[K] : never
}

type LinuxOptions = CommonParams<MakerDebConfigOptions, MakerRpmConfigOptions>

const linuxOptions: LinuxOptions = {
  name: 'tray-link',
  bin: 'tray-link',
  mimeType: ['x-scheme-handler/tray-link'],
  icon: `./assets/images/icon-linux.png`,
  categories: ['Utility'],
  productName: 'Tray Link',
  genericName: 'tlink',
  homepage: 'https://github.com/thejoaov/tray-link',
}

const config: ForgeConfig = {
  packagerConfig: {
    icon: './assets/images/icon-windows',
    executableName: 'tray-link',
    name: 'Tray Link',
    extraResource: './assets',
  },
  rebuildConfig: {},
  hooks: {
    generateAssets: async () => {
      // Is running electron forge make command
      if (process.argv.some((a) => a.includes('electron-forge-make'))) {
        console.log('Running custom pre-make command: bun run export:web')

        const parentDir = path.resolve(__dirname, '..') // Get the parent directory
        return new Promise((resolve, reject) => {
          const command = 'bun'
          const child = spawn(command, ['run', 'export:web'], {
            shell: process.platform === 'win32' ? true : undefined,
            stdio: 'inherit',
            cwd: parentDir, // Set the working directory to the parent directory
          })

          child.on('close', (code) => {
            if (code === 0) {
              resolve()
            } else {
              reject(new Error(`preMake hook failed with exit code ${code}`))
            }
          })
        })
      }
    },
  },
  makers: [
    new MakerSquirrel({
      name: 'TrayLink',
      authors: 'thejoaov',
      description: 'An app to manage your projects from the system tray',
    }),
    new MakerZIP({}, ['darwin']),
    new MakerRpm({
      options: {
        ...linuxOptions,
        license: 'MIT',
      },
    }),
    new MakerDeb({
      options: {
        ...linuxOptions,
        maintainer: 'thejoaov',
      },
    }),
  ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: './src/main.ts',
          config: 'vite.main.config.mts',
        },
        {
          entry: './src/preload.ts',
          config: 'vite.preload.config.ts',
        },
        {
          entry: '../../cli/src/index.ts',
          config: 'vite.cli.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        },
      ],
    }),
  ],
}

export default config
