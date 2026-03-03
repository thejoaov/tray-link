import { CustomTool } from '@tray-link/common-types'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { z } from 'zod'
import { Button, Text, TextInput, View } from '../components'
import Alert from '../modules/Alert'
import { loadPreferences, persistPreferences } from '../services/preferences'

const customToolSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  binary: z.string().min(1, 'Binary is required'),
  command: z.string().min(1, 'Command is required'),
})

export const CustomEditorWindow = () => {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [binary, setBinary] = useState('')
  const [command, setCommand] = useState('')

  const onSave = () => {
    const result = customToolSchema.safeParse({ name, binary, command })
    if (!result.success) {
      Alert.alert(t('invalidEditor'), result.error.issues[0]?.message || t('invalidValues'))
      return
    }

    const preferences = loadPreferences()
    const tool: CustomTool = {
      id: Date.now().toString(),
      name: result.data.name,
      binary: result.data.binary,
      command: result.data.command,
    }

    persistPreferences({
      ...preferences,
      customEditors: [...preferences.customEditors, tool],
    })

    Alert.alert(t('saved'), t('customEditorSaved'))
    setName('')
    setBinary('')
    setCommand('')
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('customEditor')}</Text>
      <Text style={styles.label}>{t('name')}</Text>
      <TextInput
        border="default"
        rounded="small"
        px="2"
        py="2"
        value={name}
        onChangeText={setName}
        placeholder="Cursor"
      />

      <Text style={styles.label}>{t('binary')}</Text>
      <TextInput
        border="default"
        rounded="small"
        px="2"
        py="2"
        value={binary}
        onChangeText={setBinary}
        placeholder="cursor"
      />

      <Text style={styles.label}>{t('openCommandTemplate')}</Text>
      <TextInput
        border="default"
        rounded="small"
        px="2"
        py="2"
        value={command}
        onChangeText={setCommand}
        placeholder="cursor"
      />

      <Button title={t('saveCustomEditor')} onPress={onSave} />
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
