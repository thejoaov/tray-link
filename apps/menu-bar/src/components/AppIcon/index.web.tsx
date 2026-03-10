import React, { useMemo, useState } from 'react'
import { ImageStyle, StyleProp, StyleSheet } from 'react-native'

type Props = {
  uri: string
  style?: StyleProp<ImageStyle>
  fallback?: React.ReactNode
}

const flattenStyle = (style?: StyleProp<ImageStyle>): React.CSSProperties => {
  return (StyleSheet.flatten(style) ?? {}) as React.CSSProperties
}

export function AppIcon({ uri, style, fallback = null }: Props) {
  const [failed, setFailed] = useState(false)
  const resolvedStyle = useMemo(() => flattenStyle(style), [style])

  if (!uri || failed) {
    return <>{fallback}</>
  }

  return (
    <img
      src={uri}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
      style={{
        display: 'block',
        objectFit: 'cover',
        ...resolvedStyle,
      }}
    />
  )
}
