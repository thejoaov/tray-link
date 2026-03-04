import { Command } from 'commander'
import { projectStore } from '../storage'

export default new Command('list').description('List all projects registered in Tray Link').action(async () => {
  const projects = await projectStore.getProjects()

  if (projects.length === 0) {
    console.log('No projects registered.')
    return
  }

  console.table(
    projects.map((p) => ({
      Name: p.name,
      Path: p.path,
      Favorite: p.isFavorite ? 'Yes' : 'No',
    })),
  )
})
