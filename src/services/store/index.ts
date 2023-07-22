import store from './config'
import { ProjectSchema, SettingsSchema } from './schema'
import Project from '../../models/Project'
import SettingsItem from '../../models/SettingsItem'
import { STORE_KEYS } from '../../constants/store'
import { BaseStore } from './types'

export class ProjectStore implements BaseStore {
  getAll(): Project[] {
    const projectsData = store.get(STORE_KEYS.PROJECTS) as ProjectSchema[]

    return (projectsData ?? []) as Project[]
  }

  save(data: { name: string; path: string }): void {
    const project = new Project({
      name: data.name,
      path: data.path,
    })

    const projectsData = (store.get(STORE_KEYS.PROJECTS) ?? []) as ProjectSchema[]

    store.set(STORE_KEYS.PROJECTS, [...projectsData, project])
  }

  get(id: string): Project {
    const projectsData = (store.get(STORE_KEYS.PROJECTS) ?? []) as ProjectSchema[]

    const project = projectsData.find((project: Project) => project.id === id)

    if (!project) {
      throw new Error('Project not found')
    }

    return project as Project
  }

  update(id: string, data: Partial<Omit<Project, 'id'>>): Project {
    const projectsData = (store.get(STORE_KEYS.PROJECTS) ?? []) as ProjectSchema[]

    const project = projectsData.find((project: Project) => project.id === id)

    if (!project) {
      throw new Error('Project not found')
    }

    const updatedProject = {
      ...project,
      ...data,
      updatedAt: new Date(),
    }

    const updatedProjectsData = projectsData.map((project: Project) => {
      if (project.id === id) {
        return updatedProject
      }

      return project
    })

    store.set(STORE_KEYS.PROJECTS, updatedProjectsData)

    return updatedProject as Project
  }

  delete(id: string): void {
    const projectsData = (store.get(STORE_KEYS.PROJECTS) ?? []) as ProjectSchema[]

    const project = projectsData.find((project: Project) => project.id === id)

    if (!project) {
      throw new Error('Project not found')
    }

    const updatedProjectsData = projectsData.filter((project: Project) => project.id !== id)

    store.set(STORE_KEYS.PROJECTS, updatedProjectsData)
  }
}
export const projectStore = new ProjectStore()

export class SettingsStore implements BaseStore {
  getAll(): SettingsSchema {
    return store.get(STORE_KEYS.SETTINGS) as SettingsSchema
  }

  get(key: keyof SettingsSchema): SettingsItem | string {
    const settingsData = (store.get(STORE_KEYS.SETTINGS) ?? {}) as SettingsSchema

    return settingsData[key]
  }

  save(key: keyof SettingsSchema, data: SettingsItem): void {
    const settingsData = (store.get(STORE_KEYS.SETTINGS) ?? {}) as SettingsSchema

    store.set(STORE_KEYS.SETTINGS, { ...settingsData, [key]: data })
  }

  getDefaultTerminal(): SettingsItem {
    const settingsData = (store.get(STORE_KEYS.SETTINGS) ?? {}) as SettingsSchema

    return settingsData.defaultTerminal
  }

  getDefaultEditor(): SettingsItem {
    const settingsData = (store.get(STORE_KEYS.SETTINGS) ?? {}) as SettingsSchema

    return settingsData.defaultEditor
  }
}
export const settingsStore = new SettingsStore()
