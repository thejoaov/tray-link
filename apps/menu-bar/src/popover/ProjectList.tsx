/** biome-ignore-all lint/suspicious/noEmptyBlockStatements: Fail silently if loading preferences on popover focus fails for any reason, to avoid breaking other popover functionality */
import { Ionicons } from '@expo/vector-icons'
import { Project } from '@tray-link/common-types'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PanResponder,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { pickFolders } from '../../modules/file-picker'
import { openInEditor, openInFinder, openInTerminal, removeFromDisk } from '../../modules/shell-utils/src'
import { getItem, setItem } from '../../modules/storage-module/src'
import { usePopoverFocusEffect } from '../hooks/usePopoverFocus'
import Alert from '../modules/Alert'
import { defaultUserPreferences } from '../modules/Storage'
import { logError } from '../services/errorLogger'
import {
  getEditorOptions,
  getTerminalOptions,
  loadPreferences,
  persistPreferences,
  subscribePreferencesChange,
  ToolOption,
} from '../services/preferences'
import { projectStore } from '../services/projectStore'
import { setPendingProjectRemove, subscribeProjectRemoveConfirm } from '../services/removeProjectDialog'
import { MAX_UI_HEIGHT, PROJECT_LIST_HEIGHT } from '../utils/constants'
import { WindowsNavigator } from '../windows'
import Footer from './Footer'
import { ProjectItem, parseTag } from './ProjectItem'
import { RECENT_SECTION_ID, RecentProjects } from './RecentProjects'
import SectionHeader from './SectionHeader'

const PROJECT_SEARCH_HEIGHT = 34
const PROJECT_SEARCH_GAP = 12
const FILTERED_PROJECT_LIST_HEIGHT = Math.max(PROJECT_LIST_HEIGHT - PROJECT_SEARCH_HEIGHT - PROJECT_SEARCH_GAP, 120)
const DRAG_AUTO_SCROLL_EDGE = 48
const DRAG_AUTO_SCROLL_STEP = 18
const DRAG_ACTIVATION_DISTANCE = 6

type RemoveProjectPayload = {
  id: string
  path: string
  deleteFromDisk: boolean
}

type ItemLayout = {
  y: number
  height: number
}

type ProjectSortMode = 'manual' | 'alphaAsc' | 'alphaDesc' | 'dateAsc' | 'dateDesc'

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max)
}

const moveProject = (items: Project[], fromIndex: number, toIndex: number) => {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items
  }

  const reordered = [...items]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)
  return reordered
}

const compareText = (left: string, right: string) => {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: 'base',
  })
}

const getParentFolderName = (path: string) => {
  const segments = path
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
  if (segments.length >= 2) {
    return segments[segments.length - 2]
  }
  return '/'
}

const getAlphabeticalGroup = (name: string) => {
  const trimmed = name.trim()
  if (!trimmed) return '#'
  const firstChar = trimmed.charAt(0).toUpperCase()
  if (firstChar >= 'A' && firstChar <= 'Z') {
    return firstChar
  }
  return '#'
}

// biome-ignore lint/correctness/noUnusedVariables: sortProjectsByMode is used in other parts of the workspace or planned for CLI integration
const sortProjectsByMode = (items: Project[], mode: Exclude<ProjectSortMode, 'manual'>) => {
  const sorted = [...items]

  sorted.sort((left, right) => {
    if (mode === 'alphaAsc') {
      const nameComparison = compareText(left.name, right.name)
      if (nameComparison !== 0) {
        return nameComparison
      }

      return compareText(left.path, right.path)
    }

    if (mode === 'alphaDesc') {
      const nameComparison = compareText(right.name, left.name)
      if (nameComparison !== 0) {
        return nameComparison
      }

      return compareText(right.path, left.path)
    }

    if (mode === 'dateAsc') {
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    }

    if (mode === 'dateDesc') {
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    }

    return 0
  })

  return sorted
}

