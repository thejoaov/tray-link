cask "tray-link" do
  version "2.1.2"
  sha256 "6fd12197af5792490942e4c213346e4e3328c0f98f7f7077a378a60ab2cff810"

  url "https://github.com/thejoaov/tray-link/releases/download/v2.1.2/Tray-Link-macOS-universal.zip"
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
