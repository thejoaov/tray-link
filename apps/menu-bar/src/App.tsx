/** biome-ignore-all lint/suspicious/noEmptyBlockStatements: Fail silently */
import React, { useEffect } from 'react'
import { StyleSheet, Text, View } from 'react-native'

import Analytics, { AnalyticsEvent } from './analytics'
import AutoResizerRootView from './components/AutoResizerRootView'
import { SAFE_AREA_FACTOR } from './hooks/useSafeDisplayDimensions'
import Popover from './popover'
import { ErrorBoundary, FallbackProps } from './popover/ErrorBoundary'
import { FluentProvider } from './providers/FluentProvider'
import { ThemeProvider } from './providers/ThemeProvider'
import { initializeUpdater } from './services/appUpdater'
import { installGlobalErrorLogging, logError } from './services/errorLogger'
import { subscribeLanguageSync, syncI18nLanguageFromPreferences } from './services/i18n'
import { initializePreferences } from './services/preferences'

type Props = {
  isDevWindow: boolean
}

function AppErrorFallback({ error }: FallbackProps) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Something went wrong</Text>
      <Text style={styles.errorMessage}>{error?.message ?? 'Unknown error'}</Text>
    </View>
  )
}

function App(props: Props = { isDevWindow: false }) {
  useEffect(() => {
    installGlobalErrorLogging()
    Analytics.track(AnalyticsEvent.APP_OPENED)

    syncI18nLanguageFromPreferences().catch((error) => {
      void logError('app:syncI18nLanguageFromPreferences', error)
    })
    initializePreferences().catch((error) => {
      void logError('app:initializePreferences', error)
    })
    initializeUpdater().catch((error) => {
      void logError('app:initializeUpdater', error)
    })
    const languageSubscription = subscribeLanguageSync()

    return () => {
      languageSubscription.remove()
    }
  }, [])

  return (
    <AutoResizerRootView style={styles.container} enabled={!props.isDevWindow} maxRelativeHeight={SAFE_AREA_FACTOR}>
      <ThemeProvider themePreference="no-preference">
        <FluentProvider>
          <ErrorBoundary fallback={AppErrorFallback}>
            <Popover isDevWindow={props.isDevWindow} />
          </ErrorBoundary>
        </FluentProvider>
      </ThemeProvider>
    </AutoResizerRootView>
  )
}

export default App

const styles = StyleSheet.create({
  container: {
    minWidth: 380,
  },
  errorContainer: {
    minWidth: 380,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    color: 'var(--text-color)',
  },
  errorMessage: {
    fontSize: 12,
    textAlign: 'center',
    color: 'var(--text-color)',
  },
})
