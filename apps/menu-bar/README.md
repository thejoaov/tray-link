# Tray Link Menu bar

## Installation instructions

- Install with Homebrew (macOS):

  ```bash
  brew tap thejoaov/tray-link
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
