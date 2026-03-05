import { Dimensions } from 'react-native'
import { Linking } from '../modules/Linking'
import MenuBarModule from '../modules/MenuBarModule'

export const openProjectsSelectorURL = () => {
  Linking.openURL('https://expo.dev/accounts/[account]/projects/[project]/builds')
  MenuBarModule.closePopover()
}

export const MAX_UI_HEIGHT = Dimensions.get('screen').height * 0.75
export const HEADER_HEIGHT = MAX_UI_HEIGHT * 0.05 // 5% of the max UI height
export const MAX_HEADER_HEIGHT = 48
export const FOOTER_HEIGHT = MAX_UI_HEIGHT * 0.1 // 10% of the max UI height
export const MAX_FOOTER_HEIGHT = 60
export const PROJECT_LIST_HEIGHT =
  MAX_UI_HEIGHT - Math.min(HEADER_HEIGHT, MAX_HEADER_HEIGHT) - Math.min(FOOTER_HEIGHT, MAX_FOOTER_HEIGHT)
