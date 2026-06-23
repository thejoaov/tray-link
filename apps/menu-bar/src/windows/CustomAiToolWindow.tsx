import { CustomTool } from '@tray-link/common-types'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { z } from 'zod'
import { getAppAsync } from '../../modules/file-picker'
import { Button, Text, TextInput, View } from '../components'
import Alert from '../modules/Alert'
import { loadPreferences, persistPreferences, resolveCustomToolIconPath } from '../services/preferences'
import { WindowsNavigator } from './index'

const customToolSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  binary: z.string().min(1, 'Binary is required'),
  command: z.string().min(1, 'Command is required'),
})

export const CustomAiToolWindow = () => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [binary, setBinary] = useState('')
  const [command, setCommand] = useState('')
  const [iconAppPath, setIconAppPath] = useState('')

  const handlePickIconApp = async () => {
    try {
      const path = await getAppAsync()
      setIconAppPath(path)
    } catch {
      // User canceled file picker.
    }
  }

  const onSave = async () => {
    const result = customToolSchema.safeParse({ name, binary, command })
    if (!result.success) {
      Alert.alert(t('invalidAiTool'), result.error.issues[0]?.message || t('invalidValues'))
      return
    }

    const normalizedIconAppPath = iconAppPath.trim()
    const iconPath = await resolveCustomToolIconPath(normalizedIconAppPath || null)
    if (normalizedIconAppPath && !iconPath) {
      Alert.alert(t('invalidAiTool'), t('invalidAppIcon'))
      return
    }

    const preferences = await loadPreferences()
    const tool: CustomTool = {
      id: Date.now().toString(),
      name: result.data.name,
      binary: result.data.binary,
      command: result.data.command,
      iconPath,
    }

    await persistPreferences({
      ...preferences,
      customAiTools: [...(preferences.customAiTools ?? []), tool],
    })

    setName('')
    setBinary('')
    setCommand('')
    setIconAppPath('')
    WindowsNavigator.close('CustomAiToolWindow')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('customAiTool')}</Text>
      <Text style={styles.label}>{t('name')}</Text>
      <TextInput
        border="default"
        rounded="small"
        px="2"
        py="2"
        value={name}
        onChangeText={setName}
        placeholder="Claude Code"
      />

      <Text style={styles.label}>{t('binary')}</Text>
      <TextInput
        border="default"
        rounded="small"
        px="2"
        py="2"
        value={binary}
        onChangeText={setBinary}
        placeholder="claude"
      />

      <Text style={styles.label}>{t('openCommandTemplate')}</Text>
      <TextInput
        border="default"
        rounded="small"
        px="2"
        py="2"
        value={command}
        onChangeText={setCommand}
        placeholder="claude"
      />

      <Text style={styles.label}>{t('appIconSource')}</Text>
      <TextInput
        border="default"
        rounded="small"
        px="2"
        py="2"
        value={iconAppPath}
        onChangeText={setIconAppPath}
        placeholder="/Applications/Claude.app"
      />

      <Button title={t('chooseAppIcon')} onPress={handlePickIconApp} />

      <Button title={t('saveCustomAiTool')} onPress={onSave} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    opacity: 0.75,
  },
})
