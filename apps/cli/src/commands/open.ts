import { CustomTool } from '@tray-link/common-types'
import { aiToolList, editorList, generateSlug, terminalList } from '@tray-link/tray-shared'
import { Command } from 'commander'
import { openInEditor, openInTerminal, openInTerminalWithCommand } from '../shell'
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
  .option(
    '-a, --ai [slug]',
    'Open in AI agent CLI. Optionally specify a slug (e.g. claude-code). Omit slug to use default.',
  )
  .action(
    async (
      projectArg: string,
      options: { editor?: boolean | string; terminal?: boolean | string; ai?: boolean | string },
    ) => {
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
      const openAiFlag = options.ai !== undefined
      const openBoth = !openEditorFlag && !openTerminalFlag && !openAiFlag

      const editorErrors: string[] = []
      const terminalErrors: string[] = []
      const aiToolErrors: string[] = []
      let lastOpenedTool: { type: 'editor' | 'terminal' | 'aiTool'; command: string } | null = null

      const resolveDefaultTerminalCommand = (): string => {
        return (
          project.defaultTerminal ??
          prefs.defaultTerminal ??
          (process.platform === 'darwin'
            ? 'open -a Terminal'
            : process.platform === 'win32'
              ? 'cmd.exe'
              : 'gnome-terminal')
        )
      }

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
          lastOpenedTool = { type: 'editor', command: editorCommand }
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
          terminalCommand = resolveDefaultTerminalCommand()
        }

        try {
          await openInTerminal(project.path, terminalCommand)
          console.log(`Opened "${project.name}" in terminal (${terminalCommand})`)
          lastOpenedTool = { type: 'terminal', command: terminalCommand }
        } catch (err) {
          terminalErrors.push(`Terminal error: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      if (openAiFlag) {
        let aiToolCommand: string | null = null

        if (typeof options.ai === 'string') {
          aiToolCommand = commandFromSlug(aiToolList, options.ai, prefs.customAiTools ?? [])
          if (!aiToolCommand) {
            console.error(`Error: no AI tool found with slug "${options.ai}"`)
            console.error('Run "tlink config list ai" to see available slugs.')
            process.exit(1)
          }
        } else {
          aiToolCommand = project.defaultAiTool ?? prefs.defaultAiTool ?? null
          if (!aiToolCommand) {
            console.error('Error: no default AI tool configured.')
            console.error('Set a default AI tool in Tray Link settings or pass a slug with --ai <slug>.')
            process.exit(1)
          }
        }

        const terminalCommand = resolveDefaultTerminalCommand()

        try {
          await openInTerminalWithCommand(project.path, terminalCommand, aiToolCommand)
          console.log(`Opened "${project.name}" in AI tool (${aiToolCommand}) via ${terminalCommand}`)
          lastOpenedTool = { type: 'aiTool', command: aiToolCommand }
        } catch (err) {
          aiToolErrors.push(`AI tool error: ${err instanceof Error ? err.message : String(err)}`)
        }
      }

      if (editorErrors.length || terminalErrors.length || aiToolErrors.length) {
        for (const error of [...editorErrors, ...terminalErrors, ...aiToolErrors]) {
          console.error(error)
        }
        process.exit(1)
      }

      if (lastOpenedTool) {
        await projectStore.updateProject({
          ...project,
          lastOpenedAt: new Date().toISOString(),
          lastOpenedTool,
          updatedAt: new Date().toISOString(),
        })
      }
    },
  )
