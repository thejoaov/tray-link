import { cancel, intro, isCancel, outro, select } from '@clack/prompts'
import { Project } from '@tray-link/common-types'
import { editorList, generateSlug, getEditorList, getTerminalList, terminalList } from '@tray-link/tray-shared'
import { Command } from 'commander'
import { preferencesStore, projectStore } from '../storage'

type ToolType = 'editor' | 'terminal'

type ToolEntry = {
  name: string
  slug: string
  command: string
}

/** Returns all known entries (static list + custom tools) with name, slug, and command. */
function getAllEntries(type: ToolType): ToolEntry[] {
  const preferences = preferencesStore.getPreferences()
  const builtInList = type === 'editor' ? editorList : terminalList
  const builtInEntries = builtInList
    .filter((item) => item.command !== null)
    .map((item) => ({
      name: item.name,
      slug: generateSlug(item.name),
      command: item.command as string,
    }))

  const customEntries = (type === 'editor' ? preferences.customEditors : preferences.customTerminals).map((item) => ({
    name: item.name,
    slug: generateSlug(item.name),
    command: item.command,
  }))

  return [...new Map([...builtInEntries, ...customEntries].map((entry) => [entry.command, entry])).values()]
}

/** Looks up a command string by slug from the known list. */
function findCommandBySlug(type: ToolType, slug: string): string | null {
  const entries = getAllEntries(type)
  const match = entries.find((entry) => entry.slug === slug)
  return match?.command ?? null
}

function resolveProject(projects: Project[], projectArg: string): Project | null {
  return (
    projects.find((project) => project.id === projectArg) ||
    projects.find((project) => project.name.toLowerCase() === projectArg.toLowerCase()) ||
    null
  )
}

function getGlobalCommand(type: ToolType): string | null {
  const preferences = preferencesStore.getPreferences()
  return type === 'editor' ? preferences.defaultEditor : preferences.defaultTerminal
}

function getProjectCommand(project: Project, type: ToolType): string | null {
  return type === 'editor' ? (project.defaultEditor ?? null) : (project.defaultTerminal ?? null)
}

function getEffectiveCommand(type: ToolType, project: Project | null): string | null {
  if (!project) {
    return getGlobalCommand(type)
  }

  return getProjectCommand(project, type) ?? getGlobalCommand(type)
}

async function updateProjectCommand(project: Project, type: ToolType, command: string | null): Promise<void> {
  await projectStore.updateProject({
    ...project,
    updatedAt: new Date().toISOString(),
    ...(type === 'editor' ? { defaultEditor: command } : { defaultTerminal: command }),
  })
}

const listCommand = new Command('list')
  .description('List known editors or terminals')
  .argument('<type>', 'What to list: editor | terminal')
  .option('--detected', 'Only show installed/detected tools')
  .option('-p, --project <project>', 'Show defaults in the context of a specific project')
  .action(async (type: string, options: { detected?: boolean; project?: string }) => {
    if (type !== 'editor' && type !== 'terminal') {
      console.error(`Error: type must be "editor" or "terminal", got "${type}"`)
      process.exit(1)
    }

    const toolType = type as ToolType
    let project: Project | null = null

    if (options.project) {
      const projects = await projectStore.getProjects()
      project = resolveProject(projects, options.project)
      if (!project) {
        console.error(`Error: no project found matching "${options.project}"`)
        console.error('Run "tlink list" to see available projects.')
        process.exit(1)
      }
    }

    const currentCommand = getEffectiveCommand(toolType, project)
    const currentSource = project && getProjectCommand(project, toolType) ? 'project' : 'global'

    let entries = getAllEntries(toolType)

    if (options.detected) {
      const detected = toolType === 'editor' ? await getEditorList() : await getTerminalList()
      entries = detected.map((item) => ({
        name: item.name,
        slug: item.slug,
        command: item.command,
      }))
    }

    if (entries.length === 0) {
      console.log(options.detected ? 'No installed tools detected.' : 'No tools found.')
      return
    }

    const rows = entries.map((entry) => ({
      Name: `${entry.command === currentCommand ? '* ' : '  '}${entry.name}`,
      Slug: entry.slug,
      Command: entry.command,
      ...(project ? { Source: entry.command === currentCommand ? currentSource : '' } : {}),
    }))

    console.table(rows)
  })

