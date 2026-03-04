cask "tray-link" do
  version "2.1.0"
  sha256 "2a2411bd83126a3a65e36067636d1ae31210477dc78df1c39108af9bdf17bc36"

  url "https://github.com/thejoaov/tray-link/releases/download/v2.1.0/Tray-Link-macOS-universal.zip"
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
