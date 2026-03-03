import React, { useEffect } from "react";
import { StyleSheet } from "react-native";

import Analytics, { AnalyticsEvent } from "./analytics";
import AutoResizerRootView from "./components/AutoResizerRootView";
import { SAFE_AREA_FACTOR } from "./hooks/useSafeDisplayDimensions";
import Popover from "./popover";
import { FluentProvider } from "./providers/FluentProvider";
import { ThemeProvider } from "./providers/ThemeProvider";
import {
  subscribeLanguageSync,
  syncI18nLanguageFromPreferences,
} from "./services/i18n";
import { initializeToolOptions as initializeDiscoveredTools } from "./services/preferences";

type Props = {
  isDevWindow: boolean;
};

function App(props: Props = { isDevWindow: false }) {
  useEffect(() => {
    Analytics.track(AnalyticsEvent.APP_OPENED);

    syncI18nLanguageFromPreferences();
    initializeDiscoveredTools().catch(() => {
      // Non-fatal: discovery failures should not block app bootstrap.
    });
    const languageSubscription = subscribeLanguageSync();

    return () => {
      languageSubscription.remove();
    };
  }, []);

  return (
    <AutoResizerRootView
      style={styles.container}
      enabled={!props.isDevWindow}
      maxRelativeHeight={SAFE_AREA_FACTOR}
    >
      <ThemeProvider themePreference="no-preference">
        <FluentProvider>
          <Popover isDevWindow={props.isDevWindow} />
        </FluentProvider>
      </ThemeProvider>
    </AutoResizerRootView>
  );
}

export default App;

const styles = StyleSheet.create({
  container: {
    minWidth: 380,
  },
});
