import { Ionicons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity } from 'react-native'
import { installCli, isCliInstalled, uninstallCli } from '../../modules/shell-utils/src'
import Analytics, { AnalyticsEvent } from '../analytics'
import { Checkbox, Divider, Row, Text, View } from '../components'
import { Linking } from '../modules/Linking'
import { defaultUserPreferences, UserPreferences } from '../modules/Storage'
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
import { WindowsNavigator } from './index'

const LOCALE_OPTIONS = [
  { label: '🇺🇸 English', value: 'en' },
  { label: '🇧🇷 Portuguese', value: 'pt' },
  { label: '🇪🇸 Spanish', value: 'es' },
] as const

const REPOSITORY_URL = 'https://github.com/thejoaov/tray-link'
const RELEASES_URL = 'https://github.com/thejoaov/tray-link/releases'
const CREATOR_URL = 'https://github.com/thejoaov'

export const Settings = () => {
  const { t } = useTranslation()
  const [preferences, setPreferences] = useState<UserPreferences>(defaultUserPreferences)
  const [reloadingTools, setReloadingTools] = useState(false)
  const [toolsVersion, setToolsVersion] = useState(0)
  const [toolsReady, setToolsReady] = useState(false)
  const [migratingLegacyData, setMigratingLegacyData] = useState(false)
  const [legacyMigrationDone, setLegacyMigrationDone] = useState(false)
  const [legacyProjectsPreviewCount, setLegacyProjectsPreviewCount] = useState(0)
  const [cliInstalled, setCliInstalled] = useState(false)
  const [installingCli, setInstallingCli] = useState(false)

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

  const updatePreference = async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const next = { ...preferences, [key]: value }
    setPreferences(next)
    await persistPreferences(next)
  }

  useEffect(() => {
    // Load preferences asynchronously on mount
    loadPreferences()
      .then(setPreferences)
      .catch((e) => {
        Analytics.track(AnalyticsEvent.ERROR, { error: String(e) })
      })

    const subscription = subscribePreferencesChange(() => {
      loadPreferences()
        .then(setPreferences)
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

    return () => {
      subscription.remove()
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

  return (
    <View style={styles.container}>
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

        <Row align="center" justify="start" style={styles.boxItem}>
          <Checkbox
            value={preferences.removeFromDiskByDefault}
            onValueChange={(value) => updatePreference('removeFromDiskByDefault', value)}
            label={t('deleteFilesFromDiskByDefault')}
          />
        </Row>
      </View>

      <Text style={[styles.sectionTitle, styles.sectionTitleMargin]}>{t('cli')}</Text>

      <View border="light" rounded="medium" style={styles.box}>
        <Row align="center" justify="between" style={styles.boxItem}>
          <View style={styles.itemTextContainer}>
            <Text style={styles.itemLabel}>{t(cliInstalled ? 'uninstallCli' : 'installCli')} CLI</Text>
            <Text style={styles.itemDescription}>{cliInstalled ? t('cliInstalled') : t('cliNotInstalled')}</Text>
          </View>
          <TouchableOpacity
            accessibilityLabel={cliInstalled ? t('uninstallCli') : t('installCli')}
            disabled={installingCli}
            onPress={async () => {
              setInstallingCli(true)
              try {
                if (cliInstalled) {
                  const result = await uninstallCli()
                  if (result.success) {
                    setCliInstalled(false)
                  }
                } else {
                  const result = await installCli()
                  if (result.success) {
                    setCliInstalled(true)
                  }
                }
              } finally {
                setInstallingCli(false)
              }
            }}
            style={[styles.button, installingCli && styles.buttonDisabled]}
          >
            <Ionicons
              name={cliInstalled ? 'close-circle-outline' : 'terminal-outline'}
              size={14}
              color="var(--text-color)"
            />
            <Text style={styles.buttonText}>{t(cliInstalled ? 'uninstallCli' : 'installCli')}</Text>
          </TouchableOpacity>
        </Row>
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
        <TouchableOpacity accessibilityLabel="Open creator GitHub profile" onPress={() => Linking.openURL(CREATOR_URL)}>
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
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 12,
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
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    marginTop: 'auto',
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
})
