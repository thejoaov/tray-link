import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { Divider, Text, View } from '../components'
import MenuBarModule from '../modules/MenuBarModule'
import { WindowsNavigator } from '../windows'
import Item from './Item'

export default function Footer() {
  const { t } = useTranslation()

  return (
    <View>
      <View px="medium">
        <Divider />
      </View>
      <View py="tiny" pb="1.5">
        <Item onPress={() => WindowsNavigator.open('Settings')}>
          <Text>{t('settingsMenu')}</Text>
        </Item>
        <Item onPress={MenuBarModule.exitApp} shortcut="⌘ Q">
          <Text>{t('quit')}</Text>
        </Item>
      </View>
    </View>
  )
}
