cask "tray-link" do
  version "2.0.14"
  sha256 "5ec79cf0956c4c8e76a20a1ddf57304738d76a6c9b4866bd53bd0078e307c4bc"

  url "https://github.com/thejoaov/tray-link/releases/download/v2.0.14/Tray.Link-darwin-arm64-2.0.0.zip"
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
