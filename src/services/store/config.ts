import { ProjectSchema, SettingsSchema } from './schema.js'

import { app } from 'electron'
import Store from 'electron-store'
import SettingsItem from '../../models/SettingsItem.js'

const store = new Store<{
  projects: ProjectSchema[]
  settings: SettingsSchema
}>({
  defaults: {
    projects: [],
    settings: {
      locale: app.getLocale(),
      editorList: [],
      terminalList: [],
      aditionalCommands: [],
      defaultEditor: {} as SettingsItem,
      defaultTerminal: {} as SettingsItem,
    },
  },
  schema: {
    settings: {
      type: 'object',
      properties: {
        aditionalCommands: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              command: {
                type: 'string',
              },
            },
          },
        },
        editorList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              path: {
                type: 'string',
              },
              command: {
                type: 'string',
              },
            },
          },
        },
        terminalList: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              path: {
                type: 'string',
              },
              command: {
                type: 'string',
              },
            },
          },
        },
        locale: {
          type: 'string',
        },
        defaultEditor: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            path: {
              type: 'string',
            },
            command: {
              type: 'string',
            },
          },
        },
        defaultTerminal: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
            },
            path: {
              type: 'string',
            },
            command: {
              type: 'string',
            },
          },
        },
      },
    },
    projects: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          path: {
            type: 'string',
          },
          position: {
            type: 'number',
          },
          isFavorite: {
            type: 'boolean',
          },
          // color: {
          //   type: "string",
          // },
        },
      },
    },
  },
})

export default store
