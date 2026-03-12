# Tray Link Menu bar

## Installation instructions

- Install with Homebrew (macOS):

  ```bash
  brew tap thejoaov/tap
  brew install --cask tray-link
  ```

- Or download the latest release from [tray-link/releases](https://github.com/thejoaov/tray-link/releases)
- Unzip the file and drag Tray Link to the Applications folder.

## How to run locally

At the root of the repo run:

```bash
bun install
```

Then inside `apps/cli` run the following command to generate the standalone executable used by the `menu-bar`:

```bash
bun archive
```

Inside `apps/menu-bar` run the following command to update the local cli file:

```bash
bun update-cli
```

Finally, run the following command to start the app:

```bash
bun macos
```

## Updater architecture

The native macOS build is the primary target for the in-app updater.

- Release metadata is resolved from `https://api.github.com/repos/thejoaov/tray-link/releases/latest`
- The app compares the bundled version against the latest GitHub release tag
- The updater selects the macOS `.zip` asset, downloads it, extracts the `.app`, and prepares a privileged replacement into `/Applications`
- After the replacement is scheduled, Tray Link exits and the updated app relaunches

### Important constraints

- Homebrew remains the canonical update path for Homebrew-managed installs
- The in-app updater is intended for native macOS app installs outside Homebrew ownership
- GitHub Releases remain the source of release notes and downloadable assets
- Because the app is not signed/notarized yet, Gatekeeper/quarantine can still affect first launch behavior after installation
