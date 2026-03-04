import { editorList, generateSlug, terminalList } from '@tray-link/tray-shared'
import { Command } from 'commander'
import { openInEditor, openInTerminal } from '../shell'
import { preferencesStore, projectStore } from '../storage'

/** Returns a command string for the given slug (or null if not found). */
function commandFromSlug(list: typeof editorList, slug: string): string | null {
  for (const item of list) {
    if (item.command && generateSlug(item.name) === slug) {
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
    // ── Resolve project ────────────────────────────────────────────────────
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

    // ── Determine what to open ─────────────────────────────────────────────
    // When neither -e nor -t is passed, open both.
    const openEditorFlag = options.editor !== undefined
    const openTerminalFlag = options.terminal !== undefined
    const openBoth = !openEditorFlag && !openTerminalFlag

    let editorErrors: string[] = []
    let terminalErrors: string[] = []

    // ── Open in editor ─────────────────────────────────────────────────────
    if (openBoth || openEditorFlag) {
      let editorCommand: string | null = null

      if (typeof options.editor === 'string') {
        // Specific editor requested by slug
        editorCommand = commandFromSlug(editorList, options.editor)
        if (!editorCommand) {
          console.error(`Error: no editor found with slug "${options.editor}"`)
          console.error('Run "tlink config list editor" to see available slugs.')
          process.exit(1)
        }
      } else {
        // Use default from preferences
        editorCommand = prefs.defaultEditor ?? 'code'
      }

      try {
        await openInEditor(project.path, editorCommand)
        console.log(`Opened "${project.name}" in editor (${editorCommand})`)
      } catch (err) {
        editorErrors.push(`Editor error: ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    // ── Open in terminal ───────────────────────────────────────────────────
    if (openBoth || openTerminalFlag) {
      let terminalCommand: string | null = null

      if (typeof options.terminal === 'string') {
        // Specific terminal requested by slug
        terminalCommand = commandFromSlug(terminalList, options.terminal)
        if (!terminalCommand) {
          console.error(`Error: no terminal found with slug "${options.terminal}"`)
          console.error('Run "tlink config list terminal" to see available slugs.')
          process.exit(1)
        }
      } else {
        // Use default from preferences
        terminalCommand =
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

    // ── Report errors ──────────────────────────────────────────────────────
    if (editorErrors.length || terminalErrors.length) {
      for (const e of [...editorErrors, ...terminalErrors]) {
        console.error(e)
      }
      process.exit(1)
    }
  })
