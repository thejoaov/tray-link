import React, { memo } from 'react'
import { StyleSheet, ViewStyle } from 'react-native'

import { Row, Text } from '../components'
import { useTheme } from '../providers/ThemeProvider'
import { HEADER_HEIGHT, MAX_HEADER_HEIGHT, MAX_UI_HEIGHT } from '../utils/constants'

export const SECTION_HEADER_HEIGHT = 20

type Props = {
  label: string
  accessoryRight?: React.ReactNode
  style?: ViewStyle
}

const SectionHeader = ({ accessoryRight, label, style }: Props) => {
  const theme = useTheme()
  return (
    <Row px="medium" justify="between" style={[styles.row, style]}>
      <Text weight="semibold" size="tiny" color="default" style={{ opacity: theme === 'dark' ? 0.65 : 0.85 }}>
        {label}
      </Text>
      {accessoryRight ? accessoryRight : null}
    </Row>
  )
}

export default memo(SectionHeader)

const styles = StyleSheet.create({
  row: {
    paddingVertical: 4,
    height: HEADER_HEIGHT,
    maxHeight: MAX_HEADER_HEIGHT,
  },
})
