import Project from '../../models/Project'
import store from './config'
import { ProjectSchema } from './schema'

export function getAllProjects(): Project[] {
  const projectsData = store.get('project') as ProjectSchema[]

  return projectsData as Project[]
}

export function saveProject(data: { name: string; path: string }): void {
  const project = new Project({
    name: data.name,
    path: data.path,
  })

  const projectsData = store.get('project') as ProjectSchema[]

  store.set('project', [...projectsData, project])
}

export function getProject(id: string): Project {
  const projectsData = store.get('project') as ProjectSchema[]

  const project = projectsData.find((project: Project) => project.id === id)

  if (!project) {
    throw new Error('Project not found')
  }

  return project as Project
}

export function updateProject(id: string, data: Partial<Omit<Project, 'id'>>): Project {
  const projectsData = store.get('project') as ProjectSchema[]

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

  store.set('project', updatedProjectsData)

  return updatedProject as Project
}

export function deleteProject(id: string): void {
  const projectsData = store.get('project') as ProjectSchema[]

  const project = projectsData.find((project: Project) => project.id === id)

  if (!project) {
    throw new Error('Project not found')
  }

  const updatedProjectsData = projectsData.filter((project: Project) => project.id !== id)

  store.set('project', updatedProjectsData)
}
