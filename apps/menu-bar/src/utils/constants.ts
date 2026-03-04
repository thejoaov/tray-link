import { Dimensions } from 'react-native'
import { Linking } from '../modules/Linking'
import MenuBarModule from '../modules/MenuBarModule'

export const openProjectsSelectorURL = () => {
  Linking.openURL('https://expo.dev/accounts/[account]/projects/[project]/builds')
  MenuBarModule.closePopover()
}

export const MAX_UI_HEIGHT = Dimensions.get('screen').height * 0.75
