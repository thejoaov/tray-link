import { Ionicons } from '@expo/vector-icons'
import { Project } from '@tray-link/common-types'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { pickFolder } from '../../modules/file-picker'
import { openInEditor, openInFinder, openInTerminal, removeFromDisk } from '../../modules/shell-utils/src'
import Alert from '../modules/Alert'
import {
  getEditorOptions,
  getTerminalOptions,
  loadPreferences,
  subscribePreferencesChange,
} from '../services/preferences'
import { projectStore } from '../services/projectStore'
import { setPendingProjectRemove, subscribeProjectRemoveConfirm } from '../services/removeProjectDialog'
import { WindowsNavigator } from '../windows'
import Footer from './Footer'
import { ProjectItem } from './ProjectItem'
import SectionHeader from './SectionHeader'

const MAX_LIST_HEIGHT = Dimensions.get('screen').height * 0.7

export const ProjectList = () => {
  const { t } = useTranslation()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [contextMenuProjectId, setContextMenuProjectId] = useState<string | null>(null)
  const [preferences, setPreferences] = useState(() => loadPreferences())
  const editorOptions = getEditorOptions(preferences.customEditors)
  const terminalOptions = getTerminalOptions(preferences.customTerminals)

  useEffect(() => {
    loadProjects()

    const preferencesSubscription = subscribePreferencesChange(() => {
      setPreferences(loadPreferences())
    })

    const removeSubscription = subscribeProjectRemoveConfirm(async (payload) => {
      if (payload.deleteFromDisk) {
        const removed = await removeFromDisk(payload.path)
        if (!removed) {
          Alert.alert(t('deleteFailed'), t('couldNotDeleteFromDisk', { path: payload.path }))
          return
        }
      }

      await projectStore.removeProject(payload.id)
      await loadProjects()
    })

    return () => {
      preferencesSubscription.remove()
      removeSubscription.remove()
    }
  }, [])

  const loadProjects = async () => {
    try {
      const data = await projectStore.getProjects()
      setProjects(data.sort((a, b) => a.position - b.position))
    } catch (e) {
      console.error(e)
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
        }
        await projectStore.addProject(newProject)
        await loadProjects()
      }
    } catch (e) {
      console.error('Error adding project:', e)
    }
  }

  const handleOpenEditor = async (project: Project) => {
    const fallback = editorOptions[0]?.command ?? 'code'
    const opened = await openInEditor(project.path, preferences.defaultEditor ?? fallback)
    if (!opened) {
      Alert.alert(t('invalidEditor'), t('invalidValues'))
    }
  }

  const handleOpenTerminal = async (project: Project) => {
    const fallback = terminalOptions[0]?.command ?? 'open -a Terminal'
    const opened = await openInTerminal(project.path, preferences.defaultTerminal ?? fallback)
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
  }

  const handleOpenWithTerminal = async (project: Project, command: string) => {
    const opened = await openInTerminal(project.path, command)
    if (!opened) {
      Alert.alert(t('invalidTerminal'), t('invalidValues'))
      return
    }
    setContextMenuProjectId(null)
  }

  const handleMoveProject = async (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= projects.length) return

    const reordered = [...projects]
    ;[reordered[index], reordered[target]] = [reordered[target], reordered[index]]
    await projectStore.saveProjectOrder(reordered)
    setProjects(reordered.map((project, position) => ({ ...project, position })))
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

  const getListHeight = useMemo(() => {
    const height = projects.length * 120
    return height > MAX_LIST_HEIGHT ? MAX_LIST_HEIGHT : height
  }, [projects])

  if (loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text>{t('loading')}</Text>
      </View>
    )
  }

  return (
    <>
      <SectionHeader
        label={t('projects')}
        accessoryRight={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setEditMode((value) => !value)} style={styles.addButton}>
              <Text style={styles.metaButtonText}>{editMode ? t('done') : t('reorder')}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddProject} style={styles.addButton}>
              <Ionicons name="add" size={16} />
            </TouchableOpacity>
          </View>
        }
      />
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        style={{ height: getListHeight }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>{t('noProjectsYet')}</Text>
            <Text style={styles.emptySubtext}>{t('clickToAddProject')}</Text>
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
            onToggleContextMenu={() => setContextMenuProjectId((value) => (value === item.id ? null : item.id))}
            contextMenuOpen={contextMenuProjectId === item.id}
            editorOptions={editorOptions}
            terminalOptions={terminalOptions}
            onOpenWithEditor={(command) => handleOpenWithEditor(item, command)}
            onOpenWithTerminal={(command) => handleOpenWithTerminal(item, command)}
            labels={{
              moreActions: t('moreActions'),
              openWithEditor: t('openWithEditor'),
              openWithTerminal: t('openWithTerminal'),
            }}
            editMode={editMode}
            onMoveUp={() => handleMoveProject(index, 'up')}
            onMoveDown={() => handleMoveProject(index, 'down')}
            canMoveUp={index > 0}
            canMoveDown={index < projects.length - 1}
          />
        )}
      />
      <Footer />
    </>
  )
}

const styles = StyleSheet.create({
  addButton: {
    paddingHorizontal: 8,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaButtonText: {
    fontSize: 10,
    fontWeight: '700',
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
  },
  emptySubtext: {
    fontSize: 12,
    opacity: 0.7,
  },
})
