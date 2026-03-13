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
import { usePopoverFocusEffect } from '../hooks/usePopoverFocus'
import Alert from '../modules/Alert'
import { defaultUserPreferences } from '../modules/Storage'
import { logError } from '../services/errorLogger'
import {
  getEditorOptions,
  getTerminalOptions,
  loadPreferences,
  subscribePreferencesChange,
  ToolOption,
} from '../services/preferences'
import { projectStore } from '../services/projectStore'
import { setPendingProjectRemove, subscribeProjectRemoveConfirm } from '../services/removeProjectDialog'
import { MAX_UI_HEIGHT, PROJECT_LIST_HEIGHT } from '../utils/constants'
import { WindowsNavigator } from '../windows'
import Footer from './Footer'
import { ProjectItem } from './ProjectItem'
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

type ProjectSortMode = 'manual' | 'alphaAsc' | 'alphaDesc' | 'neighborhood'

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

const getPathSegments = (path: string) => {
  return path
    .split('/')
    .map((segment) => segment.trim())
    .filter(Boolean)
}

const compareProjectsByNeighborhood = (left: Project, right: Project) => {
  const leftSegments = getPathSegments(left.path)
  const rightSegments = getPathSegments(right.path)
  const maxSegmentCount = Math.max(leftSegments.length, rightSegments.length)

  for (let index = 0; index < maxSegmentCount; index += 1) {
    const leftSegment = leftSegments[index] ?? ''
    const rightSegment = rightSegments[index] ?? ''
    const comparison = compareText(leftSegment, rightSegment)

    if (comparison !== 0) {
      return comparison
    }
  }

  const nameComparison = compareText(left.name, right.name)
  if (nameComparison !== 0) {
    return nameComparison
  }

  return compareText(left.path, right.path)
}

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

    return compareProjectsByNeighborhood(left, right)
  })

  return sorted
}

