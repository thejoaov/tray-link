import ExpoModulesCore
import Foundation

public class StorageModule: Module {
  private func supportDirectory() -> String {
    let home = FileManager.default.homeDirectoryForCurrentUser.path
    return "\(home)/Library/Application Support/TrayLink"
  }

  private func legacySupportDirectories() -> [String] {
    let home = FileManager.default.homeDirectoryForCurrentUser.path
    return [
      "\(home)/Library/Application Support/tray-link",
      "\(home)/Library/Application Support/Tray Link"
    ]
  }

  private func configPath() -> String {
    return "\(supportDirectory())/config.json"
  }

  private func resolveReadableConfigPath() -> String {
    let preferredPath = configPath()
    if FileManager.default.fileExists(atPath: preferredPath) {
      return preferredPath
    }

    for directory in legacySupportDirectories() {
      let candidate = "\(directory)/config.json"
      if FileManager.default.fileExists(atPath: candidate) {
        return candidate
      }
    }

    return preferredPath
  }

  private func migrateLegacyConfigIfNeeded() {
    let preferredPath = configPath()
    if FileManager.default.fileExists(atPath: preferredPath) {
      return
    }

    let legacyPath = resolveReadableConfigPath()
    if legacyPath == preferredPath || !FileManager.default.fileExists(atPath: legacyPath) {
      return
    }

    ensureSupportDirectory()
    try? FileManager.default.copyItem(atPath: legacyPath, toPath: preferredPath)
  }

  private func errorLogPath() -> String {
    return "\(supportDirectory())/error-log.json"
  }

  private func parseJSONStringValueIfNeeded(_ value: Any) -> Any {
    guard let stringValue = value as? String,
          let data = stringValue.data(using: .utf8),
          let parsed = try? JSONSerialization.jsonObject(with: data, options: [.fragmentsAllowed]) else {
      return value
    }

    switch parsed {
    case is [String: Any], is [Any], is NSNumber, is NSNull:
      return parsed
    default:
      return value
    }
  }

  private func serializeStoredValue(_ value: Any) -> String? {
    if let stringValue = value as? String {
      return stringValue
    }

    if let boolValue = value as? Bool {
      return boolValue ? "true" : "false"
    }

    if let numberValue = value as? NSNumber {
      return numberValue.stringValue
    }

    if value is NSNull {
      return "null"
    }

    guard JSONSerialization.isValidJSONObject(value),
          let data = try? JSONSerialization.data(withJSONObject: value, options: [.sortedKeys]) else {
      return nil
    }

    return String(data: data, encoding: .utf8)
  }

  private func readConfig() -> [String: Any] {
    migrateLegacyConfigIfNeeded()
    let path = resolveReadableConfigPath()
    guard FileManager.default.fileExists(atPath: path),
          let data = FileManager.default.contents(atPath: path),
          let json = try? JSONSerialization.jsonObject(with: data, options: []),
          let dict = json as? [String: Any] else {
      return [:]
    }

    var normalized = dict
    var changed = false

    for (key, value) in dict {
      let nextValue = parseJSONStringValueIfNeeded(value)
      let valueChanged = String(describing: nextValue) != String(describing: value)
      if valueChanged {
        normalized[key] = nextValue
        changed = true
      }
    }

    if changed {
      writeConfig(normalized)
    }

    return normalized
  }

  private func ensureSupportDirectory() {
    try? FileManager.default.createDirectory(atPath: supportDirectory(), withIntermediateDirectories: true, attributes: nil)
  }

  private func writeConfig(_ config: [String: Any]) {
    let path = configPath()
    ensureSupportDirectory()

    guard let data = try? JSONSerialization.data(withJSONObject: config, options: [.prettyPrinted, .sortedKeys]) else {
      return
    }
    var jsonString = String(data: data, encoding: .utf8) ?? "{}"
    jsonString = jsonString.replacingOccurrences(of: "  ", with: "\t")
    jsonString += "\n"
    try? jsonString.write(toFile: path, atomically: true, encoding: .utf8)
  }

  private func readErrorLog() -> [[String: Any]] {
    let path = errorLogPath()
    guard FileManager.default.fileExists(atPath: path),
          let data = FileManager.default.contents(atPath: path),
          let json = try? JSONSerialization.jsonObject(with: data, options: []),
          let entries = json as? [[String: Any]] else {
      return []
    }
    return entries
  }

  private func appendErrorLogEntry(_ entryJson: String) -> Bool {
    guard let data = entryJson.data(using: .utf8),
          let json = try? JSONSerialization.jsonObject(with: data, options: []),
          let entry = json as? [String: Any] else {
      return false
    }

    ensureSupportDirectory()

    var entries = readErrorLog()
    entries.append(entry)

    guard let encoded = try? JSONSerialization.data(withJSONObject: entries, options: [.prettyPrinted, .sortedKeys]) else {
      return false
    }

    var jsonString = String(data: encoded, encoding: .utf8) ?? "[]"
    jsonString = jsonString.replacingOccurrences(of: "  ", with: "\t")
    jsonString += "\n"

    do {
      try jsonString.write(toFile: errorLogPath(), atomically: true, encoding: .utf8)
      return true
    } catch {
      return false
    }
  }

  public func definition() -> ModuleDefinition {
    Name("Storage")

    AsyncFunction("setItem") { (key: String, value: String) -> Bool in
      var config = self.readConfig()
      config[key] = self.parseJSONStringValueIfNeeded(value)
      self.writeConfig(config)
      return true
    }

    AsyncFunction("getItem") { (key: String) -> String? in
      let config = self.readConfig()
      guard let value = config[key] else {
        return nil
      }
      return self.serializeStoredValue(value)
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

    AsyncFunction("appendErrorLog") { (entryJson: String) -> Bool in
      return self.appendErrorLogEntry(entryJson)
    }

    AsyncFunction("getErrorLogPath") { () -> String in
      return self.errorLogPath()
    }

    AsyncFunction("getConfigPath") { () -> String in
      self.migrateLegacyConfigIfNeeded()
      return self.configPath()
    }
  }
}
