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
  }
}
