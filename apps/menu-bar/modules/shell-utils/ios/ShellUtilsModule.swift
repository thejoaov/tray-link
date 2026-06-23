import ExpoModulesCore
import AppKit

private func shellEscape(_ value: String) -> String {
  return "'" + value.replacingOccurrences(of: "'", with: "'\\''") + "'"
}

private func runShell(_ command: String) throws -> Process {
  let task = Process()
  task.executableURL = URL(fileURLWithPath: "/bin/zsh")
  task.arguments = ["-lc", command]
  try task.run()
  task.waitUntilExit()
  return task
}

private func loadLegacyTrayLinkConfigData() -> [String: Any]? {
  let userHome = FileManager.default.homeDirectoryForCurrentUser.path
  let appSupport = "\(userHome)/Library/Application Support"

  var paths = [
    "\(appSupport)/tray-link/config.json",
    "\(appSupport)/Tray Link/config.json",
    "\(appSupport)/vs-tray/config.json",
  ]

  if let folders = try? FileManager.default.contentsOfDirectory(atPath: appSupport) {
    let guessedPaths = folders
      .filter { folder in
        let value = folder.lowercased()
        return value.contains("tray") || value.contains("vs")
      }
      .map { folder in "\(appSupport)/\(folder)/config.json" }

    paths.append(contentsOf: guessedPaths)
  }

  paths = Array(Set(paths))

  for path in paths {
    guard FileManager.default.fileExists(atPath: path) else {
      continue
    }

    if
      let data = FileManager.default.contents(atPath: path),
      let object = try? JSONSerialization.jsonObject(with: data, options: []),
      let dictionary = object as? [String: Any]
    {
      return dictionary
    }
  }

  return nil
}

private func getCliBinaryNameForCurrentArch() -> String {
  #if arch(arm64)
  return "tlink-arm64"
  #else
  return "tlink-x64"
  #endif
}

private func getCliWrapperDirectoryURL() -> URL {
  return FileManager.default.homeDirectoryForCurrentUser.appendingPathComponent(".tray-link", isDirectory: true)
}

private func getCliWrapperURL() -> URL {
  return getCliWrapperDirectoryURL().appendingPathComponent("tlink")
}

private func resolveInstalledCliPath() -> String? {
  let task = Process()
  let pipe = Pipe()

  task.executableURL = URL(fileURLWithPath: "/bin/zsh")
  task.arguments = ["-lc", "command -v tlink"]
  task.standardOutput = pipe

  do {
    try task.run()
    let data = pipe.fileHandleForReading.readDataToEndOfFile()
    task.waitUntilExit()

    guard task.terminationStatus == 0 else {
      return nil
    }

    let path = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines)
    guard let path, !path.isEmpty else {
      return nil
    }

    return path
  } catch {
    return nil
  }
}

private func resolveSymlinkDestination(_ path: String) -> String? {
  do {
    return try FileManager.default.destinationOfSymbolicLink(atPath: path)
  } catch {
    return nil
  }
}

private func isHomebrewManagedCli(at installedPath: String) -> Bool {
  let resolvedPath = URL(fileURLWithPath: installedPath).resolvingSymlinksInPath().path

  if installedPath.hasPrefix("/opt/homebrew/bin/") {
    return true
  }

  if installedPath == "/usr/local/bin/tlink" {
    guard let symlinkDestination = resolveSymlinkDestination(installedPath) else {
      return false
    }

    let normalizedDestination: String
    if symlinkDestination.hasPrefix("/") {
      normalizedDestination = symlinkDestination
    } else {
      normalizedDestination = URL(
        fileURLWithPath: symlinkDestination,
        relativeTo: URL(fileURLWithPath: "/usr/local/bin/")
      ).standardizedFileURL.path
    }

    if normalizedDestination.contains("/.tray-link/") {
      return false
    }
  }

  return resolvedPath.contains("/Applications/Tray Link.app/Contents/Resources/tlink-")
}

private func getBundledCliBinaryURL() -> URL {
  return Bundle.main.bundleURL
    .appendingPathComponent("Contents", isDirectory: true)
    .appendingPathComponent("Resources", isDirectory: true)
    .appendingPathComponent(getCliBinaryNameForCurrentArch())
}

