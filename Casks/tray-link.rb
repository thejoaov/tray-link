cask "tray-link" do
  version "2.0.0"
  sha256 "REPLACE_WITH_SHA256"

  url "https://github.com/thejoaov/tray-link/releases/download/v#{version}/Tray-Link-macOS-universal.zip"
  name "Tray Link"
  desc "Manage your projects from the system tray"
  homepage "https://github.com/thejoaov/tray-link"

  app "Tray Link.app"

  zap trash: [
    "~/Library/Application Support/Tray Link",
    "~/Library/Preferences/com.thejoaov.tray-link.plist",
    "~/Library/Caches/com.thejoaov.tray-link",
  ]
end
