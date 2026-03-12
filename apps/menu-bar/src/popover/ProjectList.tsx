/** biome-ignore-all lint/suspicious/noEmptyBlockStatements: Fail silently if loading preferences on popover focus fails for any reason, to avoid breaking other popover functionality */
import { Ionicons } from '@expo/vector-icons'
import { Project } from '@tray-link/common-types'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { pickFolder } from '../../modules/file-picker'
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

export const ProjectList = () => {
  const { t } = useTranslation()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [contextMenuProjectId, setContextMenuProjectId] = useState<string | null>(null)
  const [toolSelectionProjectId, setToolSelectionProjectId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [preferences, setPreferences] = useState(defaultUserPreferences)
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

  useEffect(() => {
    loadProjects()
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
        if (payload.deleteFromDisk) {
          const removed = await removeFromDisk(payload.path)
          if (!removed) {
            Alert.alert(t('deleteFailed'), t('couldNotDeleteFromDisk', { path: payload.path }))
            return
          }
        }

        await projectStore.removeProject(payload.id)
        await loadProjects()
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
  }, [])

  // Reload projects and preferences every time the popover becomes visible
  // This ensures CLI changes appear without a manual restart
  usePopoverFocusEffect(
    useCallback(() => {
      loadProjects()
      loadPreferences()
        .then(setPreferences)
        .catch((error) => {
          void logError('project-list:focus-loadPreferences', error)
        })
    }, []),
  )

  const loadProjects = async () => {
    try {
      const data = await projectStore.getProjects()
      setProjects(data.sort((a, b) => a.position - b.position))
    } catch (error) {
      console.error(error)
      await logError('project-list:loadProjects', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddProject = async () => {
    try {
      const folderPath = await pickFolder()
      if (folderPath) {
        const now = new Date().toISOString()
        const newProject: Project = {
          id: Date.now().toString(),
          name: folderPath.split('/').pop() || 'New Project',
          path: folderPath,
          position: projects.length,
          createdAt: now,
          updatedAt: now,
          isFavorite: false,
          defaultEditor: null,
          defaultTerminal: null,
        }
        await projectStore.addProject(newProject)
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
    return project.defaultEditor ?? preferences.defaultEditor ?? editorOptions[0]?.command ?? 'code'
  }

  const resolveTerminalCommand = (project: Project) => {
    return project.defaultTerminal ?? preferences.defaultTerminal ?? terminalOptions[0]?.command ?? 'open -a Terminal'
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
      setToolSelectionProjectId(null)
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
      setToolSelectionProjectId(null)
    } catch (error) {
      await logError('project-list:handleSetProjectTerminalDefault', error, {
        projectId: project.id,
        command,
      })
    }
  }

  const handleMoveProject = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= projects.length) return

    const reordered = [...projects]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    await projectStore.saveProjectOrder(reordered)
    setProjects(reordered.map((project, position) => ({ ...project, position })))
  }

  const handleMoveFilteredProject = async (projectId: string, direction: 'up' | 'down') => {
    const index = projects.findIndex((project) => project.id === projectId)
    if (index < 0) return
    await handleMoveProject(index, direction)
  }

  const handleRequestRemove = (project: Project) => {
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

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text>{t('loading')}</Text>
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
            <TouchableOpacity onPress={() => setEditMode((value) => !value)} style={styles.addButton}>
              <Text style={styles.metaButtonText}>{editMode ? t('done') : t('reorder')}</Text>
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
      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => item.id}
        style={{ height: FILTERED_PROJECT_LIST_HEIGHT }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{normalizedSearchQuery ? t('noProjectsFound') : t('noProjectsYet')}</Text>
            <Text style={styles.emptySubtext}>
              {normalizedSearchQuery ? t('adjustSearchOrAddProject') : t('clickToAddProject')}
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <ProjectItem
            index={index}
            project={item}
            onOpenEditor={() => handleOpenEditor(item)}
            onOpenTerminal={() => handleOpenTerminal(item)}
            onOpenFinder={() => handleOpenFinder(item)}
            onRemove={() => handleRequestRemove(item)}
            onToggleContextMenu={() => handleToggleContextMenu(item.id)}
            contextMenuOpen={contextMenuProjectId === item.id}
            editorOptions={editorOptions}
            terminalOptions={terminalOptions}
            editorQuickActionOption={resolveEditorOption(item)}
            terminalQuickActionOption={resolveTerminalOption(item)}
            onOpenWithEditor={(command) => handleOpenWithEditor(item, command)}
            onOpenWithTerminal={(command) => handleOpenWithTerminal(item, command)}
            onSelectProjectEditorDefault={(command) => handleSetProjectEditorDefault(item, command)}
            onSelectProjectTerminalDefault={(command) => handleSetProjectTerminalDefault(item, command)}
            toolSelectionMode={toolSelectionProjectId === item.id}
            onToggleProjectToolSelectionMode={() => handleToggleProjectToolSelectionMode(item.id)}
            labels={{
              moreActions: t('moreActions'),
              openWithEditor: t('openWithEditor'),
              openWithTerminal: t('openWithTerminal'),
              selectProjectDefaults: t('selectProjectDefaults'),
              done: t('done'),
            }}
            editMode={editMode}
            onMoveUp={() => handleMoveFilteredProject(item.id, 'up')}
            onMoveDown={() => handleMoveFilteredProject(item.id, 'down')}
            canMoveUp={projects.findIndex((project) => project.id === item.id) > 0}
            canMoveDown={projects.findIndex((project) => project.id === item.id) < projects.length - 1}
          />
        )}
      />

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
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 13,
    color: 'var(--text-color)',
    paddingVertical: 0,
    alignContent: 'center',
    borderColor: 'none',
    borderWidth: 0,
  },
  clearSearchButton: {
    alignItems: 'center',
    justifyContent: 'center',
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