private func createCliWrapper() throws -> URL {
  let fileManager = FileManager.default
  let wrapperDirectoryURL = getCliWrapperDirectoryURL()
  let wrapperURL = getCliWrapperURL()
  let binaryName = getCliBinaryNameForCurrentArch()
  let homeDirectory = fileManager.homeDirectoryForCurrentUser.path
  let candidates = Array(
    Set([
      getBundledCliBinaryURL().path,
      "/Applications/Tray Link.app/Contents/Resources/\(binaryName)",
      "\(homeDirectory)/Applications/Tray Link.app/Contents/Resources/\(binaryName)",
    ])
  )

  try fileManager.createDirectory(at: wrapperDirectoryURL, withIntermediateDirectories: true)

  let candidateList = candidates.map(shellEscape).joined(separator: " ")
  let content = [
    "#!/bin/sh",
    "for candidate in \(candidateList); do",
    "  if [ -x \"$candidate\" ]; then",
    "    exec \"$candidate\" \"$@\"",
    "  fi",
    "done",
    "echo \"Tray Link CLI binary not found. Reinstall Tray Link or reinstall it with Homebrew to restore the bundled CLI.\" >&2",
    "exit 1",
    "",
  ].joined(separator: "\n")

  try content.write(to: wrapperURL, atomically: true, encoding: .utf8)
  try fileManager.setAttributes([.posixPermissions: NSNumber(value: Int(0o755))], ofItemAtPath: wrapperURL.path)

  return wrapperURL
}

private func appleScriptStringLiteral(_ value: String) -> String {
  return "\"" + value
    .replacingOccurrences(of: "\\", with: "\\\\")
    .replacingOccurrences(of: "\"", with: "\\\"") + "\""
}

private func downloadFile(from url: URL, to destination: URL) throws {
  let semaphore = DispatchSemaphore(value: 0)
  var downloadError: Error?

  let task = URLSession.shared.downloadTask(with: url) { temporaryURL, _, error in
    defer {
      semaphore.signal()
    }

    if let error = error {
      downloadError = error
      return
    }

    guard let temporaryURL = temporaryURL else {
      downloadError = NSError(domain: "TrayLinkUpdater", code: 1, userInfo: [
        NSLocalizedDescriptionKey: "Download finished without a file"
      ])
      return
    }

    do {
      if FileManager.default.fileExists(atPath: destination.path) {
        try FileManager.default.removeItem(at: destination)
      }
      try FileManager.default.moveItem(at: temporaryURL, to: destination)
    } catch {
      downloadError = error
    }
  }

  task.resume()
  semaphore.wait()

  if let downloadError = downloadError {
    throw downloadError
  }
}

private func unzipArchive(zipURL: URL, destinationURL: URL) throws {
  if FileManager.default.fileExists(atPath: destinationURL.path) {
    try FileManager.default.removeItem(at: destinationURL)
  }

  try FileManager.default.createDirectory(at: destinationURL, withIntermediateDirectories: true)

  let task = Process()
  task.executableURL = URL(fileURLWithPath: "/usr/bin/ditto")
  task.arguments = ["-x", "-k", zipURL.path, destinationURL.path]
  try task.run()
  task.waitUntilExit()

  if task.terminationStatus != 0 {
    throw NSError(domain: "TrayLinkUpdater", code: 2, userInfo: [
      NSLocalizedDescriptionKey: "Could not extract update archive"
    ])
  }
}

private func findAppBundle(in directory: URL) -> URL? {
  if directory.pathExtension == "app" {
    return directory
  }

  guard let enumerator = FileManager.default.enumerator(at: directory, includingPropertiesForKeys: nil) else {
    return nil
  }

  for case let fileURL as URL in enumerator {
    if fileURL.pathExtension == "app" {
      return fileURL
    }
  }

  return nil
}

private func createInstallerScript(sourceAppURL: URL, targetAppURL: URL, currentProcessId: Int32) throws -> URL {
  let scriptURL = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("tray-link-update-\(UUID().uuidString).sh")
  let script = """
#!/bin/sh
set -e
while kill -0 \(currentProcessId) 2>/dev/null; do
  sleep 1
done
rm -rf \(shellEscape(targetAppURL.path))
ditto \(shellEscape(sourceAppURL.path)) \(shellEscape(targetAppURL.path))
xattr -dr com.apple.quarantine \(shellEscape(targetAppURL.path)) >/dev/null 2>&1 || true
open \(shellEscape(targetAppURL.path))
"""

  try script.write(to: scriptURL, atomically: true, encoding: .utf8)
  try FileManager.default.setAttributes([.posixPermissions: NSNumber(value: Int(0o755))], ofItemAtPath: scriptURL.path)
  return scriptURL
}

