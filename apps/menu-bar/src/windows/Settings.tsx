import { Ionicons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet, TouchableOpacity } from 'react-native'

import { Checkbox, Divider, Row, Text, View } from '../components'
import { Linking } from '../modules/Linking'
import { UserPreferences } from '../modules/Storage'
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
  const [preferences, setPreferences] = useState<UserPreferences>(() => loadPreferences())
  const [reloadingTools, setReloadingTools] = useState(false)
  const [toolsVersion, setToolsVersion] = useState(0)
  const [migratingLegacyData, setMigratingLegacyData] = useState(false)
  const [legacyMigrationDone, setLegacyMigrationDone] = useState(() => hasLegacyMigrationCompleted())
  const [legacyProjectsPreviewCount, setLegacyProjectsPreviewCount] = useState(0)

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

  const updatePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    const next = { ...preferences, [key]: value }
    setPreferences(next)
    persistPreferences(next)
  }

  useEffect(() => {
    const subscription = subscribePreferencesChange(() => {
      setPreferences(loadPreferences())
      setToolsVersion((v) => v + 1)
    })

    // Discover tools on mount (needed because Settings runs in a separate BrowserWindow)
    initializeToolOptions().then(() => {
      setToolsVersion((v) => v + 1)
    })

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
          <View border="light" rounded="small" style={styles.pickerWrap}>
            <Picker selectedValue={preferences.locale} onValueChange={(value) => updatePreference('locale', value)}>
              {LOCALE_OPTIONS.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </Row>

        <Divider />

        <Row align="center" justify="between" style={styles.boxItem}>
          <Text style={styles.itemLabel}>{t('defaultEditor')}</Text>
          <Row align="center" style={styles.controlRow}>
            <View border="light" rounded="small" style={styles.pickerWrap}>
              <Picker
                selectedValue={preferences.defaultEditor}
                onValueChange={(value) => updatePreference('defaultEditor', value)}
              >
                <Picker.Item label={t('systemDefault')} value={null} />
                {editorOptions.map((option) => (
                  <Picker.Item key={option.command} label={option.label} value={option.command} />
                ))}
              </Picker>
            </View>
            <TouchableOpacity
              accessibilityLabel={t('addCustomEditor')}
              onPress={() => WindowsNavigator.open('CustomEditorWindow')}
              style={styles.iconButton}
            >
              <Ionicons name="add" size={16} />
            </TouchableOpacity>
          </Row>
        </Row>

        <Divider />

        <Row align="center" justify="between" style={styles.boxItem}>
          <Text style={styles.itemLabel}>{t('defaultTerminal')}</Text>
          <Row align="center" style={styles.controlRow}>
            <View border="light" rounded="small" style={styles.pickerWrap}>
              <Picker
                selectedValue={preferences.defaultTerminal}
                onValueChange={(value) => updatePreference('defaultTerminal', value)}
              >
                <Picker.Item label={t('systemDefault')} value={null} />
                {terminalOptions.map((option) => (
                  <Picker.Item key={option.command} label={option.label} value={option.command} />
                ))}
              </Picker>
            </View>
            <TouchableOpacity
              accessibilityLabel={t('addCustomTerminal')}
              onPress={() => WindowsNavigator.open('CustomTerminalWindow')}
              style={styles.iconButton}
            >
              <Ionicons name="add" size={16} />
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
                setReloadingTools(false)
              }
            }}
            style={[styles.button, reloadingTools && styles.buttonDisabled]}
          >
            <Ionicons name="refresh" size={14} />
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
                if (migrated || hasLegacyMigrationCompleted()) {
                  setLegacyMigrationDone(true)
                  setLegacyProjectsPreviewCount(0)
                }
              } finally {
                setMigratingLegacyData(false)
              }
            }}
            style={[styles.button, (legacyMigrationDone || migratingLegacyData) && styles.buttonDisabled]}
          >
            <Ionicons name="download-outline" size={14} />
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
          <Ionicons name="rocket-outline" size={14} />
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
  pickerWrap: {
    overflow: 'hidden',
    width: 160,
    height: 28,
    justifyContent: 'center',
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