const setCommand = new Command('set')
  .description('Set the default editor or terminal')
  .argument('<type>', 'What to configure: editor | terminal')
  .argument('[slug]', 'Slug of the tool to set as default')
  .option('-i, --interactive', 'Choose interactively')
  .option('-p, --project <project>', 'Set the default for a specific project')
  .option('--clear', 'Clear the current default in the selected scope')
  .action(
    async (
      type: string,
      slugArg: string | undefined,
      options: { interactive?: boolean; project?: string; clear?: boolean },
    ) => {
      if (type !== 'editor' && type !== 'terminal') {
        console.error(`Error: type must be "editor" or "terminal", got "${type}"`)
        process.exit(1)
      }

      const toolType = type as ToolType
      let project: Project | null = null

      if (options.project) {
        const projects = await projectStore.getProjects()
        project = resolveProject(projects, options.project)
        if (!project) {
          console.error(`Error: no project found matching "${options.project}"`)
          console.error('Run "tlink list" to see available projects.')
          process.exit(1)
        }
      }

      if (options.clear) {
        if (project) {
          await updateProjectCommand(project, toolType, null)
          console.log(`Cleared project default ${toolType} for "${project.name}"`)
          return
        }

        if (toolType === 'editor') {
          preferencesStore.setDefaultEditor(null)
        } else {
          preferencesStore.setDefaultTerminal(null)
        }

        console.log(`Cleared global default ${toolType}`)
        return
      }

      if (options.interactive || !slugArg) {
        intro(project ? `Set project default ${toolType}` : `Set default ${toolType}`)

        const entries = getAllEntries(toolType)

        if (entries.length === 0) {
          cancel(`No ${toolType}s are available. Configure one before running this command.`)
          process.exit(1)
        }

        const currentCommand = getEffectiveCommand(toolType, project)
        const projectCommand = project ? getProjectCommand(project, toolType) : null

        const chosen = await select({
          message: project ? `Choose a default ${toolType} for "${project.name}":` : `Choose a default ${toolType}:`,
          options: entries.map((entry) => ({
            value: entry.command,
            label: entry.name,
            hint:
              entry.command === currentCommand
                ? projectCommand === entry.command
                  ? 'current project default'
                  : 'current default'
                : undefined,
          })),
        })

        if (isCancel(chosen)) {
          cancel('Cancelled.')
          process.exit(0)
        }

        if (project) {
          await updateProjectCommand(project, toolType, chosen as string)
        } else if (toolType === 'editor') {
          preferencesStore.setDefaultEditor(chosen as string)
        } else {
          preferencesStore.setDefaultTerminal(chosen as string)
        }

        outro(project ? `Project default ${toolType} set to "${chosen}"` : `Default ${toolType} set to "${chosen}"`)
        return
      }

      const command = findCommandBySlug(toolType, slugArg)

      if (!command) {
        console.error(`Error: no ${toolType} found with slug "${slugArg}"`)
        console.error(`Run "tlink config list ${type}" to see available slugs.`)
        process.exit(1)
      }

      if (project) {
        await updateProjectCommand(project, toolType, command)
      } else if (toolType === 'editor') {
        preferencesStore.setDefaultEditor(command)
      } else {
        preferencesStore.setDefaultTerminal(command)
      }

      const allEntries = getAllEntries(toolType)
      const entry = allEntries.find((item) => item.slug === slugArg)

      if (!entry) {
        console.error(`Error: no ${toolType} found with slug "${slugArg}"`)
        process.exit(1)
      }

      console.log(
        project
          ? `Project default ${toolType} for "${project.name}" set to "${entry.name}" (${command})`
          : `Default ${toolType} set to "${entry.name}" (${command})`,
      )
    },
  )

export default new Command('config')
  .description('Manage Tray Link configuration (default editor, terminal, etc.)')
  .addCommand(listCommand)
  .addCommand(setCommand)