private func scheduleInstaller(scriptURL: URL) -> String? {
  let command = "nohup /bin/sh \(shellEscape(scriptURL.path)) >/dev/null 2>&1 &"
  let source = "do shell script \(appleScriptStringLiteral(command)) with administrator privileges"
  let appleScript = NSAppleScript(source: source)
  var errorDict: NSDictionary?
  appleScript?.executeAndReturnError(&errorDict)
  return errorDict?[NSAppleScript.errorMessage] as? String
}

public class ShellUtilsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ShellUtils")

    AsyncFunction("openInEditor") { (path: String, editorCommand: String) -> Bool in
      do {
        let task = try runShell("\(editorCommand) \(shellEscape(path))")
        return task.terminationStatus == 0
      } catch {
        return false
      }
    }

    AsyncFunction("openInTerminal") { (path: String, terminalCommand: String) -> Bool in
      do {
        let command = terminalCommand.starts(with: "open")
          ? "\(terminalCommand) \(shellEscape(path))"
          : "cd \(shellEscape(path)) && \(terminalCommand)"
        let task = try runShell(command)
        return task.terminationStatus == 0
      } catch {
        return false
      }
    }

    AsyncFunction("openInTerminalWithCommand") { (path: String, terminalCommand: String, commandToRun: String) -> Bool in
      do {
        let sessionCommand = "cd \(shellEscape(path)) && \(commandToRun)"
        let normalizedTerminal = terminalCommand.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
        let command: String

        if normalizedTerminal.contains("iterm") {
          let escapedSession = sessionCommand
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
          command = """
          osascript -e 'tell application "iTerm" to activate' -e 'tell application "iTerm" to tell current window to create tab with default profile' -e 'tell application "iTerm" to tell current session of current window to write text "\(escapedSession)"'
          """
        } else if normalizedTerminal.contains("ghostty") {
          command = "open -a Ghostty --args -e bash -lc \(shellEscape(sessionCommand))"
        } else if normalizedTerminal.contains("warp") {
          command = "open -a Warp --args -e bash -lc \(shellEscape(sessionCommand))"
        } else if normalizedTerminal.contains("terminal") || terminalCommand.starts(with: "open") {
          let escapedSession = sessionCommand
            .replacingOccurrences(of: "\\", with: "\\\\")
            .replacingOccurrences(of: "\"", with: "\\\"")
          command = """
          osascript -e 'tell application "Terminal" to activate' -e 'tell application "Terminal" to do script "\(escapedSession)"'
          """
        } else {
          command = sessionCommand
        }

        let task = try runShell(command)
        return task.terminationStatus == 0
      } catch {
        return false
      }
    }

    AsyncFunction("openInFinder") { (path: String) -> Bool in
      let url = URL(fileURLWithPath: path)
      return NSWorkspace.shared.selectFile(nil, inFileViewerRootedAtPath: url.path)
    }

    AsyncFunction("which") { (binary: String) -> String? in
      let home = FileManager.default.homeDirectoryForCurrentUser.path
      let candidatePaths = [
        "/opt/homebrew/bin/\(binary)",
        "/usr/local/bin/\(binary)",
        "\(home)/.local/bin/\(binary)",
        "\(home)/.cursor/bin/\(binary)",
        "\(home)/.npm-global/bin/\(binary)",
        "\(home)/.cargo/bin/\(binary)",
      ]

      for path in candidatePaths {
        if FileManager.default.isExecutableFile(atPath: path) {
          return path
        }
      }

      let task = Process()
      let pipe = Pipe()
      let pathPrefix = "/opt/homebrew/bin:/usr/local/bin:\(home)/.local/bin:\(home)/.cursor/bin:\(home)/.npm-global/bin:\(home)/.cargo/bin"

      task.executableURL = URL(fileURLWithPath: "/bin/zsh")
      task.arguments = ["-lc", "export PATH=\"\(pathPrefix):$PATH\"; command -v \(shellEscape(binary))"]
      task.standardOutput = pipe

      do {
        try task.run()
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        task.waitUntilExit()

        if task.terminationStatus == 0 {
          return String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines)
        }
      } catch {
        return nil
      }
      return nil
    }

    AsyncFunction("fileExists") { (path: String) -> Bool in
      return FileManager.default.fileExists(atPath: path)
    }

    AsyncFunction("loadLegacyTrayLinkData") { () -> [String: Any]? in
      return loadLegacyTrayLinkConfigData()
    }

    AsyncFunction("removeFromDisk") { (path: String) -> Bool in
      do {
        try FileManager.default.removeItem(atPath: path)
        return true
      } catch {
        return false
      }
    }

    AsyncFunction("isCliInstalled") { () -> Bool in
      return resolveInstalledCliPath() != nil
    }

    AsyncFunction("installCli") { () -> [String: Any] in
      do {
        if let installedPath = resolveInstalledCliPath() {
          return [
            "success": true,
            "alreadyInstalled": true,
            "path": installedPath,
            "managedByHomebrew": isHomebrewManagedCli(at: installedPath)
          ]
        }

        let cliBinary = getBundledCliBinaryURL()
        guard FileManager.default.fileExists(atPath: cliBinary.path) else {
          return [
            "success": false,
            "error": "CLI binary not found in the Tray Link app bundle. Reinstall the app or install it again with Homebrew."
          ]
        }

        let wrapperPath = try createCliWrapper().path
        let symlinkPath = "/usr/local/bin/tlink"
        let cmd = "ln -sf \\\"\(wrapperPath)\\\" \\\"\(symlinkPath)\\\""
        let script = "do shell script \"\(cmd)\" with administrator privileges"
        let appleScript = NSAppleScript(source: script)
        var errorDict: NSDictionary?
        appleScript?.executeAndReturnError(&errorDict)

        if let errorDict = errorDict {
          let errorMessage = errorDict[NSAppleScript.errorMessage] as? String ?? "Unknown error"
          return ["success": false, "error": errorMessage]
        }

        return ["success": true]
      }
    }

    AsyncFunction("uninstallCli") { () -> [String: Any] in
      if let installedPath = resolveInstalledCliPath(), isHomebrewManagedCli(at: installedPath) {
        return [
          "success": true,
          "managedByHomebrew": true,
          "path": installedPath,
          "removed": false,
          "error": "Tray Link CLI is managed by Homebrew. Use Homebrew to uninstall it."
        ]
      }

      let symlinkPath = "/usr/local/bin/tlink"
      let wrapperPath = getCliWrapperURL().path
      let wrapperDirectoryPath = getCliWrapperDirectoryURL().path

      if FileManager.default.fileExists(atPath: symlinkPath) {
        let cmd = "rm -f \\\"\(symlinkPath)\\\""
        let script = "do shell script \"\(cmd)\" with administrator privileges"
        let appleScript = NSAppleScript(source: script)
        var errorDict: NSDictionary?
        appleScript?.executeAndReturnError(&errorDict)

        if let errorDict = errorDict {
          let errorMessage = errorDict[NSAppleScript.errorMessage] as? String ?? "Unknown error"
          return ["success": false, "error": errorMessage]
        }
      }

      try? FileManager.default.removeItem(atPath: wrapperPath)

      if let contents = try? FileManager.default.contentsOfDirectory(atPath: wrapperDirectoryPath), contents.isEmpty {
        try? FileManager.default.removeItem(atPath: wrapperDirectoryPath)
      }

      return ["success": true, "removed": true]
    }

    AsyncFunction("installAppUpdate") { (downloadUrl: String) -> [String: Any] in
      guard let url = URL(string: downloadUrl) else {
        return ["success": false, "error": "Invalid download URL"]
      }

      do {
        let tempRoot = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("tray-link-update-\(UUID().uuidString)")
        try FileManager.default.createDirectory(at: tempRoot, withIntermediateDirectories: true)

        let zipURL = tempRoot.appendingPathComponent("update.zip")
        let extractedURL = tempRoot.appendingPathComponent("extracted")

        try downloadFile(from: url, to: zipURL)
        try unzipArchive(zipURL: zipURL, destinationURL: extractedURL)

        guard let appBundleURL = findAppBundle(in: extractedURL) else {
          return ["success": false, "error": "Could not find the application bundle in the downloaded archive"]
        }

        let targetAppURL = URL(fileURLWithPath: "/Applications").appendingPathComponent(Bundle.main.bundleURL.lastPathComponent)
        let installerScriptURL = try createInstallerScript(
          sourceAppURL: appBundleURL,
          targetAppURL: targetAppURL,
          currentProcessId: getpid()
        )

        if let installError = scheduleInstaller(scriptURL: installerScriptURL) {
          return ["success": false, "error": installError]
        }

        return ["success": true]
      } catch {
        return ["success": false, "error": error.localizedDescription]
      }
    }
  }
}
