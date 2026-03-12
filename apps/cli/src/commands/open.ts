import { CustomTool } from '@tray-link/common-types'
import { editorList, generateSlug, terminalList } from '@tray-link/tray-shared'
import { Command } from 'commander'
import { openInEditor, openInTerminal } from '../shell'
import { preferencesStore, projectStore } from '../storage'

function commandFromSlug(
  list: Array<{ name: string; command: string | null }>,
  slug: string,
  customTools: CustomTool[] = [],
): string | null {
  for (const item of list) {
    if (item.command && generateSlug(item.name) === slug) {
      return item.command
    }
  }

  for (const item of customTools) {
    if (generateSlug(item.name) === slug) {
      return item.command
    }
  }

  return null
}

export default new Command('open')
  .description('Open a project in the configured editor and/or terminal')
  .argument('<project>', 'Project name or ID')
  .option('-e, --editor [slug]', 'Open in editor. Optionally specify a slug (e.g. cursor). Omit slug to use default.')
  .option(
    '-t, --terminal [slug]',
    'Open in terminal. Optionally specify a slug (e.g. iterm). Omit slug to use default.',
  )
  .action(async (projectArg: string, options: { editor?: boolean | string; terminal?: boolean | string }) => {
    const projects = await projectStore.getProjects()
    const project =
      projects.find((p) => p.id === projectArg) ||
      projects.find((p) => p.name.toLowerCase() === projectArg.toLowerCase())

    if (!project) {
      console.error(`Error: no project found matching "${projectArg}"`)
      console.error('Run "tlink list" to see available projects.')
      process.exit(1)
    }

    const prefs = preferencesStore.getPreferences()
    const openEditorFlag = options.editor !== undefined
    const openTerminalFlag = options.terminal !== undefined
    const openBoth = !openEditorFlag && !openTerminalFlag

    const editorErrors: string[] = []
    const terminalErrors: string[] = []

    if (openBoth || openEditorFlag) {
      let editorCommand: string | null = null

      if (typeof options.editor === 'string') {
        editorCommand = commandFromSlug(editorList, options.editor, prefs.customEditors)
        if (!editorCommand) {
          console.error(`Error: no editor found with slug "${options.editor}"`)
          console.error('Run "tlink config list editor" to see available slugs.')
          process.exit(1)
        }
      } else {
        editorCommand = project.defaultEditor ?? prefs.defaultEditor ?? 'code'
      }

      try {
        await openInEditor(project.path, editorCommand)
        console.log(`Opened "${project.name}" in editor (${editorCommand})`)
      } catch (err) {
        editorErrors.push(`Editor error: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    if (openBoth || openTerminalFlag) {
      let terminalCommand: string | null = null

      if (typeof options.terminal === 'string') {
        terminalCommand = commandFromSlug(terminalList, options.terminal, prefs.customTerminals)
        if (!terminalCommand) {
          console.error(`Error: no terminal found with slug "${options.terminal}"`)
          console.error('Run "tlink config list terminal" to see available slugs.')
          process.exit(1)
        }
      } else {
        terminalCommand =
          project.defaultTerminal ??
          prefs.defaultTerminal ??
          (process.platform === 'darwin'
            ? 'open -a Terminal'
            : process.platform === 'win32'
              ? 'cmd.exe'
              : 'gnome-terminal')
      }

      try {
        await openInTerminal(project.path, terminalCommand)
        console.log(`Opened "${project.name}" in terminal (${terminalCommand})`)
      } catch (err) {
        terminalErrors.push(`Terminal error: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    if (editorErrors.length || terminalErrors.length) {
      for (const error of [...editorErrors, ...terminalErrors]) {
        console.error(error)
      }
      process.exit(1)
    }
  })
