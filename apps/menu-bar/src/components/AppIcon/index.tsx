import React, { useState } from 'react'
import { Image, ImageStyle, StyleProp } from 'react-native'

type Props = {
  uri: string
  style?: StyleProp<ImageStyle>
  fallback?: React.ReactNode
}

export function AppIcon({ uri, style, fallback = null }: Props) {
  const [failed, setFailed] = useState(false)

  if (!uri || failed) {
    return <>{fallback}</>
  }

  return <Image source={{ uri }} style={style} onError={() => setFailed(true)} />
}
