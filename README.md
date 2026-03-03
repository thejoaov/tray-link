<h1 align="center">Tray Link</h1>

<div align="center">
  <img src="assets/icon@3x.png" alt="Tray Link icon" width="90" />

  <p>System tray app to quickly open and manage your local projects.</p>

  <p>
    <a href="https://github.com/thejoaov/tray-link/graphs/contributors">
      <img src="https://img.shields.io/github/contributors/thejoaov/tray-link" alt="Contributors" />
    </a>
    <a href="https://github.com/thejoaov/tray-link/releases">
      <img src="https://img.shields.io/github/v/release/thejoaov/tray-link?include_prereleases&label=latest" alt="Latest release" />
    </a>
  </p>
</div>

## Overview

Tray Link helps you keep your favorite projects one click away from the menu bar/tray.

With it, you can:

- Open a project folder quickly
- Open projects directly in your preferred editor
- Open projects in your preferred terminal
- Open repositories in GitHub Desktop
- Use the app in Portuguese (Brazil), English, or Spanish

## Monorepo structure

- `apps/menu-bar`: Desktop app (React Native + Expo + Electron bridge)
- `apps/cli`: CLI used by Tray Link
- `packages/*`: Shared types and modules

## Tech stack

- Bun workspaces
- TurboRepo
- TypeScript
- Expo + React Native (macOS/Web)
- Electron tooling integration

## Requirements

- Node.js `>=20`
- Bun `1.x`

## Getting started

1. Clone this repository
2. Install dependencies:

   ```bash
   bun install
   ```

3. Start development mode from the monorepo root:

   ```bash
   bun run dev
   ```

## Useful scripts (root)

- `bun run dev`: Run all workspace dev pipelines
- `bun run build`: Build all workspaces
- `bun run lint`: Run Biome lint
- `bun run typecheck`: Run TypeScript checks across workspaces
- `bun run start:metro`: Start Expo Metro for the menu-bar app
- `bun run macos`: Build/run macOS target for the menu-bar app
- `bun run electron:dev`: Export web bundle and start Electron
- `bun run electron:package`: Package Electron app

## Download

Prebuilt binaries are available in [Releases](https://github.com/thejoaov/tray-link/releases).

### Install with Homebrew (macOS)

```bash
brew tap thejoaov/tray-link https://github.com/thejoaov/tray-link
brew install --cask tray-link
```

To update later:

```bash
brew upgrade --cask tray-link
```

### Homebrew maintainers

- Cask file: `Casks/tray-link.rb`
- Release sync workflow: `.github/workflows/homebrew-cask-sync.yml`
- This repository acts as its own Homebrew tap (`brew tap thejoaov/tray-link`)

## Signing disclaimer

This application is not signed yet. If you prefer, clone the repository and run/build it locally.

To force the signing on macOS, you can use the following command:

```bash
xattr -d com.apple.quarantine /Applications/Tray\ Link.app
```

## License and attribution

This project is heavily inspired by the excellent work of [Expo Orbit](https://github.com/expo/orbit).

This project is licensed under the MIT License. See [LICENSE.md](LICENSE.md).
