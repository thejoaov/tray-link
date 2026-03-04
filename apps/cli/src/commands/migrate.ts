import { Project } from '@tray-link/common-types'
import { Command } from 'commander'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { projectStore } from '../storage'

type LegacyProject = {
  id?: string
  name?: string
  path?: string
  position?: number
  isFavorite?: boolean
  createdAt?: string
  updatedAt?: string
}

type LegacyData = {
  settings?: Record<string, unknown>
  projects?: LegacyProject[]
}

/**
 * Searches for legacy vs-tray / tray-link config files in common locations.
 * Mirrors the logic in the native macOS ShellUtilsModule.
 */
function findLegacyConfig(): LegacyData | null {
  const home = os.homedir()

  let candidateDirs: string[]

  switch (process.platform) {
    case 'darwin': {
      const appSupport = path.join(home, 'Library', 'Application Support')
      candidateDirs = [
        path.join(appSupport, 'vs-tray'),
        path.join(appSupport, 'tray-link'),
        path.join(appSupport, 'Tray Link'),
      ]

      // Also scan for any folder containing "tray" or "vs" (like the native module does)
      try {
        const folders = fs.readdirSync(appSupport)
        for (const folder of folders) {
          const lower = folder.toLowerCase()
          if (lower.includes('tray') || lower.includes('vs')) {
            candidateDirs.push(path.join(appSupport, folder))
          }
        }
      } catch {
        // ignore
      }
      break
    }
    case 'win32': {
      const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming')
      candidateDirs = [path.join(appData, 'vs-tray'), path.join(appData, 'tray-link'), path.join(appData, 'Tray Link')]
      break
    }
    default: {
      const configBase = process.env.XDG_CONFIG_HOME || path.join(home, '.config')
      candidateDirs = [
        path.join(configBase, 'vs-tray'),
        path.join(configBase, 'tray-link'),
        path.join(configBase, 'Tray Link'),
      ]
      break
    }
  }

  // Deduplicate
  const seen = new Set<string>()
  const uniqueDirs = candidateDirs.filter((d) => {
    if (seen.has(d)) return false
    seen.add(d)
    return true
  })

  for (const dir of uniqueDirs) {
    const configPath = path.join(dir, 'config.json')
    if (!fs.existsSync(configPath)) continue

    try {
      const raw = fs.readFileSync(configPath, 'utf8')
      const data = JSON.parse(raw) as LegacyData
      if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
        return data
      }
    } catch {
      // skip invalid files
    }
  }

  return null
}

function normalizeLegacyProjects(items: LegacyProject[]): Project[] {
  const now = new Date().toISOString()

  return items
    .filter((item) => Boolean(item.path && item.name))
    .map((item, index) => ({
      id: item.id || `${Date.now()}-${index}`,
      name: item.name || 'Project',
      path: item.path || '',
      position: typeof item.position === 'number' ? item.position : index,
      isFavorite: Boolean(item.isFavorite),
      migrated: true,
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now,
    }))
    .sort((a, b) => a.position - b.position)
    .map((item, index) => ({ ...item, position: index }))
}

export default new Command('migrate')
  .description('Migrate projects from legacy vs-tray / Tray Link into the current config')
  .option('--dry-run', 'Preview what would be migrated without making changes')
  .option('-f, --force', 'Run migration even if projects with the same paths already exist (skip duplicates)')
  .action(async (options) => {
    const legacyData = findLegacyConfig()

    if (!legacyData || !legacyData.projects?.length) {
      console.log('No legacy vs-tray data found. Nothing to migrate.')
      return
    }

    const legacyProjects = normalizeLegacyProjects(legacyData.projects)

    if (legacyProjects.length === 0) {
      console.log('Legacy config found but contains no valid projects.')
      return
    }

    // Determine which projects are new
    const existingProjects = await projectStore.getProjects()
    const existingPaths = new Set(existingProjects.map((p) => p.path))
    const newProjects = legacyProjects.filter((p) => !existingPaths.has(p.path))

    console.log(`Found ${legacyProjects.length} project(s) in legacy config.`)

    if (newProjects.length === 0) {
      console.log('All legacy projects already exist in the current config. Nothing to migrate.')
      return
    }

    const skipped = legacyProjects.length - newProjects.length
    if (skipped > 0) {
      console.log(`Skipping ${skipped} project(s) that already exist.`)
    }

    if (options.dryRun) {
      console.log('\nDry run — the following projects would be migrated:\n')
      console.table(
        newProjects.map((p) => ({
          Name: p.name,
          Path: p.path,
          Favorite: p.isFavorite ? 'Yes' : 'No',
        })),
      )
      return
    }

    const merged = [
      ...existingProjects,
      ...newProjects.map((p, i) => ({ ...p, position: existingProjects.length + i })),
    ]

    await projectStore.saveProjects(merged)

    console.log(`\nSuccessfully migrated ${newProjects.length} project(s):\n`)
    console.table(
      newProjects.map((p) => ({
        Name: p.name,
        Path: p.path,
        Favorite: p.isFavorite ? 'Yes' : 'No',
      })),
    )
  })
