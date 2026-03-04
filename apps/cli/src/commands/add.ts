import { Command } from 'commander'
import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { projectStore } from '../storage'

export default new Command('add')
  .description('Add a new project to Tray Link')
  .argument('<path>', 'Absolute path to the project')
  .option('-n, --name <name>', 'Project name')
  .action(async (projectPath, options) => {
    const fullPath = path.resolve(process.cwd(), projectPath)

    if (!fs.existsSync(fullPath)) {
      console.error(`Error: Path ${fullPath} does not exist`)
      process.exit(1)
    }

    const name = options.name || path.basename(fullPath)

    await projectStore.addProject({
      id: uuidv4(),
      name,
      path: fullPath,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      position: Date.now(),
      isFavorite: false,
      source: 'cli',
    })

    console.log(`Added project: ${name} (${fullPath})`)
  })
