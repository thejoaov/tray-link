cask "tray-link" do
  version "2.1.1"
  sha256 "aa603a1f84be5d6f6ab0c5e71a61686d08756225ed86e269c8da9218d2a1f5cc"

  url "https://github.com/thejoaov/tray-link/releases/download/v2.1.1/Tray-Link-macOS-universal.zip"
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
