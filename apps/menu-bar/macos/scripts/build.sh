#!/bin/bash
set -e

WORKSPACE_PATH='./macos/TrayLink.xcworkspace'
CONFIGURATION='Debug'
SCHEME='TrayLink-macOS'

echo "🔨 Building TrayLink..."
# Build
xcodebuild -workspace "$WORKSPACE_PATH" -scheme "$SCHEME" -configuration "$CONFIGURATION"

echo "🔍 Getting build settings..."
# Get build settings
BUILD_SETTINGS=$(xcodebuild -showBuildSettings -workspace "$WORKSPACE_PATH" -scheme "$SCHEME" -configuration "$CONFIGURATION" 2>/dev/null || true)

BUILT_PRODUCTS_DIR=$(echo "$BUILD_SETTINGS" | grep -m1 "^\s*BUILT_PRODUCTS_DIR =" | awk -F'= ' '{print $2}')
FULL_PRODUCT_NAME=$(echo "$BUILD_SETTINGS" | grep -m1 "^\s*FULL_PRODUCT_NAME =" | awk -F'= ' '{print $2}')

APP_PATH="$BUILT_PRODUCTS_DIR/$FULL_PRODUCT_NAME"

launch_app() {
    # Kill the app if it's already running
    pkill -f "Tray Link" || true

    set +e
    OPEN_OUTPUT=$(open "$APP_PATH" 2>&1)
    OPEN_STATUS=$?
    set -e

    if [ $OPEN_STATUS -ne 0 ]; then
        echo "$OPEN_OUTPUT"
    fi

    return $OPEN_STATUS
}

echo "✅ Build finished! App path: $APP_PATH"

if [ -d "$APP_PATH" ]; then
    echo "🚀 Launching app..."
    if ! launch_app; then
        if echo "$OPEN_OUTPUT" | grep -q "_LSOpenURLsWithCompletionHandler() failed with error -600"; then
            echo "⚠️ Launch failed with -600. Retrying once..."
            sleep 1
            launch_app
        else
            exit 1
        fi
    fi
else
    echo "❌ Error: App not found at $APP_PATH"
    exit 1
fi
