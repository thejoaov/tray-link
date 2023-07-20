import { app } from 'electron'
import Store from 'electron-store'
import { getTerminalList, getEditorList } from '../detections'

const store = new Store({
  defaults: {
    projects: [],
    settings: {
      locale: app.getLocale(),
    },
    editorList: getEditorList(),
    terminalList: getTerminalList(),
    aditionalCommands: [],
  },
  schema: {
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
    settings: {
      type: 'object',
      properties: {
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
