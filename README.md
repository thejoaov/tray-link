<h1 align="center">VSTray</h1>
<div align="center">

<br>
  <img src="build/icon.png" alt="my-projects-tray" width="90">
<br>
<br>

Based on <i><a href="https://github.com/Rocketseat/youtube-challenge-electron-tray"> youtube challenge electron tray </a></i> by <a href="https://github.com/rocketseat"> Rocketseat</a>

</div>

<p align="center">System tray application to provide a shortcut for your projects on vscode and github-desktop</p>

<p align="center">
  <a href="https://github.com/Rocketseat/youtube-challenge-electron-tray/graphs/contributors">
    <img src="https://img.shields.io/github/contributors/thejoaov/vs-tray?color=" alt="Contributors">
  </a>
  <a href="https://github.com/thejoaov/vs-tray/releases">
    <img alt="GitHub release (latest by date including pre-releases)" src="https://img.shields.io/github/v/release/thejoaov/vs-tray?include_prereleases&label=latest">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/github/license/thejoaov/vs-tray?logo=mit" alt="License">
  </a>

</p>
<hr>

## Features
- Open the project's folder;
- You can open your project directly on VS Code!
- Open your projects directly to your favorite terminal!
  - Terminal.app for MacOS, Gnome-Terminal for linux distros, Or CMD for Windows.
  - HyperJS terminal (*requires Hyper commands installed in your PATH*).
- Open the project directly in the Github Desktop application (Works on MacOS and Windows, *requires Github Commands installed on PATH*)
- Remove your project's from the application;
- Get to the releases tab, for checking updates!
- Translations to Spanish :es:, English :us:, and of course Brazilian Portuguese :beginner:!

## Dependencies

- :green_heart: [Node.js](https://nodejs.org/en/) >= 8.0.0
- :blue_heart: [Yarn](https://yarnpkg.com/pt-BR/docs/install)
- :electron: **Electron** — Desktop apps with JavaScript, HTML, and CSS
- :vertical_traffic_light: **Sentry** — Cross platform application monitoring
- :warning: **Lint** — ESlint, Prettier and EditorConfig

## Download and installation

Downloads are under Releases section, [check it out!](https://github.com/thejoaov/vs-tray/releases)

### Signing Disclaimer
All the download files are not signed yet, because i don't know how to sign them with electron in all OSes, so, you have to trust and install the application anyway. This is a free and open-source application, if you have any suspicion, just check the code :grin:

### Compatibilty
- Windows
  - 10 (tested)
  - Versions under windows 10 are not tested yet, but should work as well.
- Linux
  - Snap and Debian packages (I personally recommend using debian packages over snap, classic confinement it's sometimes buggy).
  - Ubuntu
    - 18.\+ (tested) - working
    - 16.\* (not tested yet)
    - Should work on any distro based on ubuntu too.
  - Another distros not tested, but there is a rpm package in releases. Should work on all distros with app indicators.
- MacOS
  - DMG package.

---

## Getting started

1. Clone this repository;
2. `cd vs-tray`;
3. Run `yarn` to install dependencies.
4. Run `yarn start`.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
