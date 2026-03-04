import React, { useEffect } from 'react'
import { Text, View } from '../components'
import { useSafeDisplayDimensions } from '../hooks/useSafeDisplayDimensions'
import MenuBarModule from '../modules/MenuBarModule'
import { WindowsNavigator } from '../windows'
import Core from './Core'
import { ErrorBoundary, FallbackProps } from './ErrorBoundary'
import Footer from './Footer'

type Props = {
  isDevWindow: boolean
}

function Popover(props: Props) {
  const { height } = useSafeDisplayDimensions()

  useEffect(() => {
    MenuBarModule.openPopover()
  }, [])

  return (
    <View
      style={{
        maxHeight: height,
        padding: 8,
      }}
    >
      <ErrorBoundary fallback={Fallback}>
        <Core isDevWindow={props.isDevWindow} />
      </ErrorBoundary>
    </View>
  )
}

export default Popover

const Fallback = ({ error }: FallbackProps) => {
  return (
    <View px="medium" pb="small" gap="2">
      <Text weight="medium">Something went wrong, please restart the app</Text>
      <Text color="secondary">Error message: {error?.message}</Text>
    </View>
  )
}