export const ProjectList = () => {
  const { t } = useTranslation()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [contextMenuProjectId, setContextMenuProjectId] = useState<string | null>(null)
  const [toolSelectionProjectId, setToolSelectionProjectId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [preferences, setPreferences] = useState(defaultUserPreferences)
  const [itemLayouts, setItemLayouts] = useState<Record<string, ItemLayout>>({})
  const [activeDragProjectId, setActiveDragProjectId] = useState<string | null>(null)
  const [dragDestinationIndex, setDragDestinationIndex] = useState<number | null>(null)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [projectSortMode, setProjectSortMode] = useState<ProjectSortMode>('manual')
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
  const editModeRef = useRef(false)
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
  const normalizedSearchQuery = useMemo(() => searchQuery.trim().toLocaleLowerCase(), [searchQuery])
  const filteredProjects = useMemo(() => {
    if (!normalizedSearchQuery) {
      return projects
    }

    return projects.filter((project) => {
      const searchableText = `${project.name} ${project.path}`.toLocaleLowerCase()
      return searchableText.includes(normalizedSearchQuery)
    })
  }, [normalizedSearchQuery, projects])
  const displayedProjects = useMemo(() => {
    return editMode ? projects : filteredProjects
  }, [editMode, filteredProjects, projects])
  const listEmptyHasSearchState = !editMode && Boolean(normalizedSearchQuery)

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

  useEffect(() => {
    editModeRef.current = editMode
  }, [editMode])

  useEffect(() => {
    dragDestinationIndexRef.current = dragDestinationIndex
  }, [dragDestinationIndex])

  // Reload projects and preferences every time the popover becomes visible
  // This ensures CLI changes appear without a manual restart
  usePopoverFocusEffect(
    useCallback(() => {
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
    const opened = await openInEditor(project.path, resolveEditorCommand(project))
    if (!opened) {
      Alert.alert(t('invalidEditor'), t('invalidValues'))
    }
  }

  const handleOpenTerminal = async (project: Project) => {
    const opened = await openInTerminal(project.path, resolveTerminalCommand(project))
    if (!opened) {
      Alert.alert(t('invalidTerminal'), t('invalidValues'))
    }
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
    setContextMenuProjectId(null)
    setToolSelectionProjectId(null)
  }

  const handleOpenWithTerminal = async (project: Project, command: string) => {
    const opened = await openInTerminal(project.path, command)
    if (!opened) {
      Alert.alert(t('invalidTerminal'), t('invalidValues'))
      return
    }
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

  const cycleProjectSortMode = useCallback(() => {
    const nextMode: Exclude<ProjectSortMode, 'manual'> =
      projectSortMode === 'manual'
        ? 'alphaAsc'
        : projectSortMode === 'alphaAsc'
          ? 'alphaDesc'
          : projectSortMode === 'alphaDesc'
            ? 'neighborhood'
            : 'alphaAsc'

    setProjectSortMode(nextMode)
    void persistProjectOrder(sortProjectsByMode(projectsRef.current, nextMode))
  }, [persistProjectOrder, projectSortMode])

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
      if (!editModeRef.current) {
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

  const toggleEditMode = useCallback(() => {
    setEditMode((current) => {
      const next = !current

      if (next) {
        setContextMenuProjectId(null)
        setToolSelectionProjectId(null)
      } else {
        activeDragProjectIdRef.current = null
        dragDestinationIndexRef.current = null
        dragTouchOffsetWithinItemRef.current = 0
        setActiveDragProjectId(null)
        setDragDestinationIndex(null)
        setProjectSortMode('manual')
      }

      return next
    })
  }, [])

  const getDragPanResponder = useCallback((projectId: string) => {
    const cached = dragPanRespondersRef.current.get(projectId)
    if (cached) {
      return cached
    }

    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gestureState) => {
        return editModeRef.current && Math.abs(gestureState.dy) >= DRAG_ACTIVATION_DISTANCE
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
    if (!editMode || activeDragProjectId === null || dragDestinationIndex === null) {
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
  }, [activeDragProjectId, displayedProjects, dragDestinationIndex, editMode, itemLayouts, scrollOffset])

  const projectSortModeButtonIcon = useMemo(() => {
    if (projectSortMode === 'alphaAsc') {
      return 'text-outline'
    }

    if (projectSortMode === 'alphaDesc') {
      return 'text'
    }

    if (projectSortMode === 'neighborhood') {
      return 'folder-open-outline'
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

    if (projectSortMode === 'neighborhood') {
      return t('sortProjectsNeighborhood')
    }

    return t('cycleProjectSortMode')
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
            <TouchableOpacity onPress={toggleEditMode} style={styles.addButton}>
              <Text style={styles.metaButtonText}>{editMode ? t('done') : t('reorder')}</Text>
            </TouchableOpacity>
            {editMode ? (
              <TouchableOpacity
                accessibilityLabel={projectSortModeButtonLabel}
                disabled={Boolean(activeDragProjectId)}
                onPress={cycleProjectSortMode}
                style={[styles.addButton, activeDragProjectId && styles.addButtonDisabled]}
              >
                <Ionicons name={projectSortModeButtonIcon} size={16} color="var(--text-color)" />
              </TouchableOpacity>
            ) : null}
            <TouchableOpacity onPress={handleAddProject} style={styles.addButton}>
              <Ionicons name="add" size={16} color="var(--text-color)" />
            </TouchableOpacity>
          </View>
        }
      />
      <View style={[styles.searchContainer, editMode && styles.searchContainerDisabled]}>
        <Ionicons name="search-outline" size={14} color="var(--text-color)" />
        <TextInput
          value={searchQuery}
          onChangeText={editMode ? undefined : setSearchQuery}
          placeholder={t('searchProjects')}
          placeholderTextColor="#8E8E93"
          style={[styles.searchInput, editMode && styles.searchInputDisabled]}
          autoCapitalize="none"
          autoCorrect={false}
          editable={!editMode}
        />
        {searchQuery ? (
          <TouchableOpacity
            accessibilityLabel={t('clearSearch')}
            onPress={() => setSearchQuery('')}
            style={[styles.clearSearchButton, editMode && styles.clearSearchButtonDisabled]}
          >
            <Ionicons name="close-circle" size={16} color="var(--text-color)" />
          </TouchableOpacity>
        ) : null}
      </View>
      <View ref={listContainerRef} onLayout={handleListLayout} style={styles.listContainer}>
        <FlatList
          ref={listRef}
          data={displayedProjects}
          keyExtractor={(item) => item.id}
          style={{ height: FILTERED_PROJECT_LIST_HEIGHT }}
          extraData={{
            activeDragProjectId,
            contextMenuProjectId,
            dragDestinationIndex,
            editMode,
            globalEditorCommand,
            globalTerminalCommand,
            itemLayouts,
            scrollOffset,
            toolSelectionProjectId,
          }}
          scrollEnabled={!activeDragProjectId}
          onScroll={handleListScroll}
          scrollEventThrottle={16}
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
          renderItem={({ item, index }) => (
            <View ref={(node) => setProjectWrapperRef(item.id, node)} onLayout={() => handleProjectLayout(item.id)}>
              <ProjectItem
                index={index}
                project={item}
                onOpenEditor={() => handleOpenEditor(item)}
                onOpenTerminal={() => handleOpenTerminal(item)}
                onOpenFinder={() => handleOpenFinder(item)}
                onRemove={() => handleRequestRemove(item)}
                onToggleContextMenu={() => handleToggleContextMenu(item.id)}
                onCloseContextMenu={() => handleCloseContextMenu(item.id)}
                contextMenuOpen={!editMode && contextMenuProjectId === item.id}
                editorOptions={editorOptions}
                terminalOptions={terminalOptions}
                editorQuickActionOption={resolveEditorOption(item)}
                terminalQuickActionOption={resolveTerminalOption(item)}
                onOpenWithEditor={(command) => handleOpenWithEditor(item, command)}
                onOpenWithTerminal={(command) => handleOpenWithTerminal(item, command)}
                onSelectProjectEditorDefault={(command) => handleSetProjectEditorDefault(item, command)}
                onSelectProjectTerminalDefault={(command) => handleSetProjectTerminalDefault(item, command)}
                globalEditorCommand={globalEditorCommand}
                globalTerminalCommand={globalTerminalCommand}
                toolSelectionMode={!editMode && toolSelectionProjectId === item.id}
                onToggleProjectToolSelectionMode={() => handleToggleProjectToolSelectionMode(item.id)}
                labels={{
                  moreActions: t('moreActions'),
                  openWithEditor: t('openWithEditor'),
                  openWithTerminal: t('openWithTerminal'),
                  selectProjectDefaults: t('selectProjectDefaults'),
                  done: t('done'),
                  close: t('close'),
                }}
                editMode={editMode}
                dragHandleProps={getDragPanResponder(item.id).panHandlers}
                isDragging={activeDragProjectId === item.id}
              />
            </View>
          )}
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
    paddingTop: Platform.OS === 'web' ? 0 : 8,
    alignContent: 'center',
    borderColor: 'none',
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
})
