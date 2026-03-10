import React, { PropsWithChildren } from 'react'
import { StyleProp, StyleSheet, ViewStyle } from 'react-native'

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>
  contentContainerStyle?: StyleProp<ViewStyle>
  showsVerticalScrollIndicator?: boolean
}>

const flattenStyle = (style?: StyleProp<ViewStyle>): React.CSSProperties => {
  return (StyleSheet.flatten(style) ?? {}) as React.CSSProperties
}

export function ScrollView({ children, style, contentContainerStyle }: Props) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: 'auto',
        overflowX: 'hidden',
        minHeight: 0,
        ...flattenStyle(style),
      }}
    >
      <div
        style={{
          minHeight: '100%',
          ...flattenStyle(contentContainerStyle),
        }}
      >
        {children}
      </div>
    </div>
  )
}
