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
    "echo \"Tray Link CLI binary not found. Open Tray Link and install the CLI again.\" >&2",
    "exit 1",
    "",
  ].joined(separator: "\n")

  try content.write(to: wrapperURL, atomically: true, encoding: .utf8)
  try fileManager.setAttributes([.posixPermissions: NSNumber(value: Int(0o755))], ofItemAtPath: wrapperURL.path)

  return wrapperURL
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

    AsyncFunction("openInFinder") { (path: String) -> Bool in
      let url = URL(fileURLWithPath: path)
      return NSWorkspace.shared.selectFile(nil, inFileViewerRootedAtPath: url.path)
    }

    AsyncFunction("which") { (binary: String) -> String? in
      let task = Process()
      let pipe = Pipe()

      task.executableURL = URL(fileURLWithPath: "/bin/zsh")
      task.arguments = ["-lc", "which \(binary)"]
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
      let symlinkPath = "/usr/local/bin/tlink"
      return FileManager.default.fileExists(atPath: symlinkPath)
    }

    AsyncFunction("installCli") { () -> [String: Any] in
      do {
        let cliBinary = getBundledCliBinaryURL()
        guard FileManager.default.fileExists(atPath: cliBinary.path) else {
          return ["success": false, "error": "CLI binary not found in bundle"]
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

      return ["success": true]
    }
  }
}
