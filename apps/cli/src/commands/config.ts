import { cancel, intro, isCancel, outro, select } from '@clack/prompts'
import { editorList, generateSlug, getEditorList, getTerminalList, terminalList } from '@tray-link/tray-shared'
import { Command } from 'commander'
import { preferencesStore } from '../storage'

type ToolType = 'editor' | 'terminal'

/** Returns all known entries (static list) with name, slug, and command. */
function getAllEntries(type: ToolType) {
  const list = type === 'editor' ? editorList : terminalList
  return list
    .filter((item) => item.command !== null)
    .map((item) => ({
      name: item.name,
      slug: generateSlug(item.name),
      command: item.command as string,
    }))
}

/** Looks up a command string by slug from the static list. */
function findCommandBySlug(type: ToolType, slug: string): string | null {
  const entries = getAllEntries(type)
  const match = entries.find((e) => e.slug === slug)
  return match?.command ?? null
}

// ─── list subcommand ───────────────────────────────────────────────────────────

const listCommand = new Command('list')
  .description('List known editors or terminals')
  .argument('<type>', 'What to list: editor | terminal')
  .option('--detected', 'Only show installed/detected tools')
  .action(async (type: string, options: { detected?: boolean }) => {
    if (type !== 'editor' && type !== 'terminal') {
      console.error(`Error: type must be "editor" or "terminal", got "${type}"`)
      process.exit(1)
    }

    const toolType = type as ToolType
    const prefs = preferencesStore.getPreferences()
    const currentCommand = toolType === 'editor' ? prefs.defaultEditor : prefs.defaultTerminal

    let entries: Array<{ name: string; slug: string; command: string }>

    if (options.detected) {
      const detected = toolType === 'editor' ? await getEditorList() : await getTerminalList()
      entries = detected.map((item) => ({
        name: item.name,
        slug: item.slug,
        command: item.command,
      }))
    } else {
      entries = getAllEntries(toolType)
    }

    if (entries.length === 0) {
      console.log(options.detected ? 'No installed tools detected.' : 'No tools found.')
      return
    }

    const rows = entries.map((entry) => ({
      Name: `${entry.command === currentCommand ? '* ' : '  '}${entry.name}`,
      Slug: entry.slug,
      Command: entry.command,
    }))

    console.table(rows)
  })

// ─── set subcommand ────────────────────────────────────────────────────────────

const setCommand = new Command('set')
  .description('Set the default editor or terminal')
  .argument('<type>', 'What to configure: editor | terminal')
  .argument('[slug]', 'Slug of the tool to set as default')
  .option('-i, --interactive', 'Choose interactively')
  .action(async (type: string, slugArg: string | undefined, options: { interactive?: boolean }) => {
    if (type !== 'editor' && type !== 'terminal') {
      console.error(`Error: type must be "editor" or "terminal", got "${type}"`)
      process.exit(1)
    }

    const toolType = type as ToolType

    if (options.interactive || !slugArg) {
      // Interactive mode: detect installed tools and present a selection
      intro(`Set default ${toolType}`)

      const detected = toolType === 'editor' ? await getEditorList() : await getTerminalList()

      if (detected.length === 0) {
        cancel(`No installed ${toolType}s detected. Install one before running this command.`)
        process.exit(1)
      }

      const prefs = preferencesStore.getPreferences()
      const currentCommand = toolType === 'editor' ? prefs.defaultEditor : prefs.defaultTerminal

      const chosen = await select({
        message: `Choose a default ${toolType}:`,
        options: detected.map((item) => ({
          value: item.command,
          label: item.name,
          hint: item.command === currentCommand ? 'current default' : undefined,
        })),
      })

      if (isCancel(chosen)) {
        cancel('Cancelled.')
        process.exit(0)
      }

      if (toolType === 'editor') {
        preferencesStore.setDefaultEditor(chosen as string)
      } else {
        preferencesStore.setDefaultTerminal(chosen as string)
      }

      outro(`Default ${toolType} set to "${chosen}"`)
      return
    }

    // Non-interactive: look up by slug
    const command = findCommandBySlug(toolType, slugArg)

    if (!command) {
      console.error(`Error: no ${toolType} found with slug "${slugArg}"`)
      console.error(`Run "tlink config list ${type}" to see available slugs.`)
      process.exit(1)
    }

    if (toolType === 'editor') {
      preferencesStore.setDefaultEditor(command)
    } else {
      preferencesStore.setDefaultTerminal(command)
    }

    const allEntries = getAllEntries(toolType)
    const entry = allEntries.find((e) => e.slug === slugArg)!
    console.log(`Default ${toolType} set to "${entry.name}" (${command})`)
  })

// ─── config command ────────────────────────────────────────────────────────────

export default new Command('config')
  .description('Manage Tray Link configuration (default editor, terminal, etc.)')
  .addCommand(listCommand)
  .addCommand(setCommand)
