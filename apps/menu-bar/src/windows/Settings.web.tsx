import { Ionicons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import { Project } from '@tray-link/common-types'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PanResponder, StyleSheet, TouchableOpacity } from 'react-native'
import {
  installCli,
  isCliInstalled,
  openInEditor,
  openPathWithSystem,
  uninstallCli,
} from '../../modules/shell-utils/src'
import { getConfigPath } from '../../modules/storage-module/src'
import Analytics, { AnalyticsEvent } from '../analytics'
import { Divider, Row, ScrollView, Switch, Text, View } from '../components'
import Alert from '../modules/Alert'
import { Linking } from '../modules/Linking'
import { defaultUserPreferences, UserPreferences } from '../modules/Storage'
import {
  AppUpdaterState,
  checkForUpdates,
  getUpdaterState,
  installLatestUpdate,
  subscribeUpdater,
} from '../services/appUpdater'
import { logError } from '../services/errorLogger'
import { getLegacyMigrationPreview, hasLegacyMigrationCompleted, runLegacyMigration } from '../services/legacyMigration'
import {
  getEditorOptions,
  getTerminalOptions,
  initializeToolOptions,
  loadPreferences,
  persistPreferences,
  reloadToolOptions,
  subscribePreferencesChange,
} from '../services/preferences'
import { projectStore } from '../services/projectStore'
import { WindowsNavigator } from './index'

const LOCALE_OPTIONS = [
  { label: '🇺🇸 English', value: 'en' },
  { label: '🇧🇷 Portuguese', value: 'pt' },
  { label: '🇪🇸 Spanish', value: 'es' },
] as const

const REPOSITORY_URL = 'https://github.com/thejoaov/tray-link'
const RELEASES_URL = 'https://github.com/thejoaov/tray-link/releases'
const CREATOR_URL = 'https://github.com/thejoaov'

const getUpdaterStatusMessage = (updaterState: AppUpdaterState, t: ReturnType<typeof useTranslation>['t']) => {
  if (!updaterState.isSupported) {
    return t('updaterUnsupported')
  }

  switch (updaterState.status) {
    case 'checking':
      return t('updaterChecking')
    case 'upToDate':
      return t('updaterUpToDate')
    case 'available':
      return t('updaterAvailable', { version: updaterState.latestVersion ?? '' })
    case 'installing':
      return t('updaterInstalling')
    case 'installed':
      return t('updaterInstalled')
    case 'error':
      return t('updaterError', { error: updaterState.error ?? 'Unknown error' })
    case 'idle':
    default:
      return updaterState.lastCheckedAt ? t('updaterUpToDate') : t('checkForUpdates')
  }
}

