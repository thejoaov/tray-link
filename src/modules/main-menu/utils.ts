import { dialog } from 'electron'
import { basename } from 'path'
import { projectStore } from '../../services/store/index.js'
import getTranslation from '../../i18n/index.js'

export async function onClickAddProjects(): Promise<void> {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
    title: getTranslation('selectProjectFolder'),
  })

  if (!result || result.canceled) return

  const projectName = basename(result.filePaths[0])

  projectStore.save({
    name: projectName,
    path: result.filePaths[0],
  })
}
