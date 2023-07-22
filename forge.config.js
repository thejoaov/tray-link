/* eslint-disable @typescript-eslint/no-var-requires */
const execa = require('execa')

/** @type {import('@electron-forge/shared-types').ForgeConfig} */
module.exports = {
  packagerConfig: {
    asar: true,
    icon: './assets/icon',
    name: 'Tray Link',
    executableName: 'tray-link',
    appBundleId: 'com.thejoaov.traylink',
    appCategoryType: 'public.app-category.utilities',
    extraResource: ['./assets'],
  },
  hooks: {
    prePackage: async () => {
      await execa.command('npm run build')
    },
  },
  rebuildConfig: {},
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        draft: false,
        repository: {
          owner: 'thejoaov',
          name: 'tray-link',
        },
      },
    },
  ],
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        setupIcon: './assets/icon.ico',
      },
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
      config: {
        icon: './assets/icon.icns',
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './assets/icon.png',
        },
      },
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {
        options: {
          icon: './assets/icon.png',
        },
      },
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
}
