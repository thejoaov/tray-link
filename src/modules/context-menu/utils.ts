import { dialog, shell } from 'electron'
import Platform from '../../utils/platform'
import execa from 'execa'
import commandExists from 'command-exists'
import getTranslation from '../../i18n'
import SettingsItem from '../../models/SettingsItem'
import Project from '../../models/Project'
import { projectStore } from '../../services/store'

export async function moveTop(project: Project): Promise<void> {
  const allProjects = projectStore.getAll()

  projectStore.update(project.id, { position: 0 })

  const projectsData = allProjects.map((item) => ({
    ...item,
    position: item.id === project.id ? 0 : item.position + 1,
  }))

  projectStore.set(projectsData)
  projectStore.resetPosition()
}

export async function moveBottom(project: Project): Promise<void> {
  const allProjects = projectStore.getAll()

  const lastPosition = allProjects.length - 1

  projectStore.update(project.id, { position: lastPosition })

  const projectsData = allProjects.map((item) => ({
    ...item,
    position: item.id === project.id ? lastPosition : item.position - 1,
  }))

  projectStore.resetPosition()
  projectStore.set(projectsData)
}

export async function moveUp(project: Project): Promise<void> {
  const allProjects = projectStore.getAll()

  if (project.position === 0) {
    return
  }

  const previousProject = allProjects.find((item) => item.position === project.position - 1)

  if (!previousProject) {
    return
  }

  allProjects.forEach((item) => {
    if (item.id === project.id) {
      item.position = item.position - 1
    }

    if (item.id === previousProject.id) {
      item.position = item.position + 1
    }
  })

  projectStore.set(allProjects)

  projectStore.organizeByPosition()
}

export async function moveDown(project: Project): Promise<void> {
  const allProjects = projectStore.getAll()

  if (project.position === allProjects.length - 1) {
    return
  }

  const nextProject = allProjects.find((item) => item.position === project.position + 1)

  if (!nextProject) {
    return
  }
  allProjects.forEach((item) => {
    if (item.id === nextProject.id) {
      item.position = item.position - 1
    }

    if (item.id === project.id) {
      item.position = item.position + 1
    }
  })

  projectStore.set(allProjects)

  projectStore.organizeByPosition()
}

export async function openFolder(path: string): Promise<void> {
  await shell.openPath(path)
}

export function openVscode(path: string): void {
  const isCodeInPath = commandExists.sync('code')

  const open = Platform.select({
    darwin: () => {
      isCodeInPath ? execa.commandSync(`code ${path}`, { detached: true }) : shell.openExternal('vscode://file' + path)
    },
    win32: () => {
      if (isCodeInPath) {
        execa.commandSync(`code ${path}`, { detached: true })
      } else {
        dialog.showErrorBox('Error', getTranslation('vscodeNotFound') + path)
        shell.openPath(path)
      }
    },
    linux: () => {
      if (isCodeInPath) {
        execa.commandSync(`code ${path}`, { detached: true })
      } else {
        dialog.showErrorBox('Error', getTranslation('vscodeNotFound') + path)
        shell.openPath(path)
      }
    },
  })

  open()
}

export async function openTerminal(path: string, terminal: SettingsItem): Promise<void> {
  try {
    await execa.command(`${terminal.command ?? terminal.path} ${path}`, {
      detached: true,
      shell: true,
    })
  } catch (error) {
    try {
      await execa.command(`${terminal.command ?? terminal.path} ${path}`, {
        detached: true,
      })
    } catch (error2) {
      dialog.showErrorBox(
        'Error',
        `${terminal.command ?? terminal.path} ${path}

        ${error2}
        `,
      )
    }
  }
}

export async function openEditor(path: string, editor: SettingsItem): Promise<void> {
  try {
    await execa.command(`${editor.command ?? editor.path} ${path}`, {
      detached: true,
      shell: true,
    })
  } catch (error) {
    try {
      await execa.command(`${editor.command ?? editor.path} ${path}`, {
        detached: true,
      })
    } catch (error2) {
      dialog.showErrorBox(
        'Error',
        `${editor.command ?? editor.path} ${path}

        ${error2}
        `,
      )
    }
  }
}

export function openGithubDesktop(path: string): void {
  const isGithubDesktopInPath = commandExists.sync('github-desktop')

  if (isGithubDesktopInPath) {
    const command = Platform.select({
      darwin: 'github',
      win32: 'github',
      linux: 'github-desktop',
    })

    execa.commandSync(`${command} ${path}`, { detached: true })
  }
}
