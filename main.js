const { resolve, basename } = require('path');
const { app, Menu, Tray, dialog, shell } = require('electron');

const { spawn } = require('child_process');
const fixPath = require('fix-path');
const fs = require('fs');

const Store = require('electron-store');
const Sentry = require('@sentry/electron');
const { version, repository } = require('./package.json');

fixPath();

Sentry.init({
  dsn: 'https://adb27f3050df422f8828186222db76ab@sentry.io/1784496',
});

const schema = {
  projects: {
    type: 'string',
  },
};

let mainTray = {};

if (app.dock) {
  app.dock.hide();
}

const store = new Store({ schema });

function getLocale() {
  const locale = app.getLocale();

  switch (locale) {
    case 'es-419' || 'es':
      return JSON.parse(fs.readFileSync(resolve(__dirname, 'locale/es.json')));
    case 'pt-BR' || 'pt-PT':
      return JSON.parse(fs.readFileSync(resolve(__dirname, 'locale/pt.json')));
    default:
      return JSON.parse(fs.readFileSync(resolve(__dirname, 'locale/en.json')));
  }
}

function render(tray = mainTray) {
  const storedProjects = store.get('projects');
  const projects = storedProjects ? JSON.parse(storedProjects) : [];
  const locale = getLocale();

  const items = projects.map(({ name, path }) => ({
    label: name,
    submenu: [
      {
        label: locale.openCode,
        click: () => {
          spawn('code', [path], { shell: true });
        },
      },

      {
        label: locale.openGithub,
        click: () => {
          spawn(
            process.platform === 'linux' ? 'github-desktop' : 'github',
            [path],
            { shell: true }
          );
        },
      },
      {
        type: 'separator',
      },
      process.platform === 'linux' && {
        label: locale.openTerminal,
        click: () => {
          spawn('gnome-terminal', { cwd: path, shell: true });
        },
      },
      {
        label: locale.openFolder,
        click: () => {
          spawn(shell.openItem(path));
        },
      },
      {
        type: 'separator',
      },
      {
        label: locale.remove,
        click: () => {
          store.set(
            'projects',
            JSON.stringify(projects.filter(item => item.path !== path))
          );
          render();
        },
      },
    ],
  }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: locale.addProject,
      click: () => {
        const result = dialog.showOpenDialog({ properties: ['openDirectory'] });

        if (!result) return;

        const [path] = result;
        const name = basename(path);

        store.set(
          'projects',
          JSON.stringify([
            ...projects,
            {
              path,
              name,
            },
          ])
        );

        render();
      },
    },
    {
      type: 'separator',
    },
    ...items,
    {
      type: 'separator',
    },
    {
      type: 'normal',
      label: locale.checkUpdate,
      enabled: true,
      click: () => shell.openExternal(repository),
    },
    {
      type: 'normal',
      label: `${locale.version}: ${version}`,
      enabled: false,
    },
    {
      type: 'separator',
    },
    {
      type: 'normal',
      label: locale.close,
      role: 'quit',
      enabled: true,
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', tray.popUpContextMenu);
}

app.on('ready', () => {
  mainTray = new Tray(String(resolve(__dirname, 'assets', 'icon.png')));

  render(mainTray);
});