export const ProjectList = () => {
  const { t } = useTranslation()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [contextMenuProjectId, setContextMenuProjectId] = useState<string | null>(null)
  const [toolSelectionProjectId, setToolSelectionProjectId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [preferences, setPreferences] = useState(defaultUserPreferences)
  const [itemLayouts, setItemLayouts] = useState<Record<string, ItemLayout>>({})
  const [activeDragProjectId, setActiveDragProjectId] = useState<string | null>(null)
  const [dragDestinationIndex, setDragDestinationIndex] = useState<number | null>(null)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [projectSortMode, setProjectSortMode] = useState<ProjectSortMode>('manual')
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})

  useEffect(() => {
    Promise.all([getItem('collapsed-sections'), getItem('favorites-collapsed')])
      .then(([sectionsVal, favsVal]) => {
        let initial: Record<string, boolean> = {}
        if (sectionsVal) {
          try {
            initial = JSON.parse(sectionsVal)
          } catch {}
        }
        if (favsVal === 'true') {
          initial['header-favorites'] = true
        }
        setCollapsedSections(initial)
      })
      .catch(() => {})
  }, [])

  const handleToggleSectionCollapsed = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [sectionId]: !prev[sectionId] }
      setItem('collapsed-sections', JSON.stringify(next)).catch(() => {})
      return next
    })
  }, [])
  const listRef = useRef<FlatList<Project>>(null)
  const listContainerRef = useRef<View>(null)
  const projectsRef = useRef<Project[]>([])
  const itemWrapperRefsRef = useRef(new Map<string, View | null>())
  const itemLayoutsRef = useRef<Record<string, ItemLayout>>({})
  const scrollOffsetRef = useRef(0)
  const listTopInWindowRef = useRef(0)
  const listHeightRef = useRef(FILTERED_PROJECT_LIST_HEIGHT)
  const dragTouchOffsetWithinItemRef = useRef(0)
  const activeDragProjectIdRef = useRef<string | null>(null)
  const dragDestinationIndexRef = useRef<number | null>(null)
  const beginProjectDragRef = useRef<(projectId: string, absoluteY: number) => void>(() => {})
  const updateProjectDragRef = useRef<(absoluteY: number) => void>(() => {})
  const finishProjectDragRef = useRef<() => void>(() => {})
  const dragPanRespondersRef = useRef(new Map<string, ReturnType<typeof PanResponder.create>>())
  const editorOptions = useMemo(
    () =>
      getEditorOptions(preferences.customEditors).map((option) =>
        preferences.showAppIcons ? option : { ...option, iconPath: null },
      ),
    [preferences.customEditors, preferences.showAppIcons],
  )
  const terminalOptions = useMemo(
    () =>
      getTerminalOptions(preferences.customTerminals).map((option) =>
        preferences.showAppIcons ? option : { ...option, iconPath: null },
      ),
    [preferences.customTerminals, preferences.showAppIcons],
  )
  const editorOptionsByCommand = useMemo(
    () => new Map(editorOptions.map((option) => [option.command, option])),
    [editorOptions],
  )
  const terminalOptionsByCommand = useMemo(
    () => new Map(terminalOptions.map((option) => [option.command, option])),
    [terminalOptions],
  )
  const globalEditorCommand = useMemo(
    () => preferences.defaultEditor ?? editorOptions[0]?.command ?? 'code',
    [editorOptions, preferences.defaultEditor],
  )
  const globalTerminalCommand = useMemo(
    () => preferences.defaultTerminal ?? terminalOptions[0]?.command ?? 'open -a Terminal',
    [preferences.defaultTerminal, terminalOptions],
  )
  const sortedProjects = useMemo(() => {
    const items = [...projects]
    if (projectSortMode === 'manual') {
      return items.sort((a, b) => a.position - b.position)
    }
    if (projectSortMode === 'alphaAsc') {
      return items.sort((a, b) => {
        const nameComp = compareText(a.name, b.name)
        return nameComp !== 0 ? nameComp : compareText(a.path, b.path)
      })
    }
    if (projectSortMode === 'alphaDesc') {
      return items.sort((a, b) => {
        const nameComp = compareText(b.name, a.name)
        return nameComp !== 0 ? nameComp : compareText(b.path, a.path)
      })
    }
    if (projectSortMode === 'dateAsc') {
      return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }
    if (projectSortMode === 'dateDesc') {
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return items
  }, [projects, projectSortMode])

  const allExistingTags = useMemo(() => {
    const tags = new Set<string>()
    sortedProjects.forEach((p) => {
      if (p.tag?.trim()) {
        tags.add(p.tag.trim())
      }
    })
    return Array.from(tags).sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  }, [sortedProjects])
  const normalizedSearchQuery = useMemo(() => searchQuery.trim().toLocaleLowerCase(), [searchQuery])
  const filteredProjects = useMemo(() => {
    if (!normalizedSearchQuery) {
      return sortedProjects
    }

    return sortedProjects.filter((project) => {
      const searchableText = `${project.name} ${project.path}`.toLocaleLowerCase()
      return searchableText.includes(normalizedSearchQuery)
    })
  }, [normalizedSearchQuery, sortedProjects])
  const displayedProjects = useMemo(() => {
    return filteredProjects
  }, [filteredProjects])
  const listEmptyHasSearchState = Boolean(normalizedSearchQuery)

  const favoritesList = useMemo(() => {
    const favs = sortedProjects.filter((p) => p.isFavorite)
    if (projectSortMode === 'manual') {
      return favs.sort((a, b) => (a.favoritePosition ?? 0) - (b.favoritePosition ?? 0))
    }
    return favs
  }, [sortedProjects, projectSortMode])

  const flatListData = useMemo(() => {
    if (projectSortMode === 'manual' && (!preferences.groupingMode || preferences.groupingMode === 'none')) {
      return sortedProjects.map((p, idx) => ({
        id: p.id,
        type: 'project' as const,
        project: p,
        isFavoriteSection: false,
        displayIndex: idx,
      }))
    }

    if (normalizedSearchQuery) {
      return filteredProjects.map((p, idx) => ({
        id: p.id,
        type: 'project' as const,
        project: p,
        isFavoriteSection: false,
        displayIndex: idx,
      }))
    }

    const remainingProjects = favoritesList.length > 0 ? sortedProjects.filter((p) => !p.isFavorite) : sortedProjects

    if (preferences.groupingMode === 'tag') {
      const groups: Record<string, Project[]> = {}
      for (const p of remainingProjects) {
        const tag = p.tag?.trim() || ''
        if (!groups[tag]) {
          groups[tag] = []
        }
        groups[tag].push(p)
      }

      const sortedTags = Object.keys(groups)
        .filter((tag) => tag !== '')
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))

      const items: Array<
        | { id: string; type: 'header'; label: string }
        | { id: string; type: 'project'; project: Project; isFavoriteSection: boolean; displayIndex: number }
      > = []

      if (favoritesList.length > 0) {
        items.push({
          id: 'header-favorites',
          type: 'header',
          label: t('favorites'),
        })
        if (!collapsedSections['header-favorites']) {
          favoritesList.forEach((p, idx) => {
            items.push({
              id: `fav-${p.id}`,
              type: 'project',
              project: p,
              isFavoriteSection: true,
              displayIndex: idx,
            })
          })
        }
      }

      let displayIdx = 0
      for (const tag of sortedTags) {
        const headerId = `header-tag-${tag}`
        items.push({
          id: headerId,
          type: 'header',
          label: tag,
        })
        if (!collapsedSections[headerId]) {
          groups[tag].forEach((p) => {
            items.push({
              id: p.id,
              type: 'project',
              project: p,
              isFavoriteSection: false,
              displayIndex: displayIdx++,
            })
          })
        }
      }

      if (groups[''] && groups[''].length > 0) {
        const headerId = 'header-tag-uncategorized'
        items.push({
          id: headerId,
          type: 'header',
          label: t('uncategorized'),
        })
        if (!collapsedSections[headerId]) {
          groups[''].forEach((p) => {
            items.push({
              id: p.id,
              type: 'project',
              project: p,
              isFavoriteSection: false,
              displayIndex: displayIdx++,
            })
          })
        }
      }

      return items
    }

    if (preferences.groupingMode === 'parentFolder') {
      const groups: Record<string, Project[]> = {}
      for (const p of remainingProjects) {
        const parentFolder = getParentFolderName(p.path)
        if (!groups[parentFolder]) {
          groups[parentFolder] = []
        }
        groups[parentFolder].push(p)
      }

      const sortedFolders = Object.keys(groups).sort((a, b) =>
        a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }),
      )

      const items: Array<
        | { id: string; type: 'header'; label: string }
        | { id: string; type: 'project'; project: Project; isFavoriteSection: boolean; displayIndex: number }
      > = []

      if (favoritesList.length > 0) {
        items.push({
          id: 'header-favorites',
          type: 'header',
          label: t('favorites'),
        })
        if (!collapsedSections['header-favorites']) {
          favoritesList.forEach((p, idx) => {
            items.push({
              id: `fav-${p.id}`,
              type: 'project',
              project: p,
              isFavoriteSection: true,
              displayIndex: idx,
            })
          })
        }
      }

      let displayIdx = 0
      for (const folder of sortedFolders) {
        const headerId = `header-folder-${folder}`
        items.push({
          id: headerId,
          type: 'header',
          label: folder,
        })
        if (!collapsedSections[headerId]) {
          groups[folder].forEach((p) => {
            items.push({
              id: p.id,
              type: 'project',
              project: p,
              isFavoriteSection: false,
              displayIndex: displayIdx++,
            })
          })
        }
      }

      return items
    }

    if (preferences.groupingMode === 'alphabetical') {
      const groups: Record<string, Project[]> = {}
      for (const p of remainingProjects) {
        const letter = getAlphabeticalGroup(p.name)
        if (!groups[letter]) {
          groups[letter] = []
        }
        groups[letter].push(p)
      }

      const sortedLetters = Object.keys(groups).sort((a, b) => {
        if (a === '#') return 1
        if (b === '#') return -1
        return a.localeCompare(b)
      })

      const items: Array<
        | { id: string; type: 'header'; label: string }
        | { id: string; type: 'project'; project: Project; isFavoriteSection: boolean; displayIndex: number }
      > = []

      if (favoritesList.length > 0) {
        items.push({
          id: 'header-favorites',
          type: 'header',
          label: t('favorites'),
        })
        if (!collapsedSections['header-favorites']) {
          favoritesList.forEach((p, idx) => {
            items.push({
              id: `fav-${p.id}`,
              type: 'project',
              project: p,
              isFavoriteSection: true,
              displayIndex: idx,
            })
          })
        }
      }

      let displayIdx = 0
      for (const letter of sortedLetters) {
        const headerId = `header-letter-${letter}`
        items.push({
          id: headerId,
          type: 'header',
          label: letter,
        })
        if (!collapsedSections[headerId]) {
          groups[letter].forEach((p) => {
            items.push({
              id: p.id,
              type: 'project',
              project: p,
              isFavoriteSection: false,
              displayIndex: displayIdx++,
            })
          })
        }
      }

      return items
    }

    if (favoritesList.length > 0) {
      const items: Array<
        | { id: string; type: 'header'; label: string }
        | { id: string; type: 'project'; project: Project; isFavoriteSection: boolean; displayIndex: number }
      > = []

      items.push({
        id: 'header-favorites',
        type: 'header',
        label: t('favorites'),
      })

      if (!collapsedSections['header-favorites']) {
        favoritesList.forEach((p, idx) => {
          items.push({
            id: `fav-${p.id}`,
            type: 'project',
            project: p,
            isFavoriteSection: true,
            displayIndex: idx,
          })
        })
      }

      const allProjectsHeaderId = 'header-all-projects'
      items.push({
        id: allProjectsHeaderId,
        type: 'header',
        label: t('projectsTitle'),
      })

      if (!collapsedSections[allProjectsHeaderId]) {
        projects.forEach((p, idx) => {
          items.push({
            id: p.id,
            type: 'project',
            project: p,
            isFavoriteSection: false,
            displayIndex: idx,
          })
        })
      }

      return items
    }

    return projects.map((p, idx) => ({
      id: p.id,
      type: 'project' as const,
      project: p,
      isFavoriteSection: false,
      displayIndex: idx,
    }))
  }, [
    projectSortMode,
    normalizedSearchQuery,
    filteredProjects,
    favoritesList,
    projects,
    t,
    preferences.groupingMode,
    collapsedSections,
  ])

  const loadProjects = useCallback(async () => {
    setLoading(true)

    try {
      const data = await projectStore.getProjects()
      const orderedProjects = [...data].sort((a, b) => a.position - b.position)
      projectsRef.current = orderedProjects
      setProjects(orderedProjects)
    } catch (error) {
      console.error(error)
      await logError('project-list:loadProjects', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadProjects()
    loadPreferences()
      .then(setPreferences)
      .catch((error) => {
        void logError('project-list:initial-loadPreferences', error)
      })

    const preferencesSubscription = subscribePreferencesChange(() => {
      loadPreferences()
        .then(setPreferences)
        .catch((error) => {
          void logError('project-list:preferences-subscription-loadPreferences', error)
        })
    })

    const removeSubscription = subscribeProjectRemoveConfirm(async (payload) => {
      try {
        await executeProjectRemoval(payload)
      } catch (error) {
        await logError('project-list:removeSubscription', error, {
          projectId: payload.id,
          path: payload.path,
          deleteFromDisk: payload.deleteFromDisk,
        })
      }
    })

    return () => {
      preferencesSubscription.remove()
      removeSubscription.remove()
    }
  }, [loadProjects])

  useEffect(() => {
    projectsRef.current = projects
  }, [projects])

  useEffect(() => {
    itemLayoutsRef.current = itemLayouts
  }, [itemLayouts])

  const projectSortModeRef = useRef<ProjectSortMode>('manual')
  useEffect(() => {
    projectSortModeRef.current = projectSortMode
  }, [projectSortMode])

  useEffect(() => {
    dragDestinationIndexRef.current = dragDestinationIndex
  }, [dragDestinationIndex])

  // Reload projects and preferences every time the popover becomes visible
  // This ensures CLI changes appear without a manual restart
  // Also reset the search query when the popover is focused/reopened
  usePopoverFocusEffect(
    useCallback(() => {
      setSearchQuery('')
      void loadProjects()
      loadPreferences()
        .then(setPreferences)
        .catch((error) => {
          void logError('project-list:focus-loadPreferences', error)
        })
    }, [loadProjects]),
  )

  const handleAddProject = async () => {
    try {
      const folderPaths = await pickFolders()
      const uniqueFolderPaths = Array.from(
        new Set(
          folderPaths.filter((folderPath) => folderPath && !projects.some((project) => project.path === folderPath)),
        ),
      )

      if (uniqueFolderPaths.length > 0) {
        const timestamp = Date.now()
        const basePosition = projects.length
        const newProjects: Project[] = uniqueFolderPaths.map((folderPath, index) => {
          const now = new Date().toISOString()

          return {
            id: `${timestamp}-${index}`,
            name: folderPath.split('/').pop() || 'New Project',
            path: folderPath,
            position: basePosition + index,
            createdAt: now,
            updatedAt: now,
            isFavorite: false,
            defaultEditor: null,
            defaultTerminal: null,
          }
        })

        await projectStore.saveProjects([...projects, ...newProjects])
        await loadProjects()
      }
    } catch (error) {
      console.error('Error adding project:', error)
      await logError('project-list:handleAddProject', error, {
        projectsLength: projects.length,
      })
    }
  }

  const handleToggleFavorite = useCallback(
    async (project: Project) => {
      try {
        const allProjects = await projectStore.getProjects()
        const updated = allProjects.map((p) => {
          if (p.id === project.id) {
            const nextIsFavorite = !p.isFavorite
            let favoritePosition = p.favoritePosition
            if (nextIsFavorite) {
              const favs = allProjects.filter((ap) => ap.isFavorite)
              const maxPos = favs.length > 0 ? Math.max(...favs.map((ap) => ap.favoritePosition ?? 0)) : -1
              favoritePosition = maxPos + 1
            } else {
              favoritePosition = undefined
            }
            return {
              ...p,
              isFavorite: nextIsFavorite,
              favoritePosition,
              updatedAt: new Date().toISOString(),
            }
          }
          return p
        })

        const favorited = updated
          .filter((p) => p.isFavorite)
          .sort((a, b) => (a.favoritePosition ?? 0) - (b.favoritePosition ?? 0))

        favorited.forEach((p, idx) => {
          const found = updated.find((item) => item.id === p.id)
          if (found) {
            found.favoritePosition = idx
          }
        })

        await projectStore.saveProjects(updated)
        await loadProjects()
      } catch (error) {
        console.error('Error toggling favorite:', error)
        await logError('project-list:handleToggleFavorite', error, {
          projectId: project.id,
        })
      }
    },
    [loadProjects],
  )

  const resolveEditorCommand = (project: Project) => {
    return project.defaultEditor ?? globalEditorCommand
  }

  const resolveTerminalCommand = (project: Project) => {
    return project.defaultTerminal ?? globalTerminalCommand
  }

  const resolveEditorOption = (project: Project): ToolOption | null => {
    return editorOptionsByCommand.get(resolveEditorCommand(project)) ?? null
  }

  const resolveTerminalOption = (project: Project): ToolOption | null => {
    return terminalOptionsByCommand.get(resolveTerminalCommand(project)) ?? null
  }

  const handleOpenEditor = async (project: Project) => {
    const editorCommand = resolveEditorCommand(project)
    const opened = await openInEditor(project.path, editorCommand)
    if (!opened) {
      Alert.alert(t('invalidEditor'), t('invalidValues'))
      return
    }
    await updateProjectLastOpened(project, { type: 'editor', command: editorCommand })
  }

  const handleOpenTerminal = async (project: Project) => {
    const terminalCommand = resolveTerminalCommand(project)
    const opened = await openInTerminal(project.path, terminalCommand)
    if (!opened) {
      Alert.alert(t('invalidTerminal'), t('invalidValues'))
      return
    }
    await updateProjectLastOpened(project, { type: 'terminal', command: terminalCommand })
  }

  const handleOpenFinder = async (project: Project) => {
    await openInFinder(project.path)
  }

  const handleOpenWithEditor = async (project: Project, command: string) => {
    const opened = await openInEditor(project.path, command)
    if (!opened) {
      Alert.alert(t('invalidEditor'), t('invalidValues'))
      return
    }
    await updateProjectLastOpened(project, { type: 'editor', command })
    setContextMenuProjectId(null)
    setToolSelectionProjectId(null)
  }

  const handleOpenWithTerminal = async (project: Project, command: string) => {
    const opened = await openInTerminal(project.path, command)
    if (!opened) {
      Alert.alert(t('invalidTerminal'), t('invalidValues'))
      return
    }
    await updateProjectLastOpened(project, { type: 'terminal', command })
    setContextMenuProjectId(null)
    setToolSelectionProjectId(null)
  }

  const handleSetProjectEditorDefault = async (project: Project, command: string) => {
    try {
      await projectStore.updateProject({
        ...project,
        defaultEditor: command,
        updatedAt: new Date().toISOString(),
      })
      await loadProjects()
    } catch (error) {
      await logError('project-list:handleSetProjectEditorDefault', error, {
        projectId: project.id,
        command,
      })
    }
  }

  const handleSetProjectTerminalDefault = async (project: Project, command: string) => {
    try {
      await projectStore.updateProject({
        ...project,
        defaultTerminal: command,
        updatedAt: new Date().toISOString(),
      })
      await loadProjects()
    } catch (error) {
      await logError('project-list:handleSetProjectTerminalDefault', error, {
        projectId: project.id,
        command,
      })
    }
  }

  const handleSaveProjectTag = async (project: Project, tag: string) => {
    try {
      await projectStore.updateProject({
        ...project,
        tag: tag || undefined,
        updatedAt: new Date().toISOString(),
      })
      await loadProjects()
    } catch (error) {
      await logError('project-list:handleSaveProjectTag', error, {
        projectId: project.id,
        tag,
      })
    }
  }

  const updateProjectLastOpened = useCallback(
    async (project: Project, tool: { type: 'editor' | 'terminal'; command: string }) => {
      try {
        const updatedProject: Project = {
          ...project,
          lastOpenedAt: new Date().toISOString(),
          lastOpenedTool: tool,
          updatedAt: new Date().toISOString(),
        }

        await projectStore.updateProject(updatedProject)
        setProjects((current) => current.map((item) => (item.id === project.id ? updatedProject : item)))
        projectsRef.current = projectsRef.current.map((item) => (item.id === project.id ? updatedProject : item))
      } catch (error) {
        await logError('project-list:updateProjectLastOpened', error, {
          projectId: project.id,
          toolType: tool.type,
          command: tool.command,
        })
      }
    },
    [],
  )

  const openProjectWithLastTool = useCallback(
    async (project: Project) => {
      const lastOpenedTool = project.lastOpenedTool

      if (lastOpenedTool?.type === 'terminal') {
        const opened = await openInTerminal(project.path, lastOpenedTool.command)
        if (!opened) {
          Alert.alert(t('invalidTerminal'), t('invalidValues'))
          return
        }
        await updateProjectLastOpened(project, lastOpenedTool)
        return
      }

      const editorCommand = lastOpenedTool?.command ?? resolveEditorCommand(project)
      const opened = await openInEditor(project.path, editorCommand)
      if (!opened) {
        Alert.alert(t('invalidEditor'), t('invalidValues'))
        return
      }
      await updateProjectLastOpened(project, {
        type: 'editor',
        command: editorCommand,
      })
    },
    [t, updateProjectLastOpened],
  )

  const executeProjectRemoval = async ({ id, path, deleteFromDisk }: RemoveProjectPayload) => {
    if (deleteFromDisk) {
      const removed = await removeFromDisk(path)
      if (!removed) {
        Alert.alert(t('deleteFailed'), t('couldNotDeleteFromDisk', { path }))
        return false
      }
    }

    await projectStore.removeProject(id)
    await loadProjects()
    setContextMenuProjectId((current) => (current === id ? null : current))
    setToolSelectionProjectId((current) => (current === id ? null : current))
    return true
  }

  const measureListContainer = useCallback(() => {
    listContainerRef.current?.measureInWindow((_x, y, _width, height) => {
      listTopInWindowRef.current = y
      listHeightRef.current = height
    })
  }, [])

  const handleListLayout = useCallback(
    (_event: LayoutChangeEvent) => {
      measureListContainer()
    },
    [measureListContainer],
  )

  const setProjectWrapperRef = useCallback((projectId: string, node: View | null) => {
    if (node) {
      itemWrapperRefsRef.current.set(projectId, node)
      return
    }

    itemWrapperRefsRef.current.delete(projectId)
  }, [])

  const handleProjectLayout = useCallback((projectId: string) => {
    const itemNode = itemWrapperRefsRef.current.get(projectId)
    if (!itemNode || !listContainerRef.current) {
      return
    }

    listContainerRef.current.measureInWindow((_listX, listY, _listWidth, listHeight) => {
      listTopInWindowRef.current = listY
      listHeightRef.current = listHeight

      itemNode.measureInWindow((_itemX, itemY, _itemWidth, itemHeight) => {
        const y = itemY - listY + scrollOffsetRef.current

        setItemLayouts((current) => {
          const previous = current[projectId]
          if (previous?.y === y && previous?.height === itemHeight) {
            return current
          }

          return {
            ...current,
            [projectId]: {
              y,
              height: itemHeight,
            },
          }
        })
      })
    })
  }, [])

  const persistProjectOrder = useCallback(
    async (orderedProjects: Project[]) => {
      const normalized = orderedProjects.map((project, position) => ({
        ...project,
        position,
        updatedAt: new Date().toISOString(),
      }))

      projectsRef.current = normalized
      setProjects(normalized)

      try {
        await projectStore.saveProjectOrder(normalized)
      } catch (error) {
        await logError('project-list:persistProjectOrder', error, {
          projectCount: normalized.length,
        })
        await loadProjects()
      }
    },
    [loadProjects],
  )

  const cycleGroupingMode = useCallback(async () => {
    const current = preferences.groupingMode ?? 'none'
    const next: 'none' | 'tag' | 'parentFolder' =
      current === 'none' ? 'tag' : current === 'tag' ? 'parentFolder' : 'none'

    try {
      const updatedPreferences = { ...preferences, groupingMode: next }
      setPreferences(updatedPreferences)
      await persistPreferences(updatedPreferences)
    } catch (error) {
      void logError('project-list:cycleGroupingMode', error)
    }
  }, [preferences])

  const cycleProjectSortMode = useCallback(() => {
    const nextMode: ProjectSortMode =
      projectSortMode === 'manual'
        ? 'alphaAsc'
        : projectSortMode === 'alphaAsc'
          ? 'alphaDesc'
          : projectSortMode === 'alphaDesc'
            ? 'dateAsc'
            : projectSortMode === 'dateAsc'
              ? 'dateDesc'
              : 'manual'

    setProjectSortMode(nextMode)
  }, [projectSortMode])

  const maybeAutoScrollDuringDrag = useCallback((absoluteY: number) => {
    const relativeY = absoluteY - listTopInWindowRef.current
    const layouts = Object.values(itemLayoutsRef.current)
    const contentHeight = layouts.length ? Math.max(...layouts.map((layout) => layout.y + layout.height)) : 0
    const maxOffset = Math.max(contentHeight - listHeightRef.current, 0)

    if (relativeY < DRAG_AUTO_SCROLL_EDGE) {
      const nextOffset = clamp(scrollOffsetRef.current - DRAG_AUTO_SCROLL_STEP, 0, maxOffset)
      if (nextOffset !== scrollOffsetRef.current) {
        scrollOffsetRef.current = nextOffset
        listRef.current?.scrollToOffset({ offset: nextOffset, animated: false })
      }
      return
    }

    if (relativeY > listHeightRef.current - DRAG_AUTO_SCROLL_EDGE) {
      const nextOffset = clamp(scrollOffsetRef.current + DRAG_AUTO_SCROLL_STEP, 0, maxOffset)
      if (nextOffset !== scrollOffsetRef.current) {
        scrollOffsetRef.current = nextOffset
        listRef.current?.scrollToOffset({ offset: nextOffset, animated: false })
      }
    }
  }, [])

  const beginProjectDrag = useCallback(
    (projectId: string, absoluteY: number) => {
      if (projectSortModeRef.current !== 'manual') {
        return
      }

      measureListContainer()
      const layout = itemLayoutsRef.current[projectId]
      if (!layout) {
        return
      }

      const pointerContentY = absoluteY - listTopInWindowRef.current + scrollOffsetRef.current
      const currentIndex = projectsRef.current.findIndex((project) => project.id === projectId)
      dragTouchOffsetWithinItemRef.current = clamp(pointerContentY - layout.y, 0, layout.height)
      activeDragProjectIdRef.current = projectId
      setActiveDragProjectId(projectId)
      dragDestinationIndexRef.current = currentIndex >= 0 ? currentIndex : null
      setDragDestinationIndex(currentIndex >= 0 ? currentIndex : null)
      setContextMenuProjectId(null)
      setToolSelectionProjectId(null)
    },
    [measureListContainer],
  )

  const updateProjectDrag = useCallback(
    (absoluteY: number) => {
      const activeProjectId = activeDragProjectIdRef.current
      if (!activeProjectId) {
        return
      }

      maybeAutoScrollDuringDrag(absoluteY)
      const pointerContentY = absoluteY - listTopInWindowRef.current + scrollOffsetRef.current
      const activeLayout = itemLayoutsRef.current[activeProjectId]

      if (!activeLayout) {
        return
      }

      const draggedCenterY = pointerContentY - dragTouchOffsetWithinItemRef.current + activeLayout.height / 2
      const currentProjects = projectsRef.current
      const currentIndex = currentProjects.findIndex((project) => project.id === activeProjectId)
      if (currentIndex < 0) {
        return
      }

      const candidateProjects = currentProjects.filter((project) => project.id !== activeProjectId)
      let insertionIndex = candidateProjects.length

      for (let index = 0; index < candidateProjects.length; index += 1) {
        const layout = itemLayoutsRef.current[candidateProjects[index].id]
        if (!layout) {
          continue
        }

        if (draggedCenterY < layout.y + layout.height / 2) {
          insertionIndex = index
          break
        }
      }

      const nextDestinationIndex = clamp(insertionIndex, 0, Math.max(currentProjects.length - 1, 0))

      if (dragDestinationIndexRef.current !== nextDestinationIndex) {
        dragDestinationIndexRef.current = nextDestinationIndex
        setDragDestinationIndex(nextDestinationIndex)
      }
    },
    [maybeAutoScrollDuringDrag],
  )

  const finishProjectDrag = useCallback(() => {
    const activeProjectId = activeDragProjectIdRef.current
    if (!activeProjectId) {
      return
    }

    const currentProjects = projectsRef.current
    const currentIndex = currentProjects.findIndex((project) => project.id === activeProjectId)
    const destinationIndex = dragDestinationIndexRef.current

    activeDragProjectIdRef.current = null
    dragTouchOffsetWithinItemRef.current = 0
    setActiveDragProjectId(null)
    dragDestinationIndexRef.current = null
    setDragDestinationIndex(null)

    if (currentIndex < 0 || destinationIndex === null || destinationIndex === currentIndex) {
      return
    }

    setProjectSortMode('manual')
    const reordered = moveProject(currentProjects, currentIndex, destinationIndex)
    void persistProjectOrder(reordered)
  }, [persistProjectOrder])

  useEffect(() => {
    beginProjectDragRef.current = beginProjectDrag
  }, [beginProjectDrag])

  useEffect(() => {
    updateProjectDragRef.current = updateProjectDrag
  }, [updateProjectDrag])

  useEffect(() => {
    finishProjectDragRef.current = finishProjectDrag
  }, [finishProjectDrag])

  const handleListScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextOffset = event.nativeEvent.contentOffset.y
    scrollOffsetRef.current = nextOffset
    setScrollOffset(nextOffset)
  }, [])

  const getDragPanResponder = useCallback((projectId: string) => {
    const cached = dragPanRespondersRef.current.get(projectId)
    if (cached) {
      return cached
    }

    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gestureState) => {
        return projectSortModeRef.current === 'manual' && Math.abs(gestureState.dy) >= DRAG_ACTIVATION_DISTANCE
      },
      onPanResponderGrant: (_event, gestureState) => {
        beginProjectDragRef.current(projectId, gestureState.moveY || gestureState.y0)
      },
      onPanResponderMove: (_event, gestureState) => {
        updateProjectDragRef.current(gestureState.moveY)
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: () => {
        finishProjectDragRef.current()
      },
      onPanResponderTerminate: () => {
        finishProjectDragRef.current()
      },
    })

    dragPanRespondersRef.current.set(projectId, responder)
    return responder
  }, [])

  useEffect(() => {
    const activeProjectIds = new Set(projects.map((project) => project.id))

    for (const projectId of dragPanRespondersRef.current.keys()) {
      if (!activeProjectIds.has(projectId)) {
        dragPanRespondersRef.current.delete(projectId)
      }
    }
  }, [projects])

  const insertionIndicatorTop = useMemo(() => {
    if (projectSortMode !== 'manual' || activeDragProjectId === null || dragDestinationIndex === null) {
      return null
    }

    const activeIndex = displayedProjects.findIndex((project) => project.id === activeDragProjectId)
    if (activeIndex < 0 || dragDestinationIndex === activeIndex) {
      return null
    }

    const destinationProject = displayedProjects[dragDestinationIndex]
    const destinationLayout = destinationProject ? itemLayouts[destinationProject.id] : null
    if (!destinationLayout) {
      return null
    }

    if (dragDestinationIndex < activeIndex) {
      return destinationLayout.y - scrollOffset
    }

    return destinationLayout.y + destinationLayout.height - scrollOffset
  }, [activeDragProjectId, displayedProjects, dragDestinationIndex, projectSortMode, itemLayouts, scrollOffset])

  const displayGroupingButtonIcon = useMemo(() => {
    const current = preferences.groupingMode ?? 'none'
    if (current === 'tag') {
      return 'pricetag-outline'
    }
    if (current === 'parentFolder') {
      return 'folder-outline'
    }
    return 'list-outline'
  }, [preferences.groupingMode])

  const displayGroupingButtonLabel = useMemo(() => {
    const current = preferences.groupingMode ?? 'none'
    if (current === 'tag') {
      return t('groupTag')
    }
    if (current === 'parentFolder') {
      return t('groupParentFolder')
    }
    return t('groupNone')
  }, [preferences.groupingMode, t])

  const projectSortModeButtonIcon = useMemo(() => {
    if (projectSortMode === 'alphaAsc' || projectSortMode === 'alphaDesc') {
      return 'text-outline'
    }

    if (projectSortMode === 'dateAsc' || projectSortMode === 'dateDesc') {
      return 'calendar-outline'
    }

    return 'swap-vertical-outline'
  }, [projectSortMode])

  const projectSortModeButtonLabel = useMemo(() => {
    if (projectSortMode === 'alphaAsc') {
      return t('sortProjectsAlphabeticalAsc')
    }

    if (projectSortMode === 'alphaDesc') {
      return t('sortProjectsAlphabeticalDesc')
    }

    if (projectSortMode === 'dateAsc') {
      return t('sortProjectsDateAsc')
    }

    if (projectSortMode === 'dateDesc') {
      return t('sortProjectsDateDesc')
    }

    return t('sortProjectsDefault')
  }, [projectSortMode, t])

  const handleRequestRemove = (project: Project) => {
    if (!preferences.requireProjectDeletionConfirmation && !preferences.removeFromDiskByDefault) {
      executeProjectRemoval({
        id: project.id,
        path: project.path,
        deleteFromDisk: false,
      }).catch((error) => {
        void logError('project-list:handleImmediateRemove', error, {
          projectId: project.id,
          path: project.path,
        })
      })
      return
    }

    setPendingProjectRemove({
      id: project.id,
      name: project.name,
      path: project.path,
      deleteFromDiskDefault: preferences.removeFromDiskByDefault,
    })
    WindowsNavigator.open('RemoveProjectWindow')
  }

  const handleToggleContextMenu = (projectId: string) => {
    const nextContextMenuProjectId = contextMenuProjectId === projectId ? null : projectId
    setContextMenuProjectId(nextContextMenuProjectId)

    if (nextContextMenuProjectId !== projectId || toolSelectionProjectId !== projectId) {
      setToolSelectionProjectId(null)
    }
  }

  const handleToggleProjectToolSelectionMode = (projectId: string) => {
    setToolSelectionProjectId((current) => (current === projectId ? null : projectId))
  }

  const handleCloseContextMenu = (projectId: string) => {
    setContextMenuProjectId((current) => (current === projectId ? null : current))
    setToolSelectionProjectId((current) => (current === projectId ? null : current))
  }

  if (loading) {
    return (
      <View
        style={{
          maxHeight: MAX_UI_HEIGHT,
        }}
      >
        <SectionHeader
          label={t('projects')}
          accessoryRight={
            <View style={styles.headerActions}>
              <TouchableOpacity disabled style={[styles.addButton, styles.addButtonDisabled]}>
                <Text style={styles.metaButtonText}>{t('reorder')}</Text>
              </TouchableOpacity>
              <TouchableOpacity disabled style={[styles.addButton, styles.addButtonDisabled]}>
                <Ionicons name="add" size={16} color="var(--text-color)" />
              </TouchableOpacity>
            </View>
          }
        />
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={14} color="var(--text-color)" />
          <TextInput
            value=""
            editable={false}
            placeholder={t('searchProjects')}
            placeholderTextColor="#8E8E93"
            style={styles.searchInput}
          />
        </View>
        <View style={[styles.emptyContainer, styles.loadingContainer]}>
          <ActivityIndicator size="small" color="var(--text-color)" />
          <Text style={styles.emptyText}>{t('loading')}</Text>
        </View>
        <Footer />
      </View>
    )
  }

  return (
    <View
      style={{
        maxHeight: MAX_UI_HEIGHT,
      }}
    >
      <SectionHeader
        label={t('projects')}
        accessoryRight={
          <View style={styles.headerActions}>
            <TouchableOpacity
              accessibilityLabel={displayGroupingButtonLabel}
              disabled={Boolean(activeDragProjectId)}
              onPress={cycleGroupingMode}
              style={[styles.addButton, activeDragProjectId && styles.addButtonDisabled]}
            >
              <Ionicons name={displayGroupingButtonIcon} size={16} color="var(--text-color)" />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityLabel={projectSortModeButtonLabel}
              disabled={Boolean(activeDragProjectId)}
              onPress={cycleProjectSortMode}
              style={[styles.addButton, activeDragProjectId && styles.addButtonDisabled]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Ionicons name={projectSortModeButtonIcon} size={16} color="var(--text-color)" />
                {projectSortMode.endsWith('Asc') && <Ionicons name="arrow-up" size={12} color="var(--text-color)" />}
                {projectSortMode.endsWith('Desc') && <Ionicons name="arrow-down" size={12} color="var(--text-color)" />}
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddProject} style={styles.addButton}>
              <Ionicons name="add" size={16} color="var(--text-color)" />
            </TouchableOpacity>
          </View>
        }
      />
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={14} color="var(--text-color)" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('searchProjects')}
          placeholderTextColor="#8E8E93"
          style={styles.searchInput}
          autoCapitalize="none"
          autoCorrect={false}
          editable={true}
          onBlur={() => setSearchQuery('')}
        />
        {searchQuery ? (
          <TouchableOpacity
            accessibilityLabel={t('clearSearch')}
            onPress={() => setSearchQuery('')}
            style={styles.clearSearchButton}
          >
            <Ionicons name="close-circle" size={16} color="var(--text-color)" />
          </TouchableOpacity>
        ) : null}
      </View>
      <View ref={listContainerRef} onLayout={handleListLayout} style={styles.listContainer}>
        <FlatList
          // biome-ignore lint/suspicious/noExplicitAny: FlatList ref casting is required to support the union list item type
          ref={listRef as any}
          // biome-ignore lint/suspicious/noExplicitAny: FlatList data casting is required to support the union list item type
          data={flatListData as any}
          keyExtractor={(item) => item.id}
          style={{ height: FILTERED_PROJECT_LIST_HEIGHT }}
          extraData={{
            activeDragProjectId,
            contextMenuProjectId,
            dragDestinationIndex,
            globalEditorCommand,
            globalTerminalCommand,
            itemLayouts,
            scrollOffset,
            toolSelectionProjectId,
            flatListData,
            allExistingTags,
            collapsedSections,
          }}
          scrollEnabled={!activeDragProjectId}
          onScroll={handleListScroll}
          scrollEventThrottle={16}
          ListHeaderComponent={
            !normalizedSearchQuery ? (
              <RecentProjects
                projects={projects}
                recentLabel={t('recent')}
                showAppIcons={preferences.showAppIcons}
                isCollapsed={Boolean(collapsedSections[RECENT_SECTION_ID])}
                onToggleCollapsed={() => handleToggleSectionCollapsed(RECENT_SECTION_ID)}
                editorOptionsByCommand={editorOptionsByCommand}
                terminalOptionsByCommand={terminalOptionsByCommand}
                globalEditorCommand={globalEditorCommand}
                globalTerminalCommand={globalTerminalCommand}
                onOpenRecent={openProjectWithLastTool}
              />
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {listEmptyHasSearchState ? t('noProjectsFound') : t('noProjectsYet')}
              </Text>
              <Text style={styles.emptySubtext}>
                {listEmptyHasSearchState ? t('adjustSearchOrAddProject') : t('clickToAddProject')}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            if (item.type === 'header') {
              const isCollapsed = Boolean(collapsedSections[item.id])
              return (
                <SectionHeader
                  label={item.label}
                  onPress={() => handleToggleSectionCollapsed(item.id)}
                  accessoryRight={
                    <View style={styles.collapseIconContainer}>
                      <Ionicons
                        name={isCollapsed ? 'chevron-forward-outline' : 'chevron-down-outline'}
                        size={12}
                        color="var(--text-color)"
                        style={{ opacity: 0.6 }}
                      />
                    </View>
                  }
                />
              )
            }

            const projectItem = item.project
            return (
              <View ref={(node) => setProjectWrapperRef(item.id, node)} onLayout={() => handleProjectLayout(item.id)}>
                <ProjectItem
                  index={item.displayIndex}
                  showProjectPositions={preferences.showProjectPositions}
                  project={projectItem}
                  onOpenEditor={() => handleOpenEditor(projectItem)}
                  onOpenTerminal={() => handleOpenTerminal(projectItem)}
                  onOpenFinder={() => handleOpenFinder(projectItem)}
                  onRemove={() => handleRequestRemove(projectItem)}
                  onToggleContextMenu={() => handleToggleContextMenu(projectItem.id)}
                  onCloseContextMenu={() => handleCloseContextMenu(projectItem.id)}
                  contextMenuOpen={contextMenuProjectId === projectItem.id}
                  editorOptions={editorOptions}
                  terminalOptions={terminalOptions}
                  editorQuickActionOption={resolveEditorOption(projectItem)}
                  terminalQuickActionOption={resolveTerminalOption(projectItem)}
                  onOpenWithEditor={(command) => handleOpenWithEditor(projectItem, command)}
                  onOpenWithTerminal={(command) => handleOpenWithTerminal(projectItem, command)}
                  onSelectProjectEditorDefault={(command) => handleSetProjectEditorDefault(projectItem, command)}
                  onSelectProjectTerminalDefault={(command) => handleSetProjectTerminalDefault(projectItem, command)}
                  globalEditorCommand={globalEditorCommand}
                  globalTerminalCommand={globalTerminalCommand}
                  toolSelectionMode={toolSelectionProjectId === projectItem.id}
                  onToggleProjectToolSelectionMode={() => handleToggleProjectToolSelectionMode(projectItem.id)}
                  onToggleFavorite={() => handleToggleFavorite(projectItem)}
                  labels={{
                    moreActions: t('moreActions'),
                    openWithEditor: t('openWithEditor'),
                    openWithTerminal: t('openWithTerminal'),
                    selectProjectDefaults: t('selectProjectDefaults'),
                    done: t('done'),
                    close: t('close'),
                    tagLabel: t('tagLabel'),
                    editTagPlaceholder: t('editTagPlaceholder'),
                    save: t('save'),
                  }}
                  onSaveTag={(tag) => handleSaveProjectTag(projectItem, tag)}
                  allExistingTags={allExistingTags}
                  editMode={
                    projectSortMode === 'manual' && (!preferences.groupingMode || preferences.groupingMode === 'none')
                  }
                  showDragHandle={
                    projectSortMode === 'manual' && (!preferences.groupingMode || preferences.groupingMode === 'none')
                  }
                  dragHandleProps={getDragPanResponder(item.id).panHandlers}
                  isDragging={activeDragProjectId === item.id}
                />
              </View>
            )
          }}
        />
        {insertionIndicatorTop !== null ? (
          <View
            pointerEvents="none"
            style={[
              styles.insertionIndicatorOverlay,
              {
                top: insertionIndicatorTop,
              },
            ]}
          />
        ) : null}
      </View>

      <Footer />
    </View>
  )
}

