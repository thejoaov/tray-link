import { CustomTool } from '@tray-link/common-types'
import { editorList, generateSlug, terminalList } from '@tray-link/tray-shared'
import { Command } from 'commander'
import { preferencesStore, projectStore } from '../storage'

function resolveToolSlug(
  command: string | null | undefined,
  list: Array<{ name: string; command: string | null }>,
  customTools: CustomTool[],
): string {
  if (!command) {
    return 'global'
  }

  const builtIn = list.find((item) => item.command === command)
  if (builtIn) {
    return generateSlug(builtIn.name)
  }

  const custom = customTools.find((item) => item.command === command)
  if (custom) {
    return generateSlug(custom.name)
  }

  return command
}

export default new Command('list').description('List all projects registered in Tray Link').action(async () => {
  const projects = await projectStore.getProjects()
  const preferences = preferencesStore.getPreferences()

  if (projects.length === 0) {
    console.log('No projects registered.')
    return
  }

  console.table(
    projects.map((project) => ({
      Name: project.name,
      Path: project.path,
      Favorite: project.isFavorite ? 'Yes' : 'No',
      Editor: project.defaultEditor
        ? `${resolveToolSlug(project.defaultEditor, editorList, preferences.customEditors)} *`
        : 'global',
      Terminal: project.defaultTerminal
        ? `${resolveToolSlug(project.defaultTerminal, terminalList, preferences.customTerminals)} *`
        : 'global',
    })),
  )
})
