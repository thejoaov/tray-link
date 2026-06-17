import React, { memo } from 'react'
import { StyleSheet, TouchableOpacity, View, ViewStyle } from 'react-native'

import { Row, Text } from '../components'
import { useTheme } from '../providers/ThemeProvider'
import { HEADER_HEIGHT, MAX_HEADER_HEIGHT } from '../utils/constants'
import { parseTag } from './ProjectItem'

export const SECTION_HEADER_HEIGHT = Math.min(HEADER_HEIGHT, MAX_HEADER_HEIGHT)

type Props = {
  label: string
  accessoryRight?: React.ReactNode
  style?: ViewStyle
  onPress?: () => void
}

const SectionHeader = ({ accessoryRight, label, style, onPress }: Props) => {
  const theme = useTheme()
  const parsed = parseTag(label)
  const content = (
    <Row px="medium" justify="between" style={[styles.row, style, onPress && { width: '100%' }]}>
      <Row align="center" style={{ gap: 6 }}>
        {parsed.color ? <View style={[styles.colorDot, { backgroundColor: parsed.color }]} /> : null}
        <Text weight="semibold" size="tiny" color="default" style={{ opacity: theme === 'dark' ? 0.65 : 0.85 }}>
          {parsed.name || label}
        </Text>
      </Row>
      {accessoryRight ? accessoryRight : null}
    </Row>
  )

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={{ width: '100%' }}>
        {content}
      </TouchableOpacity>
    )
  }

  return content
}

export default memo(SectionHeader)

const styles = StyleSheet.create({
  row: {
    paddingVertical: 4,
    height: HEADER_HEIGHT,
    maxHeight: MAX_HEADER_HEIGHT,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
})
