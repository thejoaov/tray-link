import ExpoModulesCore
import Foundation

public class StorageModule: Module {
  private func configPath() -> String {
    let home = FileManager.default.homeDirectoryForCurrentUser.path
    return "\(home)/Library/Application Support/TrayLink/config.json"
  }

  private func readConfig() -> [String: Any] {
    let path = configPath()
    guard FileManager.default.fileExists(atPath: path),
          let data = FileManager.default.contents(atPath: path),
          let json = try? JSONSerialization.jsonObject(with: data, options: []),
          let dict = json as? [String: Any] else {
      return [:]
    }
    return dict
  }

  private func writeConfig(_ config: [String: Any]) {
    let path = configPath()
    let dir = (path as NSString).deletingLastPathComponent
    try? FileManager.default.createDirectory(atPath: dir, withIntermediateDirectories: true, attributes: nil)

    guard let data = try? JSONSerialization.data(withJSONObject: config, options: [.prettyPrinted, .sortedKeys]) else {
      return
    }
    // Convert spaces to tabs to match electron-store/conf format
    var jsonString = String(data: data, encoding: .utf8) ?? "{}"
    jsonString = jsonString.replacingOccurrences(of: "  ", with: "\t")
    jsonString += "\n"
    try? jsonString.write(toFile: path, atomically: true, encoding: .utf8)
  }

  public func definition() -> ModuleDefinition {
    Name("Storage")

    AsyncFunction("setItem") { (key: String, value: String) -> Bool in
      var config = self.readConfig()
      config[key] = value
      self.writeConfig(config)
      return true
    }

    AsyncFunction("getItem") { (key: String) -> String? in
      let config = self.readConfig()
      return config[key] as? String
    }

    AsyncFunction("removeItem") { (key: String) -> Bool in
      var config = self.readConfig()
      config.removeValue(forKey: key)
      self.writeConfig(config)
      return true
    }

    AsyncFunction("getAllKeys") { () -> [String] in
      let config = self.readConfig()
      return Array(config.keys)
    }

    AsyncFunction("clear") { () -> Bool in
      self.writeConfig([:])
      return true
    }
  }
}
