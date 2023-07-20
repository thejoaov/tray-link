import { dialog } from 'electron'
import { basename } from 'path'
import { saveProject } from '../../services/store'

export async function onClickAddProjects(): Promise<void> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: 'Select a project',
  })

  if (!result || result.canceled) return

  console.log(result)

  const projectName = basename(result.filePaths[0])

  console.log(projectName)

  saveProject({
    name: projectName,
    path: result.filePaths[0],
  })
}