const styles = StyleSheet.create({
  addButton: {
    paddingHorizontal: 8,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchContainer: {
    marginHorizontal: 16,
    marginBottom: PROJECT_SEARCH_GAP,
    height: PROJECT_SEARCH_HEIGHT,
    borderRadius: 10,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  listContainer: {
    position: 'relative',
  },
  insertionIndicatorOverlay: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(125, 211, 252, 0.95)',
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    color: 'var(--text-color)',
    paddingVertical: 0,
    alignContent: 'center',
    textAlignVertical: 'center',
    verticalAlign: 'middle',
    borderColor: 'transparent',
    borderWidth: 0,
  },
  searchContainerDisabled: {
    opacity: 0.7,
  },
  searchInputDisabled: {
    opacity: 0.8,
  },
  clearSearchButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchButtonDisabled: {
    opacity: 0.6,
  },
  metaButtonText: {
    fontSize: 10,
    fontWeight: '700',
    color: 'var(--text-color)',
  },
  emptyContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    gap: 10,
    minHeight: FILTERED_PROJECT_LIST_HEIGHT,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    color: 'var(--text-color)',
  },
  emptySubtext: {
    fontSize: 12,
    opacity: 0.7,
    color: 'var(--text-color)',
  },
  collapseIconContainer: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
