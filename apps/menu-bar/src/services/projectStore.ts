import { Project } from '@tray-link/common-types'
import { Platform } from 'react-native'
import { getItem, setItem } from '../../modules/storage-module/src/index'

const PROJECTS_KEY = 'projects'

/**
 * One-time migration: move projects from MMKV to shared config.json
 * so that native macOS, Electron, and CLI all share the same data.
 */
let mmkvMigrationDone = false
async function migrateFromMmkv(): Promise<void> {
  if (mmkvMigrationDone) return
  mmkvMigrationDone = true

  // Only needed on native macOS where MMKV was previously used
  if (Platform.OS !== 'macos') return

  try {
    // If config.json already has projects, skip migration
    const existing = await getItem(PROJECTS_KEY)
    if (existing) return

    // Try to read from old MMKV storage
    const { MMKV } = require('react-native-mmkv')
    const mmkv = new MMKV({ id: 'tray-link-projects' })
    const data = mmkv.getString(PROJECTS_KEY)
    if (data) {
      await setItem(PROJECTS_KEY, data)
      // Clear MMKV after successful migration
      mmkv.delete(PROJECTS_KEY)
    }
  } catch (_e) {
    // MMKV not available or no data — nothing to migrate
  }
}

export const projectStore = {
  getProjects: async (): Promise<Project[]> => {
    try {
      await migrateFromMmkv()
      const data = await getItem(PROJECTS_KEY)
      if (!data) return []
      return JSON.parse(data)
    } catch (e) {
      console.error('Error reading projects', e)
      return []
    }
  },

  saveProjects: async (projects: Project[]): Promise<void> => {
    try {
      await setItem(PROJECTS_KEY, JSON.stringify(projects))
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
