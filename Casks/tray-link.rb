cask "tray-link" do
  version "2.1.1"
  sha256 "7657e3352111a076750ec667233f328dadf0ff97b8c0469509abfdeac22658a1"

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
