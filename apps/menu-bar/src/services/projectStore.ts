import { Project } from '@tray-link/common-types'
import { Platform } from 'react-native'
import { MMKV } from 'react-native-mmkv'

type StorageLike = {
  set: (key: string, value: string) => Promise<boolean> | void
  getString: (key: string) => Promise<string | null | undefined> | string | null | undefined
  delete: (key: string) => Promise<boolean> | void
  getAllKeys: () => Promise<string[]> | string[]
}

let storage: StorageLike

if (Platform.OS === 'macos' || Platform.OS === 'ios' || Platform.OS === 'android') {
  storage = new MMKV({ id: 'tray-link-projects' })
} else {
  // Para electron usamos o modulo que criamos
  const { setItem, getItem, removeItem, getAllKeys } = require('../../modules/storage-module/src/index')
  storage = {
    set: (key: string, value: string) => setItem(key, value),
    getString: (key: string) => getItem(key),
    delete: (key: string) => removeItem(key),
    getAllKeys: () => getAllKeys(),
  }
}

const PROJECTS_KEY = 'projects'

export const projectStore = {
  getProjects: async (): Promise<Project[]> => {
    try {
      const data = await storage.getString(PROJECTS_KEY)
      if (!data) return []
      return JSON.parse(data)
    } catch (e) {
      console.error('Error reading projects', e)
      return []
    }
  },

  saveProjects: async (projects: Project[]): Promise<void> => {
    try {
      await storage.set(PROJECTS_KEY, JSON.stringify(projects))
    } catch (e) {
      console.error('Error saving projects', e)
    }
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

  saveProjectOrder: async (projects: Project[]): Promise<void> => {
    const normalized = projects.map((project, index) => ({
      ...project,
      position: index,
      updatedAt: new Date().toISOString(),
    }))

    await projectStore.saveProjects(normalized)
  },
}
