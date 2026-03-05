cask "tray-link" do
  version "2.1.3"
  sha256 "09085713fc582b5bc3bba600351e1cb60d1045bd02a211e7aa8712e50d1d9dff"

  url "https://github.com/thejoaov/tray-link/releases/download/v2.1.3/Tray-Link-macOS-universal.zip"
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
