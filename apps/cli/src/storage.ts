import { Project } from '@tray-link/common-types'
import Store from 'electron-store'

type TypedStore = {
  get: (key: string) => unknown
  set: (key: string, value: string) => void
}

const store = new Store({ projectName: 'tray-link' }) as unknown as TypedStore
const PROJECTS_KEY = 'projects'

export const projectStore = {
  getProjects: async (): Promise<Project[]> => {
    try {
      const data = store.get(PROJECTS_KEY) as string | null
      if (!data) return []
      return JSON.parse(data)
    } catch (_e) {
      return []
    }
  },

  saveProjects: async (projects: Project[]): Promise<void> => {
    store.set(PROJECTS_KEY, JSON.stringify(projects))
  },

  addProject: async (project: Project): Promise<void> => {
    const projects = await projectStore.getProjects()
    await projectStore.saveProjects([...projects, project])
  },

  removeProject: async (projectId: string): Promise<void> => {
    const projects = await projectStore.getProjects()
    await projectStore.saveProjects(projects.filter((p) => p.id !== projectId))
  },

  updateProject: async (project: Project): Promise<void> => {
    const projects = await projectStore.getProjects()
    const index = projects.findIndex((p) => p.id === project.id)
    if (index > -1) {
      projects[index] = project
      await projectStore.saveProjects(projects)
    }
  },
}