export const Settings = () => {
  const { t } = useTranslation()
  const [favoriteProjects, setFavoriteProjects] = useState<Project[]>([])
  const [activeDragProjectId, setActiveDragProjectId] = useState<string | null>(null)
  const [_dragDestinationIndex, setDragDestinationIndex] = useState<number | null>(null)
  const [_scrollOffset, setScrollOffset] = useState(0)

  // biome-ignore lint/suspicious/noExplicitAny: explicit any needed for ScrollView ref
  const listRef = useRef<any>(null)
  // biome-ignore lint/suspicious/noExplicitAny: explicit any needed for container ref
  const listContainerRef = useRef<any>(null)
  // biome-ignore lint/suspicious/noExplicitAny: explicit any needed for item wrapper ref map
  const itemWrapperRefsRef = useRef(new Map<string, any>())
  const listTopInWindowRef = useRef(0)
  const listHeightRef = useRef(0)
  const dragTouchOffsetWithinItemRef = useRef(0)

  const activeDragProjectIdRef = useRef<string | null>(null)
  const dragDestinationIndexRef = useRef<number | null>(null)
  const favoriteProjectsRef = useRef<Project[]>([])
  const itemLayoutsRef = useRef<Record<string, { y: number; height: number }>>({})
  const scrollOffsetRef = useRef(0)
  const [itemLayouts, setItemLayouts] = useState<Record<string, { y: number; height: number }>>({})

  const dragPanRespondersRef = useRef(new Map<string, ReturnType<typeof PanResponder.create>>())

  useEffect(() => {
    projectStore.getProjects().then((allProjects) => {
      const favs = allProjects
        .filter((p) => p.isFavorite)
        .sort((a, b) => (a.favoritePosition ?? 0) - (b.favoritePosition ?? 0))
      setFavoriteProjects(favs)
    })
  }, [])

  useEffect(() => {
    favoriteProjectsRef.current = favoriteProjects
  }, [favoriteProjects])

  useEffect(() => {
    itemLayoutsRef.current = itemLayouts
  }, [itemLayouts])

  // biome-ignore lint/suspicious/noExplicitAny: explicit any needed for ScrollView scroll event
  const handleScroll = useCallback((event: any) => {
    const y = event.nativeEvent.contentOffset.y
    scrollOffsetRef.current = y
    setScrollOffset(y)
  }, [])

  const handleProjectLayout = useCallback((projectId: string) => {
    const itemNode = itemWrapperRefsRef.current.get(projectId)
    if (!itemNode || !listContainerRef.current) return

    listContainerRef.current.measureInWindow(
      (_listX: number, listY: number, _listWidth: number, listHeight: number) => {
        listTopInWindowRef.current = listY
        listHeightRef.current = listHeight

        itemNode.measureInWindow((_itemX: number, itemY: number, _itemWidth: number, itemHeight: number) => {
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
      },
    )
  }, [])

  // biome-ignore lint/suspicious/noExplicitAny: explicit any needed for View ref node
  const setProjectWrapperRef = useCallback((projectId: string, node: any) => {
    if (node) {
      itemWrapperRefsRef.current.set(projectId, node)
    } else {
      itemWrapperRefsRef.current.delete(projectId)
    }
  }, [])

  const getDragPanResponder = useCallback((projectId: string) => {
    const cached = dragPanRespondersRef.current.get(projectId)
    if (cached) {
      return cached
    }

    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_event, gestureState) => {
        return Math.abs(gestureState.dy) >= 6
      },
      onPanResponderGrant: (_event, gestureState) => {
        if (listContainerRef.current) {
          listContainerRef.current.measureInWindow(
            (_listX: number, listY: number, _listWidth: number, listHeight: number) => {
              listTopInWindowRef.current = listY
              listHeightRef.current = listHeight
            },
          )
        }

        const layout = itemLayoutsRef.current[projectId]
        if (!layout) return

        const pointerContentY =
          (gestureState.moveY || gestureState.y0) - listTopInWindowRef.current + scrollOffsetRef.current
        dragTouchOffsetWithinItemRef.current = Math.min(Math.max(pointerContentY - layout.y, 0), layout.height)
        activeDragProjectIdRef.current = projectId
        setActiveDragProjectId(projectId)

        const currentIndex = favoriteProjectsRef.current.findIndex((p) => p.id === projectId)
        dragDestinationIndexRef.current = currentIndex >= 0 ? currentIndex : null
        setDragDestinationIndex(currentIndex >= 0 ? currentIndex : null)
      },
      onPanResponderMove: (_event, gestureState) => {
        const activeId = activeDragProjectIdRef.current
        if (!activeId) return

        const pointerContentY = gestureState.moveY - listTopInWindowRef.current + scrollOffsetRef.current
        const activeLayout = itemLayoutsRef.current[projectId]
        if (!activeLayout) return

        const draggedCenterY = pointerContentY - dragTouchOffsetWithinItemRef.current + activeLayout.height / 2

        const candidateProjects = favoriteProjectsRef.current.filter((p) => p.id !== projectId)
        let insertionIndex = candidateProjects.length

        for (let index = 0; index < candidateProjects.length; index += 1) {
          const layout = itemLayoutsRef.current[candidateProjects[index].id]
          if (!layout) continue

          if (draggedCenterY < layout.y + layout.height / 2) {
            insertionIndex = index
            break
          }
        }

        const nextDestinationIndex = Math.min(
          Math.max(insertionIndex, 0),
          Math.max(favoriteProjectsRef.current.length - 1, 0),
        )
        if (dragDestinationIndexRef.current !== nextDestinationIndex) {
          dragDestinationIndexRef.current = nextDestinationIndex
          setDragDestinationIndex(nextDestinationIndex)
        }
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderRelease: () => {
        const activeId = activeDragProjectIdRef.current
        if (!activeId) return

        const currentIndex = favoriteProjectsRef.current.findIndex((p) => p.id === activeId)
        const destinationIndex = dragDestinationIndexRef.current

        activeDragProjectIdRef.current = null
        dragDestinationIndexRef.current = null
        dragTouchOffsetWithinItemRef.current = 0
        setActiveDragProjectId(null)
        setDragDestinationIndex(null)

        if (currentIndex < 0 || destinationIndex === null || destinationIndex === currentIndex) {
          return
        }

        const reordered = [...favoriteProjectsRef.current]
        const [moved] = reordered.splice(currentIndex, 1)
        reordered.splice(destinationIndex, 0, moved)
        setFavoriteProjects(reordered)
      },
      onPanResponderTerminate: () => {
        activeDragProjectIdRef.current = null
        dragDestinationIndexRef.current = null
        dragTouchOffsetWithinItemRef.current = 0
        setActiveDragProjectId(null)
        setDragDestinationIndex(null)
      },
    })

    dragPanRespondersRef.current.set(projectId, responder)
    return responder
  }, [])

  const handleSaveFavoritesOrder = async () => {
    try {
      const allProjects = await projectStore.getProjects()

      const updated = allProjects.map((p) => {
        const favIndex = favoriteProjects.findIndex((fp) => fp.id === p.id)
        if (favIndex >= 0) {
          return {
            ...p,
            isFavorite: true,
            favoritePosition: favIndex,
            updatedAt: new Date().toISOString(),
          }
        }
        return p
      })

      await projectStore.saveProjects(updated)

      Alert.alert(t('settings'), t('confirm') + '!')
    } catch (error) {
      console.error('Error saving favorites order:', error)
      await logError('settings:handleSaveFavoritesOrder', error)
    }
  }
  const [preferences, setPreferences] = useState<UserPreferences>(defaultUserPreferences)
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const [reloadingTools, setReloadingTools] = useState(false)
  const [toolsVersion, setToolsVersion] = useState(0)
  const [toolsReady, setToolsReady] = useState(false)
  const [migratingLegacyData, setMigratingLegacyData] = useState(false)
  const [legacyMigrationDone, setLegacyMigrationDone] = useState(false)
  const [legacyProjectsPreviewCount, setLegacyProjectsPreviewCount] = useState(0)
  const [cliInstalled, setCliInstalled] = useState(false)
  const [installingCli, setInstallingCli] = useState(false)
  const [uninstallingCli, setUninstallingCli] = useState(false)
  const [updaterState, setUpdaterState] = useState<AppUpdaterState>(getUpdaterState())

  const editorOptions = useMemo(
    () => getEditorOptions(preferences.customEditors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preferences.customEditors, toolsVersion],
  )

  const terminalOptions = useMemo(
    () => getTerminalOptions(preferences.customTerminals),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preferences.customTerminals, toolsVersion],
  )

  const normalizePreferences = (next: UserPreferences): UserPreferences => {
    if (next.removeFromDiskByDefault) {
      return { ...next, requireProjectDeletionConfirmation: true }
    }

    return next
  }

  const updatePreference = async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const next = normalizePreferences({ ...preferences, [key]: value })
    setPreferences(next)
    await persistPreferences(next)
  }

  useEffect(() => {
    // Load preferences asynchronously on mount
    loadPreferences()
      .then((loadedPreferences) => {
        const normalizedPreferences = normalizePreferences(loadedPreferences)
        setPreferences(normalizedPreferences)
        setPreferencesLoaded(true)
        if (
          normalizedPreferences.requireProjectDeletionConfirmation !==
          loadedPreferences.requireProjectDeletionConfirmation
        ) {
          persistPreferences(normalizedPreferences).catch((error) => {
            Analytics.track(AnalyticsEvent.ERROR, { error: String(error) })
          })
        }
      })
      .catch((e) => {
        Analytics.track(AnalyticsEvent.ERROR, { error: String(e) })
      })

    const subscription = subscribePreferencesChange(() => {
      loadPreferences()
        .then((loadedPreferences) => {
          const normalizedPreferences = normalizePreferences(loadedPreferences)
          setPreferences(normalizedPreferences)
          setPreferencesLoaded(true)
          if (
            normalizedPreferences.requireProjectDeletionConfirmation !==
            loadedPreferences.requireProjectDeletionConfirmation
          ) {
            persistPreferences(normalizedPreferences).catch((error) => {
              Analytics.track(AnalyticsEvent.ERROR, { error: String(error) })
            })
          }
        })
        .catch((e) => {
          Analytics.track(AnalyticsEvent.ERROR, { error: String(e) })
        })
      setToolsVersion((v) => v + 1)
    })

    // Check legacy migration status
    hasLegacyMigrationCompleted()
      .then(setLegacyMigrationDone)
      .catch((e) => {
        Analytics.track(AnalyticsEvent.ERROR, { error: String(e) })
      })

    // Discover tools on mount (needed because Settings runs in a separate BrowserWindow)
    initializeToolOptions()
      .then(() => {
        setToolsVersion((v) => v + 1)
        setToolsReady(true)
      })
      .catch(() => {
        // Force a version bump even on error so the UI reflects whatever was discovered
        setToolsVersion((v) => v + 1)
        setToolsReady(true)
      })

    // Check CLI install status
    isCliInstalled()
      .then(setCliInstalled)
      .catch(() => setCliInstalled(false))

    const updaterSubscription = subscribeUpdater(setUpdaterState)

    return () => {
      subscription.remove()
      updaterSubscription.remove()
    }
  }, [])

  useEffect(() => {
    getLegacyMigrationPreview()
      .then((preview) => {
        setLegacyProjectsPreviewCount(preview?.projectsCount ?? 0)
      })
      .catch(() => {
        setLegacyProjectsPreviewCount(0)
      })
  }, [legacyMigrationDone])

  useEffect(() => {
    if (!preferencesLoaded || preferences.hasInstalledCli || !cliInstalled) {
      return
    }

    const next = { ...preferences, hasInstalledCli: true }
    setPreferences(next)
    persistPreferences(next).catch((error) => {
      Analytics.track(AnalyticsEvent.ERROR, { error: String(error) })
    })
  }, [cliInstalled, preferences, preferencesLoaded])

  const updaterStatusMessage = getUpdaterStatusMessage(updaterState, t)
  const isCheckingUpdates = updaterState.status === 'checking'
  const isInstallingUpdate = updaterState.status === 'installing' || updaterState.status === 'installed'
  const canInstallUpdate =
    updaterState.isSupported && updaterState.status === 'available' && Boolean(updaterState.downloadUrl)
  const deletionConfirmationLocked = preferences.removeFromDiskByDefault

  const handleOpenConfigFile = async () => {
    try {
      const configPath = await getConfigPath()
      const opened = preferences.defaultEditor
        ? (await openInEditor(configPath, preferences.defaultEditor)) || (await openPathWithSystem(configPath))
        : await openPathWithSystem(configPath)

      if (!opened) {
        Alert.alert(t('settings'), t('openConfigFileFailed'))
      }
    } catch (error) {
      Analytics.track(AnalyticsEvent.ERROR, { error: String(error) })
      Alert.alert(t('settings'), t('openConfigFileFailed'))
    }
  }

  const handleInstallCli = async () => {
    setInstallingCli(true)
    try {
      const result = await installCli()
      if (!result.success) {
        Alert.alert(t('cli'), t('cliInstallError', { error: result.error ?? 'Unknown error' }))
        return
      }

      setCliInstalled(true)
      if (!preferences.hasInstalledCli) {
        const next = { ...preferences, hasInstalledCli: true }
        setPreferences(next)
        await persistPreferences(next)
      }
    } finally {
      setInstallingCli(false)
    }
  }

  const handleUninstallCli = async () => {
    setUninstallingCli(true)
    try {
      const result = await uninstallCli()
      if (!result.success) {
        Alert.alert(t('cli'), t('cliUninstallError', { error: result.error ?? 'Unknown error' }))
        return
      }

      if (result.managedByHomebrew || result.removed === false) {
        setCliInstalled(true)
        Alert.alert(t('cli'), t('cliManagedByHomebrew'))
        return
      }

      setCliInstalled(false)
      if (preferences.hasInstalledCli) {
        const next = { ...preferences, hasInstalledCli: false }
        setPreferences(next)
        await persistPreferences(next)
      }
    } finally {
      setUninstallingCli(false)
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView
        ref={listRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={!activeDragProjectId}
        contentContainerStyle={styles.scrollContent}
        indicatorStyle="black"
      >
        <Text style={styles.sectionTitle}>{t('settings')}</Text>

        <View border="light" rounded="medium" style={styles.box}>
          <Row align="center" justify="between" style={styles.boxItem}>
            <Text style={styles.itemLabel}>{t('language')}</Text>

            <Picker
              selectedValue={preferences.locale}
              onValueChange={(value) => updatePreference('locale', value)}
              style={styles.picker}
            >
              {LOCALE_OPTIONS.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </Row>

          <Divider />

          <Row align="center" justify="between" style={styles.boxItem}>
            <Text style={styles.itemLabel}>{t('listGrouping')}</Text>

            <Picker
              selectedValue={preferences.groupingMode ?? 'none'}
              onValueChange={(value) => updatePreference('groupingMode', value)}
              style={styles.picker}
            >
              <Picker.Item label={t('groupNone')} value="none" />
              <Picker.Item label={t('groupTag')} value="tag" />
              <Picker.Item label={t('groupParentFolder')} value="parentFolder" />
              <Picker.Item label={t('groupAlphabetical')} value="alphabetical" />
            </Picker>
          </Row>

          <Divider />

          <Row align="center" justify="between" style={styles.boxItem}>
            <Text style={styles.itemLabel}>{t('defaultEditor')}</Text>
            <Row align="center" style={styles.controlRow}>
              <Picker
                selectedValue={preferences.defaultEditor}
                onValueChange={(value) => {
                  if (!toolsReady) return
                  updatePreference('defaultEditor', value)
                }}
                enabled={toolsReady}
                style={styles.picker}
              >
                <Picker.Item label={t('systemDefault')} value={null} />
                {editorOptions.map((option) => (
                  <Picker.Item key={option.command} label={option.label} value={option.command} />
                ))}
              </Picker>

              <TouchableOpacity
                accessibilityLabel={t('addCustomEditor')}
                onPress={() => WindowsNavigator.open('CustomEditorWindow')}
                style={styles.iconButton}
              >
                <Ionicons name="add" size={16} color="var(--text-color)" />
              </TouchableOpacity>
            </Row>
          </Row>

          <Divider />

          <Row align="center" justify="between" style={styles.boxItem}>
            <Text style={styles.itemLabel}>{t('defaultTerminal')}</Text>
            <Row align="center" style={styles.controlRow}>
              <Picker
                selectedValue={preferences.defaultTerminal}
                onValueChange={(value) => {
                  if (!toolsReady) return
                  updatePreference('defaultTerminal', value)
                }}
                enabled={toolsReady}
                style={styles.picker}
              >
                <Picker.Item label={t('systemDefault')} value={null} />
                {terminalOptions.map((option) => (
                  <Picker.Item key={option.command} label={option.label} value={option.command} />
                ))}
              </Picker>
              <TouchableOpacity
                accessibilityLabel={t('addCustomTerminal')}
                onPress={() => WindowsNavigator.open('CustomTerminalWindow')}
                style={styles.iconButton}
              >
                <Ionicons name="add" size={16} color="var(--text-color)" />
              </TouchableOpacity>
            </Row>
          </Row>

          <Divider />

          <Row align="center" justify="between" style={styles.boxItem}>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemLabel}>{t('openConfigFile')}</Text>
              <Text style={styles.itemDescription}>{t('openConfigFileDescription')}</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel={t('openConfigFile')}
              onPress={handleOpenConfigFile}
              style={styles.button}
            >
              <Ionicons name="document-text-outline" size={14} color="var(--text-color)" />
              <Text style={styles.buttonText}>{t('openConfigFile')}</Text>
            </TouchableOpacity>
          </Row>

          <Divider />

          <Row align="center" justify="between" style={styles.boxItem}>
            <Text style={styles.itemLabel}>{t('openOnStartup')}</Text>
            <Switch
              value={preferences.launchOnLogin}
              onValueChange={(value) => updatePreference('launchOnLogin', value)}
            />
          </Row>

          <Divider />

          <Row align="center" justify="between" style={styles.boxItem}>
            <Text style={styles.itemLabel}>{t('showAppIcons')}</Text>
            <Switch
              value={preferences.showAppIcons}
              onValueChange={(value) => updatePreference('showAppIcons', value)}
            />
          </Row>

          <Divider />

          <Row align="center" justify="between" style={styles.boxItem}>
            <Text style={styles.itemLabel}>{t('deleteFilesFromDiskByDefault')}</Text>
            <Switch
              value={preferences.removeFromDiskByDefault}
              onValueChange={(value) => updatePreference('removeFromDiskByDefault', value)}
            />
          </Row>

          <Divider />

          <Row align="center" justify="between" style={styles.boxItem}>
            <Text style={styles.itemLabel}>{t('requireProjectDeletionConfirmation')}</Text>
            <Switch
              value={preferences.requireProjectDeletionConfirmation}
              disabled={deletionConfirmationLocked}
              onValueChange={(value) => updatePreference('requireProjectDeletionConfirmation', value)}
            />
          </Row>
        </View>

        {favoriteProjects.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>{t('favorites')}</Text>
            <Text style={styles.sectionSubtitle}>{t('favoritesDescription')}</Text>

            <View
              ref={listContainerRef}
              onLayout={() => {
                if (listContainerRef.current) {
                  listContainerRef.current.measureInWindow(
                    (_listX: number, listY: number, _listWidth: number, listHeight: number) => {
                      listTopInWindowRef.current = listY
                      listHeightRef.current = listHeight
                    },
                  )
                }
              }}
              border="light"
              rounded="medium"
              style={styles.box}
            >
              {favoriteProjects.map((project, index) => (
                <React.Fragment key={project.id}>
                  {index > 0 ? <Divider /> : null}
                  <View
                    ref={(node) => setProjectWrapperRef(project.id, node)}
                    onLayout={() => handleProjectLayout(project.id)}
                    style={[styles.favItemRow, activeDragProjectId === project.id && styles.draggingItemRow]}
                  >
                    <Row align="center" justify="between" style={styles.boxItem}>
                      <View style={styles.itemTextContainer}>
                        <Text style={styles.favItemName}>
                          {index + 1}. {project.name}
                        </Text>
                        <Text style={styles.favItemPath} numberOfLines={1} ellipsizeMode="middle">
                          {project.path}
                        </Text>
                      </View>
                      <View style={styles.dragHandle} {...getDragPanResponder(project.id).panHandlers}>
                        <Ionicons name="reorder-three-outline" size={20} color="var(--text-color)" />
                      </View>
                    </Row>
                  </View>
                </React.Fragment>
              ))}
            </View>

            <TouchableOpacity
              accessibilityLabel={t('save')}
              style={styles.saveButton}
              onPress={handleSaveFavoritesOrder}
            >
              <Ionicons name="save-outline" size={14} color="#FFF" />
              <Text style={styles.saveButtonText}>{t('save')}</Text>
            </TouchableOpacity>
          </>
        ) : null}

        <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>{t('cli')}</Text>

        <View border="light" rounded="medium" style={styles.box}>
          <Row align="center" justify="between" style={styles.boxItem}>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemLabel}>{t(preferences.hasInstalledCli ? 'reinstallCli' : 'installCli')} CLI</Text>
              <Text style={styles.itemDescription}>{cliInstalled ? t('cliInstalled') : t('cliNotInstalled')}</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel={t(preferences.hasInstalledCli ? 'reinstallCli' : 'installCli')}
              disabled={installingCli || uninstallingCli}
              onPress={handleInstallCli}
              style={[styles.button, (installingCli || uninstallingCli) && styles.buttonDisabled]}
            >
              <Ionicons name="terminal-outline" size={14} color="var(--text-color)" />
              <Text style={styles.buttonText}>{t(preferences.hasInstalledCli ? 'reinstallCli' : 'installCli')}</Text>
            </TouchableOpacity>
          </Row>

          <Divider />

          <Row align="center" justify="between" style={styles.boxItem}>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemLabel}>{t('uninstallCli')} CLI</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel={t('uninstallCli')}
              disabled={!cliInstalled || installingCli || uninstallingCli}
              onPress={handleUninstallCli}
              style={[styles.button, (!cliInstalled || installingCli || uninstallingCli) && styles.buttonDisabled]}
            >
              <Ionicons name="trash-outline" size={14} color="var(--text-color)" />
              <Text style={styles.buttonText}>{t('uninstallCli')}</Text>
            </TouchableOpacity>
          </Row>
        </View>

        <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>{t('updates')}</Text>

        <View border="light" rounded="medium" style={styles.box}>
          <Row align="center" justify="between" style={styles.boxItem}>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemLabel}>{t('currentVersion')}</Text>
              <Text style={styles.itemDescription}>{updaterState.currentVersion}</Text>
            </View>
          </Row>

          <Divider />

          <Row align="center" justify="between" style={styles.boxItem}>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemLabel}>{t('latestVersion')}</Text>
              <Text style={styles.itemDescription}>{updaterState.latestVersion ?? '—'}</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel={t('viewReleaseNotes')}
              disabled={!updaterState.releasePageUrl}
              onPress={() => Linking.openURL(updaterState.releasePageUrl ?? RELEASES_URL)}
              style={[styles.button, !updaterState.releasePageUrl && styles.buttonDisabled]}
            >
              <Ionicons name="open-outline" size={14} color="var(--text-color)" />
              <Text style={styles.buttonText}>{t('viewReleaseNotes')}</Text>
            </TouchableOpacity>
          </Row>

          <Divider />

          <View style={styles.boxItem}>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemLabel}>{t('updates')}</Text>
              <Text style={styles.itemDescription}>{updaterStatusMessage}</Text>
            </View>
            <View style={styles.updaterActionsRow}>
              <TouchableOpacity
                accessibilityLabel={t('checkForUpdates')}
                disabled={isCheckingUpdates || isInstallingUpdate}
                onPress={async () => {
                  try {
                    await checkForUpdates()
                  } catch (error) {
                    Analytics.track(AnalyticsEvent.ERROR, { error: String(error) })
                  }
                }}
                style={[styles.button, (isCheckingUpdates || isInstallingUpdate) && styles.buttonDisabled]}
              >
                <Ionicons name="refresh" size={14} color="var(--text-color)" />
                <Text style={styles.buttonText}>{t('checkForUpdates')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                accessibilityLabel={t('installUpdate')}
                disabled={!canInstallUpdate || isInstallingUpdate}
                onPress={async () => {
                  try {
                    await installLatestUpdate()
                  } catch (error) {
                    Analytics.track(AnalyticsEvent.ERROR, { error: String(error) })
                  }
                }}
                style={[styles.button, (!canInstallUpdate || isInstallingUpdate) && styles.buttonDisabled]}
              >
                <Ionicons name="download-outline" size={14} color="var(--text-color)" />
                <Text style={styles.buttonText}>{t('installUpdate')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>{t('advanced') || 'Advanced'}</Text>

        <View border="light" rounded="medium" style={styles.box}>
          <Row align="center" justify="between" style={styles.boxItem}>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemLabel}>{t('reloadToolList') || 'Reload tool list'}</Text>
            </View>
            <TouchableOpacity
              accessibilityLabel={t('reloadToolList')}
              disabled={reloadingTools}
              onPress={async () => {
                setReloadingTools(true)
                try {
                  await reloadToolOptions()
                } finally {
                  setToolsVersion((v) => v + 1)
                  setToolsReady(true)
                  setReloadingTools(false)
                }
              }}
              style={[styles.button, reloadingTools && styles.buttonDisabled]}
            >
              <Ionicons name="refresh" size={14} color="var(--text-color)" />
              <Text style={styles.buttonText}>{t('reload')}</Text>
            </TouchableOpacity>
          </Row>

          <Divider />

          <Row align="center" justify="between" style={styles.boxItem}>
            <View style={styles.itemTextContainer}>
              <Text style={styles.itemLabel}>{t('migrateLegacyData')}</Text>
              <Text style={styles.itemDescription}>
                {legacyProjectsPreviewCount > 0
                  ? t('migrationPreviewFound', {
                      projects: String(legacyProjectsPreviewCount),
                    })
                  : t('migrationPreviewNone')}
              </Text>
            </View>
            <TouchableOpacity
              accessibilityLabel={t('migrateLegacyData')}
              disabled={legacyMigrationDone || migratingLegacyData}
              onPress={async () => {
                setMigratingLegacyData(true)
                try {
                  const migrated = await runLegacyMigration()
                  const done = await hasLegacyMigrationCompleted()
                  if (migrated || done) {
                    setLegacyMigrationDone(true)
                    setLegacyProjectsPreviewCount(0)
                  }
                } finally {
                  setMigratingLegacyData(false)
                }
              }}
              style={[styles.button, (legacyMigrationDone || migratingLegacyData) && styles.buttonDisabled]}
            >
              <Ionicons name="download-outline" size={14} color="var(--text-color)" />
              <Text style={styles.buttonText}>{t('migrate') || 'Migrate'}</Text>
            </TouchableOpacity>
          </Row>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            accessibilityLabel="Open tray-link repository"
            onPress={() => Linking.openURL(REPOSITORY_URL)}
          >
            <Text style={styles.footerLink}>github.com/thejoaov/tray-link</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Open creator GitHub profile"
            onPress={() => Linking.openURL(CREATOR_URL)}
          >
            <Text style={styles.footerSubtle}>Created by @thejoaov</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityLabel="Open releases page"
            onPress={() => Linking.openURL(RELEASES_URL)}
            style={styles.releaseButton}
          >
            <Ionicons name="rocket-outline" size={14} color="var(--text-color)" />
            <Text style={styles.releaseButtonText}>Releases</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minHeight: 0,
    maxHeight: '100%',
  },
  scrollView: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionTitleMargin: {
    marginTop: 20,
  },
  box: {
    overflow: 'hidden',
    backgroundColor: 'rgba(150, 150, 150, 0.05)',
  },
  boxItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemTextContainer: {
    flex: 1,
    minWidth: 0,
    paddingRight: 16,
    justifyContent: 'center',
  },
  itemLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  itemDescription: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 4,
  },
  controlRow: {
    gap: 8,
  },
  picker: {
    borderWidth: 0,
    borderRadius: 6,
    width: 160,
    height: 28,
    color: 'var(--text-color)',
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  iconButton: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  updaterActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  footer: {
    marginTop: 20,
    paddingTop: 14,
    alignItems: 'center',
    gap: 4,
  },
  footerLink: {
    fontSize: 12,
    fontWeight: '600',
    textDecorationLine: 'underline',
    opacity: 0.9,
  },
  footerSubtle: {
    fontSize: 11,
    opacity: 0.65,
  },
  releaseButton: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: 'rgba(150, 150, 150, 0.1)',
  },
  releaseButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: 'var(--text-color)',
    opacity: 0.6,
    marginBottom: 12,
    marginLeft: 4,
  },
  favItemRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  draggingItemRow: {
    backgroundColor: 'rgba(125, 211, 252, 0.12)',
    borderColor: 'rgba(125, 211, 252, 0.8)',
    borderWidth: 1,
    borderRadius: 8,
    zIndex: 999,
  },
  favItemName: {
    fontSize: 13,
    fontWeight: '600',
    color: 'var(--text-color)',
  },
  favItemPath: {
    fontSize: 11,
    opacity: 0.6,
    color: 'var(--text-color)',
    marginTop: 2,
  },
  dragHandle: {
    padding: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
})
