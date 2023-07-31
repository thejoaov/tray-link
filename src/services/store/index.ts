import store from './config'
import { ProjectSchema, SettingsSchema } from './schema'
import Project from '../../models/Project'
import SettingsItem from '../../models/SettingsItem'
import { STORE_KEYS } from '../../constants/store'
import { BaseStore } from './types'
import { getEditorList, getTerminalList } from '../../services/config'
import { DefaultEditor, DefaultTerminal } from '../../constants/defaults'

export class ProjectStore implements BaseStore {
  resetPosition(): void {
    const projects = store.get(STORE_KEYS.PROJECTS) as ProjectSchema[]

    const projectsData = projects.map((project, index) => ({
      ...project,
      position: index,
    }))

    store.set(STORE_KEYS.PROJECTS, projectsData)
    this.organizeByPosition()
  }

  organizeByPosition(): void {
    const projectsData = store.get(STORE_KEYS.PROJECTS) as ProjectSchema[]
    const sortedProjects = projectsData
      .sort((a, b) => a.position - b.position)
      .map((project, index) => ({
        ...project,
        position: index,
      }))

    store.set(STORE_KEYS.PROJECTS, sortedProjects)
  }

  getAll(): Project[] {
    const projectsData = store.get(STORE_KEYS.PROJECTS) as ProjectSchema[]
    this.organizeByPosition()
    return (projectsData ?? []) as Project[]
  }

  save(data: { name: string; path: string }): void {
    const project = new Project({
      name: data.name,
      path: data.path,
    })

    const projectsData = (store.get(STORE_KEYS.PROJECTS) ?? []) as ProjectSchema[]

    store.set(STORE_KEYS.PROJECTS, [...projectsData, project])
    this.organizeByPosition()
  }

  get(id: string): Project {
    const projectsData = (store.get(STORE_KEYS.PROJECTS) ?? []) as ProjectSchema[]

    const project = projectsData.find((project: Project) => project.id === id)

    if (!project) {
      throw new Error('Project not found')
    }

    this.organizeByPosition()
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

    this.organizeByPosition()

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
    this.organizeByPosition()
  }

  set(data: Project[]): void {
    store.set(STORE_KEYS.PROJECTS, data)
    this.organizeByPosition()
  }
}
export const projectStore = new ProjectStore()

export class SettingsStore implements BaseStore {
  getAll(): SettingsSchema {
    return store.get(STORE_KEYS.SETTINGS) as SettingsSchema
  }

  get(key: keyof SettingsSchema): SettingsSchema[keyof SettingsSchema] | null {
    const settingsData = store.get(STORE_KEYS.SETTINGS) as SettingsSchema

    if (!settingsData[key]) {
      return null
    }

    return settingsData[key]
  }

  save(key: keyof SettingsSchema, data: SettingsItem): void {
    const settingsData = store.get(STORE_KEYS.SETTINGS) as SettingsSchema

    store.set(STORE_KEYS.SETTINGS, { ...settingsData, [key]: data })
  }

  getDefaultTerminal(): SettingsItem {
    const settingsData = store.get(STORE_KEYS.SETTINGS) as SettingsSchema

    if (!settingsData.defaultTerminal.command) {
      return DefaultTerminal
    }

    return settingsData.defaultTerminal
  }

  getDefaultEditor(): SettingsItem {
    const settingsData = store.get(STORE_KEYS.SETTINGS) as SettingsSchema

    return settingsData.defaultEditor
  }

  resetDefaults(): void {
    store.set(STORE_KEYS.SETTINGS, {
      defaultEditor: DefaultEditor,
      defaultTerminal: DefaultTerminal,
      editorList: getEditorList(),
      terminalList: getTerminalList(),
      locale: 'en-US',
    } as SettingsSchema)
  }

  getTerminalList(): SettingsItem[] {
    const settingsData = store.get(STORE_KEYS.SETTINGS) as SettingsSchema

    if (!settingsData.terminalList) {
      return getTerminalList().map((terminal) => new SettingsItem(terminal))
    }

    return settingsData.terminalList
  }

  getEditorList(): SettingsItem[] {
    const settingsData = store.get(STORE_KEYS.SETTINGS) as SettingsSchema

    if (!settingsData.editorList) {
      return getEditorList().map((editor) => new SettingsItem(editor))
    }

    return settingsData.editorList
  }
}
export const settingsStore = new SettingsStore()
